import { TonClient, WalletContractV4, internal, fromNano, toNano, Address } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { logger } from '../utils/logger.js';

export interface TonConfig {
  network: 'mainnet' | 'testnet';
  apiKey: string;
  walletMnemonic: string;
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

export class TonService {
  private client: TonClient;
  private wallet: WalletContractV4 | null = null;
  private walletAddress: string = '';
  private keyPair: any = null;

  constructor(private config: TonConfig) {
    this.client = new TonClient({
      endpoint: config.rpcEndpoint,
      apiKey: config.apiKey,
    });
  }

  async initialize(): Promise<void> {
    try {
      const mnemonic = this.config.walletMnemonic.split(' ');
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
      
      const transfer = await contract.sendTransfer({
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

      logger.info(`Transaction sent: ${transfer.hash}`);

      return {
        hash: transfer.hash,
        status: 'pending',
        amount,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to send transaction:', error);
      throw error;
    }
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
        amount: fromNano(tx.inMessage?.info.value || 0n),
        fee: fromNano(tx.totalFees || 0n),
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
        amount: fromNano(tx.inMessage?.info.value || 0n),
        fee: fromNano(tx.totalFees || 0n),
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
      
      const deploy = await contract.sendDeploy({
        secretKey: this.keyPair.secretKey,
        seqno,
        code,
        data,
      });

      logger.info(`Contract deployed: ${deploy.hash}`);
      return deploy.hash;
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
      
      const jettonWalletAddress = await this.client.runMethod(
        jettonMaster,
        'get_wallet_address',
        [{ type: 'slice', cell: owner.toCell() }]
      );
      
      const walletAddress = jettonWalletAddress.stack.readAddress();
      
      const balance = await this.client.runMethod(
        walletAddress,
        'get_balance',
        []
      );
      
      return balance.stack.readBigNumber().toString();
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
}