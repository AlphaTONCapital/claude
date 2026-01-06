import express from 'express';
import { createServer } from 'http';
import { logger } from '../utils/logger.js';
import { TonService } from '../services/ton.js';
import { ConversationManager } from '../services/conversation.js';
import { ClaudeService } from '../services/claude.js';
import crypto from 'crypto';

export interface MiniAppConfig {
  port: number;
  secret: string;
  tonService: TonService;
  claudeService: ClaudeService;
  conversationManager: ConversationManager;
}

export class MiniAppServer {
  private app: express.Application;
  private server: any;
  private config: MiniAppConfig;

  constructor(config: MiniAppConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });

    this.app.use((req, res, next) => {
      const initData = req.headers['x-telegram-init-data'] as string;
      
      if (initData && !this.validateTelegramWebAppData(initData)) {
        return res.status(401).json({ error: 'Invalid Telegram Web App data' });
      }
      
      next();
    });
  }

  private validateTelegramWebAppData(initData: string): boolean {
    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');
      
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.config.secret)
        .digest();
      
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      return calculatedHash === hash;
    } catch (error) {
      logger.error('Error validating Telegram Web App data:', error);
      return false;
    }
  }

  private setupRoutes() {
    this.app.get('/api/wallet', async (req, res) => {
      try {
        const walletInfo = await this.config.tonService.getWalletInfo();
        res.json(walletInfo);
      } catch (error) {
        logger.error('Error getting wallet info:', error);
        res.status(500).json({ error: 'Failed to get wallet info' });
      }
    });

    this.app.get('/api/balance/:address?', async (req, res) => {
      try {
        const address = req.params.address;
        const balance = await this.config.tonService.getBalance(address);
        res.json({ balance, address: address || 'default' });
      } catch (error) {
        logger.error('Error getting balance:', error);
        res.status(500).json({ error: 'Failed to get balance' });
      }
    });

    this.app.post('/api/send', async (req, res) => {
      try {
        const { toAddress, amount, comment } = req.body;
        
        if (!toAddress || !amount) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        if (!(await this.config.tonService.validateAddress(toAddress))) {
          return res.status(400).json({ error: 'Invalid TON address' });
        }
        
        const result = await this.config.tonService.sendTransaction(
          toAddress,
          amount,
          comment
        );
        
        res.json(result);
      } catch (error) {
        logger.error('Error sending transaction:', error);
        res.status(500).json({ error: 'Failed to send transaction' });
      }
    });

    this.app.get('/api/transaction/:hash', async (req, res) => {
      try {
        const { hash } = req.params;
        const status = await this.config.tonService.getTransactionStatus(hash);
        res.json(status);
      } catch (error) {
        logger.error('Error getting transaction status:', error);
        res.status(500).json({ error: 'Failed to get transaction status' });
      }
    });

    this.app.get('/api/history/:address?', async (req, res) => {
      try {
        const address = req.params.address;
        const limit = parseInt(req.query.limit as string) || 10;
        const history = await this.config.tonService.getTransactionHistory(address, limit);
        res.json(history);
      } catch (error) {
        logger.error('Error getting transaction history:', error);
        res.status(500).json({ error: 'Failed to get transaction history' });
      }
    });

    this.app.post('/api/chat', async (req, res) => {
      try {
        const { userId, message } = req.body;
        
        if (!userId || !message) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const conversation = await this.config.conversationManager.getConversation(userId);
        conversation.addUserMessage(message);
        
        const response = await this.config.claudeService.generateResponse(
          conversation.getMessages(),
          userId
        );
        
        conversation.addAssistantMessage(response);
        await this.config.conversationManager.saveConversation(userId, conversation);
        
        res.json({ response });
      } catch (error) {
        logger.error('Error processing chat message:', error);
        res.status(500).json({ error: 'Failed to process message' });
      }
    });

    this.app.get('/api/jetton/:masterAddress/:ownerAddress?', async (req, res) => {
      try {
        const { masterAddress, ownerAddress } = req.params;
        const balance = await this.config.tonService.getJettonBalance(
          masterAddress,
          ownerAddress
        );
        res.json({ balance, masterAddress, ownerAddress });
      } catch (error) {
        logger.error('Error getting Jetton balance:', error);
        res.status(500).json({ error: 'Failed to get Jetton balance' });
      }
    });

    this.app.get('/api/nft/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const info = await this.config.tonService.getNFTInfo(address);
        res.json(info);
      } catch (error) {
        logger.error('Error getting NFT info:', error);
        res.status(500).json({ error: 'Failed to get NFT info' });
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });
  }

  async start() {
    return new Promise<void>((resolve) => {
      this.server = createServer(this.app);
      this.server.listen(this.config.port, () => {
        logger.info(`Mini App server started on port ${this.config.port}`);
        resolve();
      });
    });
  }

  async stop() {
    return new Promise<void>((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Mini App server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}