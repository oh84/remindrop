import Anthropic from '@anthropic-ai/sdk';
import { env } from '../env';

// Lazy initialization - only create client when actually needed
let _anthropic: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please set it in your .env file to use AI features.');
  }

  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  return _anthropic;
}

// Claude Haiku model for cost-effective summarization
export const CLAUDE_HAIKU_MODEL = 'claude-3-5-haiku-latest';
