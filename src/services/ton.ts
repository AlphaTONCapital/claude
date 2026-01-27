import { TonClient, WalletContractV4, internal, fromNano, toNano, Address, Cell, beginCell, Dictionary } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';

export interface TonConfig {
  network: 'mainnet' | 'testnet';
  apiKey?: string;
  walletMnemonic?: string;
  walletVersion: string;
  rpcEndpoint: string;
  apiEndpoint: string;
}

export interface TransactionResult {
  hash: string;
  status: 'success' | 'pending' | 'failed';
  amount: string;
  fee?: string;
  timestamp: number;
}

export interface WalletInfo {
  address: string;
  balance: string;
  isActive: boolean;
  lastTransactionHash?: string;
}

export interface SmartContractInfo {
  address: string;
  balance: string;
  code?: string;
  data?: string;
  isActive: boolean;
  codeHash: string;
}

export interface ContractCallParams {
  address: string;
  method: string;
  params?: any[];
  amount?: string;
  gasLimit?: bigint;
}

export interface ContractCallResult {
  success: boolean;
  result?: any;
  gasUsed?: bigint;
  error?: string;
  txHash?: string;
}

export interface JettonInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  mintable: boolean;
}

export class TonService {
  private client: TonClient;
  private wallet: WalletContractV4 | null = null;
  private walletAddress: string = '';
  private keyPair: any = null;

  constructor(private config: TonConfig) {
    this.client = new TonClient({
      endpoint: config.rpcEndpoint,
      ...(config.apiKey && { apiKey: config.apiKey }),
    });
  }

  async initialize(): Promise<void> {
    if (!this.config.walletMnemonic) {
      throw new Error('Wallet mnemonic is required for TON service initialization');
    }

    try {
      const mnemonic = this.config.walletMnemonic.split(' ');

      // Validate mnemonic has correct word count (12, 15, 18, 21, or 24 words)
      const validWordCounts = [12, 15, 18, 21, 24];
      if (!validWordCounts.includes(mnemonic.length)) {
        throw new Error(`Invalid mnemonic: expected 12, 15, 18, 21, or 24 words, got ${mnemonic.length}`);
      }

      this.keyPair = await mnemonicToPrivateKey(mnemonic);
      
      this.wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: this.keyPair.publicKey,
      });
      
      this.walletAddress = this.wallet.address.toString();
      logger.info(`TON wallet initialized: ${this.walletAddress}`);
    } catch (error) {
      logger.error('Failed to initialize TON wallet:', error);
      throw error;
    }
  }

  async getWalletInfo(): Promise<WalletInfo> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balance = await this.client.getBalance(this.wallet.address);
      const state = await this.client.getContractState(this.wallet.address);
      
      const transactions = await this.client.getTransactions(this.wallet.address, {
        limit: 1,
      });

      return {
        address: this.walletAddress,
        balance: fromNano(balance),
        isActive: state.state === 'active',
        lastTransactionHash: transactions.length > 0 ? transactions[0].hash().toString('hex') : undefined,
      };
    } catch (error) {
      logger.error('Failed to get wallet info:', error);
      throw error;
    }
  }

  async getBalance(address?: string): Promise<string> {
    try {
      const targetAddress = address ? Address.parse(address) : this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No address provided and wallet not initialized');
      }

      const balance = await this.client.getBalance(targetAddress);
      return fromNano(balance);
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  async sendTransaction(
    toAddress: string,
    amount: string,
    comment?: string
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.keyPair) {
      throw new Error('Wallet not initialized');
    }

    try {
      const contract = this.client.open(this.wallet);
      const seqno = await contract.getSeqno();

      await contract.sendTransfer({
        secretKey: this.keyPair.secretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(toAddress),
            value: toNano(amount),
            body: comment || '',
          }),
        ],
      });

      // Wait for transaction to be confirmed and get real hash
      const transactionHash = await this.waitForTransaction(seqno);
      logger.info(`Transaction confirmed: ${transactionHash}`);

      return {
        hash: transactionHash,
        status: 'success',
        amount,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to send transaction:', error);
      throw error;
    }
  }

  private async waitForTransaction(seqno: number, maxAttempts: number = 30, intervalMs: number = 1000): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const contract = this.client.open(this.wallet);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));

      const currentSeqno = await contract.getSeqno();
      if (currentSeqno > seqno) {
        // Transaction confirmed, get the hash from recent transactions
        const transactions = await this.client.getTransactions(this.wallet.address, { limit: 5 });
        if (transactions.length > 0) {
          return transactions[0].hash().toString('hex');
        }
      }
    }

    throw new Error(`Transaction not confirmed after ${maxAttempts} attempts`);
  }

  async getTransactionStatus(hash: string): Promise<TransactionResult> {
    try {
      const transactions = await this.client.getTransactions(this.wallet!.address, {
        limit: 100,
      });

      const tx = transactions.find(t => t.hash().toString('hex') === hash);
      
      if (!tx) {
        return {
          hash,
          status: 'pending',
          amount: '0',
          timestamp: Date.now(),
        };
      }

      return {
        hash,
        status: 'success',
        amount: fromNano(
          tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.value.coins : 0n
        ),
        fee: fromNano(tx.totalFees.coins),
        timestamp: tx.now * 1000,
      };
    } catch (error) {
      logger.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  async getTransactionHistory(
    address?: string,
    limit: number = 10
  ): Promise<TransactionResult[]> {
    try {
      const targetAddress = address ? Address.parse(address) : this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No address provided and wallet not initialized');
      }

      const transactions = await this.client.getTransactions(targetAddress, {
        limit,
      });

      return transactions.map(tx => ({
        hash: tx.hash().toString('hex'),
        status: 'success' as const,
        amount: fromNano(
          tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.value.coins : 0n
        ),
        fee: fromNano(tx.totalFees.coins),
        timestamp: tx.now * 1000,
      }));
    } catch (error) {
      logger.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  async deployContract(code: Buffer, data: Buffer): Promise<string> {
    if (!this.wallet || !this.keyPair) {
      throw new Error('Wallet not initialized');
    }

    try {
      const contract = this.client.open(this.wallet);
      const seqno = await contract.getSeqno();

      // Parse code and data from Buffers to Cells
      const codeCell = Cell.fromBoc(code)[0];
      const dataCell = Cell.fromBoc(data)[0];

      // Calculate the contract address from StateInit
      const stateInit = beginCell()
        .storeUint(0, 2)
        .storeMaybeRef(codeCell)
        .storeMaybeRef(dataCell)
        .endCell();

      const contractAddress = new Address(0, stateInit.hash());

      // Deploy using sendTransfer with init
      await contract.sendTransfer({
        secretKey: this.keyPair.secretKey,
        seqno,
        messages: [
          internal({
            to: contractAddress,
            value: toNano('0.1'),
            init: {
              code: codeCell,
              data: dataCell,
            },
            body: new Cell(),
          }),
        ],
      });

      // Wait for transaction to be confirmed and get real hash
      const deployHash = await this.waitForTransaction(seqno);
      logger.info(`Contract deployed at ${contractAddress.toString()}, tx: ${deployHash}`);
      return deployHash;
    } catch (error) {
      logger.error('Failed to deploy contract:', error);
      throw error;
    }
  }

  async getJettonBalance(
    jettonMasterAddress: string,
    ownerAddress?: string
  ): Promise<string> {
    try {
      const owner = ownerAddress ? Address.parse(ownerAddress) : this.wallet?.address;
      if (!owner) {
        throw new Error('No owner address provided and wallet not initialized');
      }

      const jettonMaster = Address.parse(jettonMasterAddress);

      // Get the Jetton wallet address for the owner using get_wallet_address
      const walletAddressResult = await this.client.runMethod(
        jettonMaster,
        'get_wallet_address',
        [{ type: 'slice', cell: beginCell().storeAddress(owner).endCell() }]
      );

      const jettonWalletAddress = walletAddressResult.stack.readAddress();
      if (!jettonWalletAddress) {
        throw new Error('Failed to get Jetton wallet address');
      }

      // Query the Jetton wallet for balance using get_wallet_data
      const walletData = await this.client.runMethod(
        jettonWalletAddress,
        'get_wallet_data',
        []
      );

      const balance = walletData.stack.readBigNumber();
      return fromNano(balance);
    } catch (error) {
      logger.error('Failed to get Jetton balance:', error);
      throw error;
    }
  }

  async getNFTInfo(nftAddress: string): Promise<any> {
    try {
      const address = Address.parse(nftAddress);
      
      const nftData = await this.client.runMethod(
        address,
        'get_nft_data',
        []
      );
      
      const initialized = nftData.stack.readBoolean();
      const index = nftData.stack.readBigNumber();
      const collection = nftData.stack.readAddress();
      const owner = nftData.stack.readAddress();
      const content = nftData.stack.readCell();
      
      return {
        initialized,
        index: index.toString(),
        collection: collection?.toString(),
        owner: owner?.toString(),
        content: content.toString(),
        address: nftAddress,
      };
    } catch (error) {
      logger.error('Failed to get NFT info:', error);
      throw error;
    }
  }

  // Enhanced Smart Contract Features

  async getSmartContractInfo(address: string): Promise<SmartContractInfo> {
    try {
      const contractAddress = Address.parse(address);
      const state = await this.client.getContractState(contractAddress);
      
      return {
        address,
        balance: fromNano(state.balance),
        code: state.code?.toString('hex'),
        data: state.data?.toString('hex'),
        isActive: state.state === 'active',
        codeHash: state.code ? Cell.fromBoc(state.code)[0].hash().toString('hex') : '',
      };
    } catch (error) {
      logger.error('Failed to get smart contract info:', error);
      throw error;
    }
  }

  async callContractMethod(params: ContractCallParams): Promise<ContractCallResult> {
    try {
      const contractAddress = Address.parse(params.address);

      // For read-only method calls (getters)
      if (!params.amount && (!params.params || params.params.length === 0)) {
        const result = await this.client.runMethod(
          contractAddress,
          params.method,
          params.params || []
        );

        return {
          success: true,
          result: this.parseStackValue(result.stack),
          gasUsed: BigInt(result.gas_used),
        };
      }

      // For state-changing method calls
      if (!this.wallet || !this.keyPair) {
        throw new Error('Wallet not initialized for state-changing calls');
      }

      const contract = this.client.open(this.wallet);
      const seqno = await contract.getSeqno();

      // Build method call body
      const body = this.buildMethodCallBody(params.method, params.params || []);

      await contract.sendTransfer({
        secretKey: this.keyPair.secretKey,
        seqno,
        messages: [
          internal({
            to: contractAddress,
            value: toNano(params.amount || '0.1'),
            body,
          }),
        ],
      });

      // Wait for transaction confirmation and get real hash
      const txHash = await this.waitForTransaction(seqno);

      return {
        success: true,
        txHash,
        gasUsed: params.gasLimit,
      };
    } catch (error) {
      logger.error('Failed to call contract method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deploySmartContract(
    code: Cell,
    data: Cell,
    amount: string = '0.1'
  ): Promise<ContractCallResult> {
    if (!this.wallet || !this.keyPair) {
      throw new Error('Wallet not initialized');
    }

    try {
      const contract = this.client.open(this.wallet);
      const seqno = await contract.getSeqno();

      // Calculate contract address
      const stateInit = beginCell()
        .storeUint(0, 2) // split_depth:(Maybe (## 5)) special:(Maybe TickTock)
        .storeMaybeRef(code)
        .storeMaybeRef(data)
        .endCell();

      const contractAddress = new Address(0, stateInit.hash());

      await contract.sendTransfer({
        secretKey: this.keyPair.secretKey,
        seqno,
        messages: [
          internal({
            to: contractAddress,
            value: toNano(amount),
            init: {
              code,
              data,
            },
            body: new Cell(), // Empty body for deployment
          }),
        ],
      });

      // Wait for transaction confirmation and get real hash
      const txHash = await this.waitForTransaction(seqno);

      logger.info(`Smart contract deployed at ${contractAddress.toString()}, tx: ${txHash}`);

      return {
        success: true,
        result: {
          address: contractAddress.toString(),
          deploymentHash: txHash,
        },
        txHash,
      };
    } catch (error) {
      logger.error('Failed to deploy smart contract:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getJettonInfo(jettonMasterAddress: string): Promise<JettonInfo> {
    try {
      const address = Address.parse(jettonMasterAddress);
      
      const jettonData = await this.client.runMethod(
        address,
        'get_jetton_data',
        []
      );
      
      const totalSupply = jettonData.stack.readBigNumber();
      const mintable = jettonData.stack.readBoolean();
      jettonData.stack.readAddress(); // Skip admin address
      const content = jettonData.stack.readCell();
      
      // Parse content to get metadata
      const metadata = this.parseJettonMetadata(content);
      
      return {
        address: jettonMasterAddress,
        name: metadata.name || 'Unknown',
        symbol: metadata.symbol || 'UNKNOWN',
        decimals: metadata.decimals || 9,
        totalSupply: fromNano(totalSupply),
        mintable,
      };
    } catch (error) {
      logger.error('Failed to get Jetton info:', error);
      throw error;
    }
  }

  async transferJettons(
    jettonWalletAddress: string,
    toAddress: string,
    amount: string,
    forwardAmount: string = '0.01'
  ): Promise<ContractCallResult> {
    if (!this.wallet || !this.keyPair) {
      throw new Error('Wallet not initialized');
    }

    try {
      const contract = this.client.open(this.wallet);
      const seqno = await contract.getSeqno();

      // Build Jetton transfer body (TEP-74 standard)
      const transferBody = beginCell()
        .storeUint(0xf8a7ea5, 32) // transfer op
        .storeUint(Date.now(), 64) // query_id
        .storeCoins(toNano(amount))
        .storeAddress(Address.parse(toAddress))
        .storeAddress(this.wallet.address) // response_destination
        .storeBit(false) // custom_payload
        .storeCoins(toNano(forwardAmount))
        .storeBit(false) // forward_payload
        .endCell();

      await contract.sendTransfer({
        secretKey: this.keyPair.secretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(jettonWalletAddress),
            value: toNano('0.1'), // Gas for transaction
            body: transferBody,
          }),
        ],
      });

      // Wait for transaction confirmation and get real hash
      const txHash = await this.waitForTransaction(seqno);

      return {
        success: true,
        txHash,
      };
    } catch (error) {
      logger.error('Failed to transfer Jettons:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Estimates gas/fees for a transaction.
   *
   * NOTE: TON uses a different fee model than EVM chains. Fees depend on:
   * - Storage fees (based on contract state size)
   * - Gas fees (based on computation)
   * - Forward fees (for internal messages)
   *
   * This method provides a conservative estimate based on typical transaction costs.
   * For precise fees, use the TON emulator or wait for actual transaction confirmation.
   *
   * @returns Estimated fee in nanoTON
   */
  async estimateGas(
    toAddress: string,
    amount: string,
    message?: Cell
  ): Promise<bigint> {
    try {
      // Base fees for a simple transfer on TON (in nanoTON)
      // These are conservative estimates based on typical mainnet costs
      const baseFee = BigInt(5_000_000); // ~0.005 TON base fee

      // Additional fee for message payload
      let messageFee = BigInt(0);
      if (message) {
        const bits = message.bits.length;
        const cells = this.countCells(message);
        // Fee scales with message size: ~0.001 TON per 1000 bits, ~0.0005 TON per cell
        messageFee = BigInt(Math.ceil(bits / 1000) * 1_000_000) + BigInt(cells * 500_000);
      }

      // Forward fee for internal messages (approximately 0.003 TON)
      const forwardFee = BigInt(3_000_000);

      const totalEstimate = baseFee + messageFee + forwardFee;

      logger.debug(`Gas estimate: base=${baseFee}, message=${messageFee}, forward=${forwardFee}, total=${totalEstimate}`);

      return totalEstimate;
    } catch (error) {
      logger.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  private countCells(cell: Cell): number {
    let count = 1;
    for (const ref of cell.refs) {
      count += this.countCells(ref);
    }
    return count;
  }

  // Helper methods

  /**
   * Build a method call body for a smart contract.
   *
   * Supported param formats:
   * - { type: 'uint', value: number, bits?: number } - Unsigned integer
   * - { type: 'int', value: number, bits?: number } - Signed integer
   * - { type: 'coins', value: string } - Coins amount (TON)
   * - { type: 'address', value: string } - TON address
   * - { type: 'bool', value: boolean } - Boolean bit
   * - { type: 'cell', value: Cell } - Cell reference
   * - { type: 'slice', value: Cell } - Slice from cell
   * - Raw values are auto-detected (legacy support)
   */
  private buildMethodCallBody(method: string, params: any[], customOpcode?: number): Cell {
    const builder = beginCell();

    // Store method opcode (32 bits)
    builder.storeUint(this.methodToOpcode(method, customOpcode), 32);

    // Store query_id (64 bits) - required by many TON contracts
    builder.storeUint(Date.now(), 64);

    for (const param of params) {
      if (param && typeof param === 'object' && 'type' in param) {
        // Typed parameter format
        switch (param.type) {
          case 'uint':
            builder.storeUint(param.value, param.bits || 32);
            break;
          case 'int':
            builder.storeInt(param.value, param.bits || 32);
            break;
          case 'coins':
            builder.storeCoins(toNano(param.value));
            break;
          case 'address':
            builder.storeAddress(Address.parse(param.value));
            break;
          case 'bool':
            builder.storeBit(param.value);
            break;
          case 'cell':
            builder.storeRef(param.value);
            break;
          case 'slice':
            builder.storeSlice(param.value.beginParse());
            break;
          case 'opcode':
            // Allow overriding the method opcode after the fact
            // This is for special cases where opcode was already stored
            break;
          default:
            logger.warn(`Unknown param type: ${param.type}, skipping`);
        }
      } else if (typeof param === 'number') {
        // Legacy: raw number as uint32
        builder.storeUint(param, 32);
      } else if (typeof param === 'bigint') {
        builder.storeUint(param, 64);
      } else if (typeof param === 'string') {
        // Legacy: try to parse as address, then as coins, then as uint
        try {
          const addr = Address.parse(param);
          builder.storeAddress(addr);
        } catch {
          if (param.includes('.') || param.match(/^\d+$/)) {
            builder.storeCoins(toNano(param));
          } else {
            // Store as raw bytes
            const bytes = Buffer.from(param, 'utf-8');
            builder.storeBuffer(bytes);
          }
        }
      } else if (typeof param === 'boolean') {
        builder.storeBit(param);
      } else if (param instanceof Cell) {
        builder.storeRef(param);
      }
    }

    return builder.endCell();
  }

  /**
   * Standard TON opcodes for common operations.
   * For custom contracts, the opcode must be provided explicitly in params.
   */
  private static readonly STANDARD_OPCODES: Record<string, number> = {
    // Jetton operations (TEP-74)
    'transfer': 0xf8a7ea5,
    'transfer_notification': 0x7362d09c,
    'internal_transfer': 0x178d4519,
    'excesses': 0xd53276db,
    'burn': 0x595f07bc,
    'burn_notification': 0x7bdd97de,

    // NFT operations (TEP-62)
    'transfer_nft': 0x5fcc3d14,
    'ownership_assigned': 0x05138d91,
    'get_static_data': 0x2fcb26a2,
    'report_static_data': 0x8b771735,

    // Common wallet operations
    'deploy': 0x0,
    'simple_transfer': 0x0,
  };

  private methodToOpcode(method: string, customOpcode?: number): number {
    // If a custom opcode is provided, use it
    if (customOpcode !== undefined) {
      return customOpcode;
    }

    // Check for standard opcodes
    const standardOpcode = TonService.STANDARD_OPCODES[method.toLowerCase()];
    if (standardOpcode !== undefined) {
      return standardOpcode;
    }

    // For unknown methods, compute CRC32 hash (TON standard for method IDs)
    // This matches how FunC computes method_id from function names
    const crc32 = this.computeCrc32(method);
    logger.warn(`Using computed opcode for unknown method '${method}': 0x${crc32.toString(16)}`);
    return crc32;
  }

  private computeCrc32(str: string): number {
    // Standard CRC-32 polynomial used by TON
    const table = TonService.getCrc32Table();
    let crc = 0xFFFFFFFF;

    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  private static crc32Table: Uint32Array | null = null;

  private static getCrc32Table(): Uint32Array {
    if (TonService.crc32Table) {
      return TonService.crc32Table;
    }

    const table = new Uint32Array(256);
    const polynomial = 0xEDB88320;

    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 1) ? (crc >>> 1) ^ polynomial : crc >>> 1;
      }
      table[i] = crc;
    }

    TonService.crc32Table = table;
    return table;
  }

  private parseStackValue(stack: any): any {
    const result: any = {};
    let index = 0;
    
    try {
      while (stack.remaining > 0) {
        const value = stack.pop();
        result[`value_${index++}`] = this.formatStackValue(value);
      }
    } catch {
      // Stack exhausted
    }
    
    return index === 1 ? result.value_0 : result;
  }

  private formatStackValue(value: any): any {
    if (value.type === 'int') {
      return value.value.toString();
    } else if (value.type === 'cell') {
      return value.cell.toString('hex');
    } else if (value.type === 'slice') {
      return value.cell.toString('hex');
    } else {
      return value.toString();
    }
  }

  /**
   * Parse Jetton metadata from content cell (TEP-64 standard)
   */
  private parseJettonMetadata(content: Cell): any {
    try {
      const slice = content.beginParse();
      const metadata: any = {};

      // Read content layout prefix (0x00 = on-chain, 0x01 = off-chain)
      const prefix = slice.loadUint(8);

      if (prefix === 0x00) {
        // On-chain metadata in dict format (TEP-64)
        // Dictionary key is sha256 hash of key name (256 bits)
        const dict = slice.loadDict(
          Dictionary.Keys.BigUint(256),
          Dictionary.Values.Cell()
        );

        // Standard TEP-64 metadata keys - sha256 hashes of key names
        const nameKey = this.sha256ToBigInt('name');
        const symbolKey = this.sha256ToBigInt('symbol');
        const decimalsKey = this.sha256ToBigInt('decimals');
        const descriptionKey = this.sha256ToBigInt('description');
        const imageKey = this.sha256ToBigInt('image');

        const nameCell = dict.get(nameKey);
        const symbolCell = dict.get(symbolKey);
        const decimalsCell = dict.get(decimalsKey);
        const descriptionCell = dict.get(descriptionKey);
        const imageCell = dict.get(imageKey);

        if (nameCell) {
          metadata.name = this.parseSnakeData(nameCell);
        }

        if (symbolCell) {
          metadata.symbol = this.parseSnakeData(symbolCell);
        }

        if (decimalsCell) {
          const decimalsStr = this.parseSnakeData(decimalsCell);
          metadata.decimals = parseInt(decimalsStr, 10);
        }

        if (descriptionCell) {
          metadata.description = this.parseSnakeData(descriptionCell);
        }

        if (imageCell) {
          metadata.image = this.parseSnakeData(imageCell);
        }
      } else if (prefix === 0x01) {
        // Off-chain metadata - content is a URL
        metadata.uri = slice.loadStringTail();
        metadata.offchain = true;
      }

      // Apply defaults for missing values
      metadata.name = metadata.name || 'Unknown';
      metadata.symbol = metadata.symbol || 'UNKNOWN';
      metadata.decimals = metadata.decimals ?? 9;

      return metadata;
    } catch (error) {
      logger.error('Failed to parse Jetton metadata:', error);
      return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 9 };
    }
  }

  /**
   * Compute SHA256 hash of a string and return as BigInt (for TEP-64 dict keys)
   */
  private sha256ToBigInt(str: string): bigint {
    const hash = createHash('sha256').update(str).digest();
    return BigInt('0x' + hash.toString('hex'));
  }

  /**
   * Parse snake-format data from a cell (TEP-64)
   * Snake format: prefix byte (0x00) followed by data, continues in refs
   */
  private parseSnakeData(cell: Cell): string {
    let result = '';
    let current: Cell | null = cell;

    while (current) {
      const slice = current.beginParse();
      const prefix = slice.loadUint(8);

      if (prefix === 0x00) {
        // Snake format continuation
        const data = slice.loadBuffer(Math.floor(slice.remainingBits / 8));
        result += data.toString('utf-8');

        // Check for continuation in refs
        if (slice.remainingRefs > 0) {
          current = slice.loadRef();
        } else {
          current = null;
        }
      } else {
        // Not snake format, try to read as raw string
        const fullSlice = cell.beginParse();
        const bits = fullSlice.remainingBits;
        if (bits > 0) {
          const data = fullSlice.loadBuffer(Math.floor(bits / 8));
          result = data.toString('utf-8');
        }
        break;
      }
    }

    return result;
  }
}