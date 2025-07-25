import type { Ai, KVNamespace } from '@cloudflare/workers-types';

import type { ApiConfig } from './config';
import type { Challenge } from './types';
import { CHALLENGE_TEMPLATES } from './data-model/challenge';
import { sanitizeInput } from './utils/input';

class AIGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIGenerationError';
  }
}

export class AIChallengeEngine {
  private ai: Ai;
  private config: ApiConfig;
  private readonly AI_TIMEOUT = 30000; // 30 seconds

  constructor(ai: Ai, config: ApiConfig, kv: KVNamespace) {
    this.ai = ai;
    this.config = config;
  }

  async generateChallenge(request): Promise<Challenge | undefined> {
    const validatedRequest = request;

    const template = this.selectTemplate(
      validatedRequest.category,
      validatedRequest.difficulty
    );
    const challengeId = this.generateChallengeId();

    const prompt = this.buildChallengePrompt(template, validatedRequest);
    const schema = this.buildChallengePromptSchema();

    try {
      const aiChallenge = await this.generateFromAI(
        prompt,
        schema,
        validatedRequest
      );

      return this.convertToChallenge(aiChallenge, challengeId);
    } catch (error) {
      console.error('AI challenge generation failed:', error);
      if (error instanceof AIGenerationError && error.retryable) {
        throw error;
      }
      return undefined;
    }
  }

  async generateHint(request): Promise<string | undefined> {
    const validatedRequest = this.validateHintRequest(request);

    const hintLevel = validatedRequest.hintLevel;
    const sanitizedUserId = sanitizeInput(validatedRequest.userId);

    const prompt = `Generate hint #${hintLevel} for a CTF challenge.
    User ID: ${sanitizedUserId}
    Challenge ID: ${sanitizeInput(validatedRequest.challengeId)}
    
    Make the hint progressively more helpful but not give away the answer completely.
    Hint level ${hintLevel} should ${this.getHintLevelGuidance(hintLevel)}.
    
    Important: Provide educational value and maintain engagement.`;

    try {
      const response = await Promise.race([
        this.ai.run(
          this.config.ai.textModel as any,
          {
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful CTF mentor. Provide educational hints that guide learning without giving away answers. Keep hints concise and actionable.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 500,
            temperature: 0.6,
          },
          {
            gateway: {
              id: this.config.ai.gateway,
            },
          }
        ),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new AIGenerationError('Hint generation timeout', 'TIMEOUT')
              ),
            this.AI_TIMEOUT
          )
        ),
      ]);

      return this.cleanHintResponse((response as any).response);
    } catch (error) {
      console.error('AI hint generation failed:', error);
      if (error instanceof AIGenerationError && error.code === 'TIMEOUT') {
        throw new AIGenerationError(
          'Hint generation is taking too long. Please try again.',
          'TIMEOUT',
          true
        );
      }
      return undefined;
    }
  }

  private selectTemplate(category: string, difficulty: number) {
    const categoryTemplates =
      CHALLENGE_TEMPLATES[category as keyof typeof CHALLENGE_TEMPLATES];
    if (!categoryTemplates) {
      return CHALLENGE_TEMPLATES.misc[0];
    }

    const templateIndex = Math.floor(Math.random() * categoryTemplates.length);
    return categoryTemplates[templateIndex];
  }

  private buildChallengePrompt(template: any, request): string {
    const difficultyText = this.getDifficultyText(request.difficulty);

    return `${template.basePrompt} with ${difficultyText} difficulty level.
    
    Requirements:
    - Include a clear flag in format: flag{...}
    - Provide step-by-step solution approach
    - Include 2-3 progressive hints
    - Educational and appropriate content only
    - Challenge should be solvable in ${this.estimateTime(
      request.difficulty
    )} minutes`;
  }

  private buildChallengePromptSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the challenge' },
        description: {
          type: 'string',
          description: 'Detailed description and setup for the challenge',
        },
        flag: {
          type: 'string',
          pattern: '^flag\\{.*\\}$',
          description: 'The flag to be found in the challenge',
        },
        hints: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 3,
          description:
            'Progressive hints to help users solve the challenge, in order of increasing specificity',
        },
        resources: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Any additional resources or files that are part of the challenge',
        },
      },
      required: ['title', 'description', 'flag', 'hints'],
    };
  }

  private async generateFromAI(
    prompt: string,
    schema: Record<string, any>,
    request
  ): Promise<any> {
    const response = await Promise.race([
      this.ai.run(
        this.config.ai.textModel as any,
        {
          messages: [
            {
              role: 'system',
              content: `You are an expert CTF challenge creator. Create educational cybersecurity challenges that are fair, solvable, and teach important security concepts. Always include a clear flag in the format flag{...} and provide educational context. Ensure difficulty matches the requested level ${request.difficulty}/5.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          guided_json: schema,
          max_tokens: 2000,
          temperature: 0.7,
        },
        {
          gateway: {
            id: this.config.ai.gateway,
          },
        }
      ),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new AIGenerationError('AI generation timeout', 'TIMEOUT')),
          this.AI_TIMEOUT
        )
      ),
    ]);

    return this.parseAndValidateResponse((response as any).response, request);
  }

  private parseAndValidateResponse(response: string, request) {
    let challengeData: any;

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        challengeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new AIGenerationError('Invalid AI response format', 'PARSE_ERROR');
    }

    return challengeData;
  }

  private getDifficultyText(difficulty: number): string {
    const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    return levels[Math.min(difficulty - 1, levels.length - 1)] || 'medium';
  }

  private estimateTime(difficulty: number): number {
    const baseTime = [5, 15, 30, 60, 120]; // minutes for each difficulty
    return baseTime[Math.min(difficulty - 1, baseTime.length - 1)];
  }

  private convertToChallenge(aiChallenge, challengeId: string): Challenge {
    return {
      id: challengeId,
      title: aiChallenge.title,
      description: aiChallenge.description,
      category: aiChallenge.category,
      difficulty: aiChallenge.difficulty,
      flag: aiChallenge.flag,
      hints: aiChallenge.hints,
      metadata: {
        author: 'AI Challenge Engine',
        tags: [aiChallenge.category, `difficulty-${aiChallenge.difficulty}`],
        estimatedTime: aiChallenge.timeEstimate,
        resources: Array.isArray(aiChallenge.resources)
          ? aiChallenge.resources.map((r: any) =>
              typeof r === 'string' ? r : r.name || r.url || ''
            )
          : [],
      },
      attempts: 0,
      hintsUsed: 0,
    };
  }

  private validateHintRequest(request) {
    if (!request.challengeId || !request.userId || !request.roomId) {
      throw new AIGenerationError(
        'Missing required fields: challengeId, userId, or roomId',
        'VALIDATION_ERROR'
      );
    }

    if (
      typeof request.hintLevel !== 'number' ||
      request.hintLevel < 1 ||
      request.hintLevel > 5
    ) {
      throw new AIGenerationError(
        'Invalid hint level. Must be between 1 and 5',
        'VALIDATION_ERROR'
      );
    }

    return {
      challengeId: sanitizeInput(request.challengeId),
      userId: sanitizeInput(request.userId),
      roomId: sanitizeInput(request.roomId),
      hintLevel: request.hintLevel,
    };
  }

  private getHintLevelGuidance(hintLevel: number): string {
    switch (hintLevel) {
      case 1:
        return 'point in the right direction without giving specifics';
      case 2:
        return 'provide more specific guidance about the approach';
      case 3:
        return 'give clear steps but let them implement the solution';
      default:
        return 'provide substantial help while maintaining the learning experience';
    }
  }

  private cleanHintResponse(response: string): string {
    return response.replace(/^(Hint:|Here's a hint:)/i, '').trim();
  }

  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
