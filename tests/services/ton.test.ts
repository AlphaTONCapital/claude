import { TonService } from '../../src/services/ton';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('TonService', () => {
  let tonService: TonService;
  
  beforeEach(() => {
    const mockConfig = {
      network: 'testnet' as const,
      apiKey: 'test-api-key',
      walletMnemonic: 'test mnemonic phrase here',
      walletVersion: 'v4R2',
      rpcEndpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiEndpoint: 'https://testnet.toncenter.com/api/v2',
    };
    
    tonService = new TonService(mockConfig);
  });

  describe('validateAddress', () => {
    it('should validate correct TON addresses', async () => {
      const validAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';
      const result = await tonService.validateAddress(validAddress);
      expect(result).toBe(true);
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
  });

  describe('getBalance', () => {
    it('should handle missing address gracefully', async () => {
      await expect(tonService.getBalance()).rejects.toThrow('No address provided and wallet not initialized');
    });
  });
});