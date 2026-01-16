import { TonService } from '../services/ton.js';
import { logger } from '../utils/logger.js';

export const tonTools = [
  {
    name: 'ton_get_wallet_info',
    description: 'Get information about the configured TON wallet',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ton_get_balance',
    description: 'Get TON balance for an address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'TON wallet address (optional, defaults to configured wallet)',
        },
      },
    },
  },
  {
    name: 'ton_send_transaction',
    description: 'Send TON tokens to another address',
    inputSchema: {
      type: 'object',
      properties: {
        toAddress: {
          type: 'string',
          description: 'Recipient TON address',
        },
        amount: {
          type: 'string',
          description: 'Amount of TON to send',
        },
        comment: {
          type: 'string',
          description: 'Optional comment for the transaction',
        },
      },
      required: ['toAddress', 'amount'],
    },
  },
  {
    name: 'ton_get_transaction_status',
    description: 'Get the status of a transaction by hash',
    inputSchema: {
      type: 'object',
      properties: {
        hash: {
          type: 'string',
          description: 'Transaction hash',
        },
      },
      required: ['hash'],
    },
  },
  {
    name: 'ton_get_transaction_history',
    description: 'Get transaction history for an address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'TON wallet address (optional, defaults to configured wallet)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of transactions to retrieve',
          default: 10,
        },
      },
    },
  },
  {
    name: 'ton_validate_address',
    description: 'Validate if a string is a valid TON address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Address to validate',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'ton_get_jetton_balance',
    description: 'Get Jetton token balance for an address',
    inputSchema: {
      type: 'object',
      properties: {
        jettonMasterAddress: {
          type: 'string',
          description: 'Jetton master contract address',
        },
        ownerAddress: {
          type: 'string',
          description: 'Owner address (optional, defaults to configured wallet)',
        },
      },
      required: ['jettonMasterAddress'],
    },
  },
  {
    name: 'ton_get_nft_info',
    description: 'Get information about an NFT',
    inputSchema: {
      type: 'object',
      properties: {
        nftAddress: {
          type: 'string',
          description: 'NFT contract address',
        },
      },
      required: ['nftAddress'],
    },
  },
];

export const tonResources = [
  {
    uri: 'ton://wallet',
    name: 'TON Wallet',
    description: 'Current TON wallet information',
    mimeType: 'application/json',
  },
  {
    uri: 'ton://transactions',
    name: 'TON Transactions',
    description: 'Recent TON transactions',
    mimeType: 'application/json',
  },
];

export async function handleTonToolCall(name: string, args: any, tonService: TonService) {
  switch (name) {
    case 'ton_get_wallet_info': {
      try {
        const info = await tonService.getWalletInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Error getting wallet info:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get wallet info: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'ton_get_balance': {
      const { address } = args as { address?: string };
      try {
        const balance = await tonService.getBalance(address);
        return {
          content: [
            {
              type: 'text',
              text: `Balance: ${balance} TON`,
            },
          ],
        };
      } catch (error) {
        logger.error('Error getting balance:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get balance: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'ton_send_transaction': {
      const { toAddress, amount, comment } = args as {
        toAddress: string;
        amount: string;
        comment?: string;
      };
      try {
        const result = await tonService.sendTransaction(toAddress, amount, comment);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Error sending transaction:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to send transaction: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'ton_get_transaction_status': {
      const { hash } = args as { hash: string };
      try {
        const status = await tonService.getTransactionStatus(hash);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Error getting transaction status:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get transaction status: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'ton_get_transaction_history': {
      const { address, limit = 10 } = args as {
        address?: string;
        limit?: number;
      };
      try {
        const history = await tonService.getTransactionHistory(address, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(history, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Error getting transaction history:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get transaction history: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'ton_validate_address': {
      const { address } = args as { address: string };
      try {
        const isValid = await tonService.validateAddress(address);
        return {
          content: [
            {
              type: 'text',
              text: `Address is ${isValid ? 'valid' : 'invalid'}`,
            },
          ],
        };
      } catch (error) {
        logger.error('Error validating address:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to validate address: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'ton_get_jetton_balance': {
      const { jettonMasterAddress, ownerAddress } = args as {
        jettonMasterAddress: string;
        ownerAddress?: string;
      };
      try {
        const balance = await tonService.getJettonBalance(
          jettonMasterAddress,
          ownerAddress
        );
        return {
          content: [
            {
              type: 'text',
              text: `Jetton balance: ${balance}`,
            },
          ],
        };
      } catch (error) {
        logger.error('Error getting Jetton balance:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get Jetton balance: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'ton_get_nft_info': {
      const { nftAddress } = args as { nftAddress: string };
      try {
        const info = await tonService.getNFTInfo(nftAddress);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Error getting NFT info:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get NFT info: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      return null;
  }
}

export async function handleTonResourceRead(uri: string, tonService: TonService) {
  if (uri === 'ton://wallet') {
    try {
      const info = await tonService.getWalletInfo();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Error reading TON wallet resource:', error);
      throw error;
    }
  }

  if (uri === 'ton://transactions') {
    try {
      const transactions = await tonService.getTransactionHistory(undefined, 20);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(transactions, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Error reading TON transactions resource:', error);
      throw error;
    }
  }

  return null;
}
