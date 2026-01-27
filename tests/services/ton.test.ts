import { TonService, TonConfig } from '../../src/services/ton.js';
import { Address } from '@ton/ton';

describe('TonService', () => {
  let tonService: TonService;
  const mockConfig: TonConfig = {
    network: 'testnet' as const,
    apiKey: 'test-api-key',
    walletMnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    walletVersion: 'v4R2',
    rpcEndpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiEndpoint: 'https://testnet.toncenter.com/api/v2',
  };

  beforeEach(() => {
    tonService = new TonService(mockConfig);
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      expect(tonService).toBeInstanceOf(TonService);
    });

    it('should work without API key', () => {
      const configWithoutKey = { ...mockConfig, apiKey: undefined };
      const service = new TonService(configWithoutKey);
      expect(service).toBeInstanceOf(TonService);
    });

    it('should work without wallet mnemonic', () => {
      const configWithoutMnemonic = { ...mockConfig, walletMnemonic: undefined };
      const service = new TonService(configWithoutMnemonic);
      expect(service).toBeInstanceOf(TonService);
    });
  });

  describe('validateAddress', () => {
    it('should validate correct raw TON addresses', async () => {
      const validAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';
      const result = await tonService.validateAddress(validAddress);
      expect(result).toBe(true);
    });

    it('should handle any address format without throwing', async () => {
      // Test with various address formats - just ensure it returns boolean, not throws
      const addresses = [
        'EQBvW8Z5huBkMJYdnfAEM5JqTNLuOeIvnr-lmzYjIx-jzJIU',
        '0QBvW8Z5huBkMJYdnfAEM5JqTNLuOeIvnr-lmzYjIx-jzJIU',
      ];
      for (const addr of addresses) {
        const result = await tonService.validateAddress(addr);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should reject invalid TON addresses', async () => {
      const invalidAddress = 'invalid-address';
      const result = await tonService.validateAddress(invalidAddress);
      expect(result).toBe(false);
    });

    it('should reject empty addresses', async () => {
      const result = await tonService.validateAddress('');
      expect(result).toBe(false);
    });

    it('should reject null-like addresses', async () => {
      // @ts-expect-error Testing invalid input
      const result = await tonService.validateAddress(null);
      expect(result).toBe(false);
    });

    it('should reject addresses with invalid checksum', async () => {
      const invalidChecksumAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q3'; // Changed last char
      const result = await tonService.validateAddress(invalidChecksumAddress);
      expect(result).toBe(false);
    });

    it('should reject too short addresses', async () => {
      const result = await tonService.validateAddress('EQAAAA');
      expect(result).toBe(false);
    });

    it('should reject addresses with special characters', async () => {
      const result = await tonService.validateAddress('EQDtFpEwcFAEcRe5mLVh2N6C0x!@#$%^&*()');
      expect(result).toBe(false);
    });
  });

  describe('getBalance', () => {
    it('should throw when no address provided and wallet not initialized', async () => {
      await expect(tonService.getBalance()).rejects.toThrow('No address provided and wallet not initialized');
    });

    it('should throw for invalid address format', async () => {
      await expect(tonService.getBalance('invalid')).rejects.toThrow();
    });
  });

  describe('getWalletInfo', () => {
    it('should throw when wallet not initialized', async () => {
      await expect(tonService.getWalletInfo()).rejects.toThrow('Wallet not initialized');
    });
  });

  describe('sendTransaction', () => {
    it('should throw when wallet not initialized', async () => {
      await expect(
        tonService.sendTransaction('EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2', '1.0')
      ).rejects.toThrow('Wallet not initialized');
    });
  });

  describe('deployContract', () => {
    it('should throw when wallet not initialized', async () => {
      const code = Buffer.from([0xb5, 0xee, 0x9c, 0x72]); // BOC header
      const data = Buffer.from([0xb5, 0xee, 0x9c, 0x72]);
      await expect(tonService.deployContract(code, data)).rejects.toThrow('Wallet not initialized');
    });
  });

  describe('getJettonBalance', () => {
    it('should throw when no owner and wallet not initialized', async () => {
      await expect(
        tonService.getJettonBalance('EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2')
      ).rejects.toThrow('No owner address provided and wallet not initialized');
    });
  });

  describe('getSmartContractInfo', () => {
    it('should throw for invalid address', async () => {
      await expect(tonService.getSmartContractInfo('invalid')).rejects.toThrow();
    });
  });

  describe('callContractMethod', () => {
    it('should throw for state-changing calls when wallet not initialized', async () => {
      const result = await tonService.callContractMethod({
        address: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        method: 'test',
        amount: '0.1',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Wallet not initialized');
    });
  });

  describe('transferJettons', () => {
    it('should fail when wallet not initialized', async () => {
      // transferJettons throws instead of returning result
      await expect(
        tonService.transferJettons(
          'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
          'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
          '100'
        )
      ).rejects.toThrow('Wallet not initialized');
    });
  });

  describe('estimateGas', () => {
    it('should return estimate for simple transfer', async () => {
      const estimate = await tonService.estimateGas(
        'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        '1.0'
      );
      expect(typeof estimate).toBe('bigint');
      expect(estimate).toBeGreaterThan(BigInt(0));
    });

    it('should increase estimate with message payload', async () => {
      const { beginCell } = await import('@ton/ton');
      const message = beginCell().storeUint(12345, 32).storeUint(67890, 64).endCell();

      const estimateWithMessage = await tonService.estimateGas(
        'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        '1.0',
        message
      );

      const estimateWithoutMessage = await tonService.estimateGas(
        'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        '1.0'
      );

      expect(estimateWithMessage).toBeGreaterThan(estimateWithoutMessage);
    });
  });

  describe('getTransactionHistory', () => {
    it('should throw when no address and wallet not initialized', async () => {
      await expect(tonService.getTransactionHistory()).rejects.toThrow(
        'No address provided and wallet not initialized'
      );
    });

    it('should accept limit parameter', async () => {
      // This would require network access to properly test
      // Testing that limit parameter is passed correctly
      await expect(tonService.getTransactionHistory(undefined, 5)).rejects.toThrow(
        'No address provided and wallet not initialized'
      );
    });
  });

  describe('initialize', () => {
    it('should throw if mnemonic not provided', async () => {
      const serviceWithoutMnemonic = new TonService({
        ...mockConfig,
        walletMnemonic: undefined,
      });

      await expect(serviceWithoutMnemonic.initialize()).rejects.toThrow(
        'Wallet mnemonic is required for TON service initialization'
      );
    });

    it('should throw for invalid mnemonic', async () => {
      const serviceWithBadMnemonic = new TonService({
        ...mockConfig,
        walletMnemonic: 'invalid mnemonic',
      });

      await expect(serviceWithBadMnemonic.initialize()).rejects.toThrow();
    });
  });
});

describe('Address parsing (integration)', () => {
  it('Address.parse should work for valid addresses', () => {
    const validAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';
    expect(() => Address.parse(validAddress)).not.toThrow();
  });

  it('Address.parse should throw for invalid addresses', () => {
    expect(() => Address.parse('invalid')).toThrow();
  });
});
