import type { Ai } from '@cloudflare/workers-types';

import type { ApiConfig } from './config';

import type {
  Challenge,
  ChallengeGenerationRequest,
  HintRequest,
} from './types';
import { CHALLENGE_TEMPLATES } from './data-model/challenge';

export class AIChallengeEngine {
  private ai: Ai;
  private config: ApiConfig;

  constructor(ai: Ai, config: ApiConfig) {
    this.ai = ai;
    this.config = config;
  }

  async generateChallenge(
    request: ChallengeGenerationRequest
  ): Promise<Challenge> {
    const template = this.selectTemplate(request.category, request.difficulty);
    const challengeId = this.generateChallengeId();

    const prompt = this.buildChallengePrompt(template, request);

    try {
      const response = await this.ai.run(
        // @ts-ignore
        this.config.ai.textModel,
        {
          messages: [
            {
              role: 'system',
              content: `You are an expert CTF challenge creator. Create educational cybersecurity challenges that are fair, solvable, and teach important security concepts. Always include a clear flag in the format flag{...} and provide educational context.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 30000,
          temperature: 0.7,
        },
        {
          gateway: {
            id: this.config.ai.gateway,
          },
        }
      );

      // @ts-ignore
      const challengeData = this.parseChallengeResponse(response.response);

      const challenge: Challenge = {
        id: challengeId,
        title: challengeData.title || `${request.category} Challenge`,
        description: challengeData.description,
        category: request.category,
        difficulty: request.difficulty,
        flag: challengeData.flag,
        hints: challengeData.hints || [],
        metadata: {
          author: 'AI Challenge Engine',
          tags: [request.category, `difficulty-${request.difficulty}`],
          estimatedTime: this.estimateTime(request.difficulty),
          resources: challengeData.resources || [],
        },
        attempts: 0,
        hintsUsed: 0,
      };

      return this.validateChallenge(challenge);
    } catch (error) {
      console.error('AI challenge generation failed:', error);
      return this.generateFallbackChallenge(request);
    }
  }

  async generateHint(request: HintRequest): Promise<string> {
    const hintLevel = request.hintsUsed + 1;

    const prompt = `Generate hint #${hintLevel} for a CTF challenge. 
    Previous hints: ${request.previousHints?.join(', ') || 'None'}
    Current progress: ${request.currentProgress || 'Not provided'}
    
    Make the hint progressively more helpful but not give away the answer completely.
    Hint level ${hintLevel} should ${this.getHintLevelGuidance(hintLevel)}.`;

    try {
      const response = await this.ai.run(
        // @ts-ignore
        this.config.ai.textModel,
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful CTF mentor. Provide educational hints that guide learning without giving away answers.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 30000,
          temperature: 0.5,
        },
        {
          gateway: {
            id: this.config.ai.gateway,
          },
        }
      );

      // @ts-ignore
      return this.cleanHintResponse(response.response);
    } catch (error) {
      console.error('AI hint generation failed:', error);
      return this.generateFallbackHint(hintLevel);
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

  private buildChallengePrompt(
    template: any,
    request: ChallengeGenerationRequest
  ): string {
    const difficultyText = this.getDifficultyText(request.difficulty);

    return `${template.basePrompt} with ${difficultyText} difficulty level.
    
    Requirements:
    - Include a clear flag in format: flag{...}
    - Provide step-by-step solution approach
    - Include 2-3 progressive hints
    - Educational and appropriate content only
    - Challenge should be solvable in ${this.estimateTime(
      request.difficulty
    )} minutes
    
    Return the response in this JSON format:
    {
      "title": "Challenge Title",
      "description": "Detailed challenge description and setup",
      "flag": "flag{...}",
      "hints": ["hint1", "hint2", "hint3"],
      "resources": ["any additional resources or files mentioned"]
    }`;
  }

  private parseChallengeResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (jsonError) {
          console.error('Failed to parse JSON from AI response:', jsonError);
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
    }

    return {
      title: 'Generated Challenge',
      description: response,
      flag: 'flag{ai_generated_challenge}',
      hints: [
        'Look for common vulnerability patterns',
        'Check the source carefully',
        'Try different input methods',
      ],
    };
  }

  private validateChallenge(challenge: Challenge): Challenge {
    if (!challenge.flag.startsWith('flag{') || !challenge.flag.endsWith('}')) {
      challenge.flag = `flag{${challenge.flag.replace(/^flag\{|\}$/g, '')}}`;
    }

    if (!challenge.description || challenge.description.length < 50) {
      challenge.description = `A ${challenge.category} challenge with difficulty level ${challenge.difficulty}. ${challenge.description}`;
    }

    return challenge;
  }

  private generateFallbackChallenge(
    request: ChallengeGenerationRequest
  ): Challenge {
    const challengeId = this.generateChallengeId();
    const fallbackChallenges = {
      web: {
        title: 'Basic Web Challenge',
        description:
          'Find the hidden flag in this web application. Look for common web vulnerabilities.',
        flag: 'flag{basic_web_challenge}',
      },
      crypto: {
        title: 'Caesar Cipher',
        description: 'Decrypt this Caesar cipher: "IODJ{FDHVDU_FLSKHU}"',
        flag: 'flag{caesar_cipher}',
      },
      misc: {
        title: 'Logic Challenge',
        description: 'Solve this programming puzzle to get the flag.',
        flag: 'flag{logic_puzzle}',
      },
    };

    const fallback =
      fallbackChallenges[request.category as keyof typeof fallbackChallenges] ||
      fallbackChallenges.misc;

    return {
      id: challengeId,
      title: fallback.title,
      description: fallback.description,
      category: request.category,
      difficulty: request.difficulty,
      flag: fallback.flag,
      hints: [
        'Start by understanding the challenge type',
        'Look for patterns or common techniques',
        'Consider the challenge category for clues',
      ],
      metadata: {
        author: 'Fallback Generator',
        tags: [request.category],
        estimatedTime: this.estimateTime(request.difficulty),
      },
      attempts: 0,
      hintsUsed: 0,
    };
  }

  private generateFallbackHint(hintLevel: number): string {
    const fallbackHints = [
      'Think about the challenge category and common approaches used.',
      'Look more carefully at the details provided in the challenge.',
      'Consider using online tools or resources appropriate for this challenge type.',
      'Review the challenge description for any subtle clues you might have missed.',
    ];

    return fallbackHints[Math.min(hintLevel - 1, fallbackHints.length - 1)];
  }

  private getDifficultyText(difficulty: number): string {
    const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    return levels[Math.min(difficulty - 1, levels.length - 1)] || 'medium';
  }

  private estimateTime(difficulty: number): number {
    return Math.min(15 + difficulty * 10, 60);
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
