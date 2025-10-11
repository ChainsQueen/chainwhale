import OpenAI from 'openai';
import { z } from 'zod';
import type { WalletAnalysis } from '../shared/types';

/**
 * AI Engine using OpenAI GPT-4
 * Provides AI-powered analysis and insights for blockchain data
 */
export class AIEngine {
  private client: OpenAI;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'gpt-4o-mini';
  }

  /**
   * Analyze a blockchain transaction and provide plain English explanation
   */
  async analyzeTransaction(
    transactionData: Record<string, unknown>,
    context?: string
  ): Promise<string> {
    try {
      const prompt = `Analyze this blockchain transaction and explain it in simple terms:

Transaction Data:
${JSON.stringify(transactionData, null, 2)}

${context ? `Additional Context: ${context}` : ''}

Provide a concise, plain English explanation of what happened in this transaction. Focus on:
- What type of transaction it is (swap, transfer, etc.)
- The amounts involved
- Any notable patterns or risks`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain analyst expert. Explain transactions clearly and concisely for non-technical users.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to analyze transaction';
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      return 'Unable to analyze transaction at this time';
    }
  }

  /**
   * Answer user queries about whale activity using blockchain data
   */
  async answerQuery(query: string, blockchainData: Record<string, unknown>[]): Promise<string> {
    try {
      const prompt = `User Question: ${query}

Blockchain Data:
${JSON.stringify(blockchainData, null, 2)}

Based on the blockchain data provided, answer the user's question clearly and concisely. 
Focus on actionable insights and patterns. If you notice any significant whale movements or trends, highlight them.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a crypto trading analyst specializing in whale movements. Provide clear, actionable insights based on blockchain data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to answer query';
    } catch (error) {
      console.error('Error answering query:', error);
      return 'Unable to process your question at this time';
    }
  }

  /**
   * Analyze a wallet's holdings and activity across chains
   */
  async analyzeWallet(
    walletData: Record<string, unknown>,
    holdings: Record<string, unknown>[]
  ): Promise<WalletAnalysis> {
    try {
      const prompt = `Analyze this wallet's holdings and activity:

Wallet Data:
${JSON.stringify(walletData, null, 2)}

Holdings:
${JSON.stringify(holdings, null, 2)}

Provide a structured analysis with:
1. A brief summary of the wallet's activity
2. A risk score from 0-100 (0 = very safe, 100 = very risky)
3. 3-5 key insights about the wallet's behavior

Return your response as a JSON object with this structure:
{
  "summary": "Brief summary of wallet activity",
  "riskScore": 0-100,
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain security analyst. Analyze wallets and provide risk assessments. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Validate response with Zod
      const WalletAnalysisSchema = z.object({
        summary: z.string(),
        riskScore: z.number().min(0).max(100),
        insights: z.array(z.string()),
      });

      const validated = WalletAnalysisSchema.parse(parsed);

      return {
        address: (walletData.address as string) || '',
        totalValue: (walletData.totalValue as number) || 0,
        chains: (walletData.chains as Record<string, number>) || {},
        tokens: holdings as Array<{ symbol: string; balance: string; value: number; chain: string }>,
        summary: validated.summary,
        riskScore: validated.riskScore,
        insights: validated.insights,
      };
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      // Return default analysis on error
      return {
        address: (walletData.address as string) || '',
        totalValue: (walletData.totalValue as number) || 0,
        chains: (walletData.chains as Record<string, number>) || {},
        tokens: holdings as Array<{ symbol: string; balance: string; value: number; chain: string }>,
        summary: 'Unable to analyze wallet at this time',
        riskScore: 50,
        insights: ['Analysis unavailable'],
      };
    }
  }
}
