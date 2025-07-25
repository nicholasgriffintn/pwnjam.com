import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

import type { Challenge, WebSocketMessage, RoomSettings } from '../types';
import {
  startChallenge,
  submitFlag,
  requestHint,
  addEventListener,
  removeEventListener,
  isConnected,
} from '../lib/api-service';
import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  getCategoryIcon,
  getCategoryLabel,
} from '../data-model/challenge';

interface ChallengePanelProps {
  currentChallenge?: Challenge;
  isRoomModerator: boolean;
  onChallengeUpdate?: (challenge: Challenge) => void;
  settings: RoomSettings;
}

export function ChallengePanel({
  currentChallenge,
  isRoomModerator,
  onChallengeUpdate,
  settings,
}: ChallengePanelProps) {
  const [flagInput, setFlagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [maxHints, setMaxHints] = useState(3);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [, setLastHintResponse] = useState<string>('');
  const [submissions, setSubmissions] = useState<
    Array<{ flag: string; timestamp: number; correct: boolean }>
  >([]);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    settings.challengeCategories?.[0] || 'web'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    settings.difficultyLevel === 'beginner'
      ? 1
      : settings.difficultyLevel === 'intermediate'
      ? 2
      : settings.difficultyLevel === 'advanced'
      ? 3
      : settings.difficultyLevel === 'expert'
      ? 4
      : 2
  );
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [workspaceContent, setWorkspaceContent] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [flagValidationError, setFlagValidationError] = useState('');
  const [copiedResource, setCopiedResource] = useState<number | null>(null);

  const intervalRef = useRef<number | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedContent = localStorage.getItem('challenge-workspace');
    if (savedContent) {
      setWorkspaceContent(savedContent);
    }
  }, []);

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (workspaceContent) {
        localStorage.setItem('challenge-workspace', workspaceContent);
      }
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [workspaceContent]);

  useEffect(() => {
    setSelectedCategory(settings.challengeCategories?.[0] || 'web');
    setSelectedDifficulty(
      settings.difficultyLevel === 'beginner'
        ? 1
        : settings.difficultyLevel === 'intermediate'
        ? 2
        : settings.difficultyLevel === 'advanced'
        ? 3
        : settings.difficultyLevel === 'expert'
        ? 4
        : 2
    );
  }, [settings]);

  useEffect(() => {
    const handleChallengeStarted = (data: WebSocketMessage) => {
      if (data.challenge) {
        setHints([]);
        setHintsUsed(0);
        setTimeElapsed(0);
        setSubmissions([]);
        setFlagInput('');
        setLastHintResponse('');
        setIsGeneratingChallenge(false);
        setGenerationProgress(100);
        setEstimatedTime(data.challenge.metadata?.estimatedTime || null);
        setFlagValidationError('');
        if (onChallengeUpdate) {
          onChallengeUpdate(data.challenge);
        }
      }
    };

    const handleChallengeSolved = () => {
      setSubmissions((prev) => [
        ...prev,
        {
          flag: flagInput,
          timestamp: Date.now(),
          correct: true,
        },
      ]);
      setFlagInput('');
      setIsSubmitting(false);
    };

    const handleFlagIncorrect = (data: WebSocketMessage) => {
      setSubmissions((prev) => [
        ...prev,
        {
          flag: flagInput,
          timestamp: Date.now(),
          correct: false,
          message: data.message,
          attemptsRemaining: data.attemptsRemaining,
        },
      ]);
      setFlagInput('');
      setIsSubmitting(false);

      setTimeout(() => flagInputRef.current?.focus(), 100);
    };

    const handleHintReceived = (data: WebSocketMessage) => {
      if (data.hint) {
        setLastHintResponse(data.hint);
        setHints((prev) => [...prev, data.hint!]);
        setHintsUsed((prev) => prev + 1);
        if (data.maxHints) setMaxHints(data.maxHints);

        if (data.penaltyApplied) {
          console.log(`Hint penalty applied: -${data.penaltyApplied} points`);
        }
      }
      setIsRequestingHint(false);
    };

    const handleError = () => {
      setIsSubmitting(false);
      setIsRequestingHint(false);
      setIsGeneratingChallenge(false);
    };

    addEventListener('challengeStarted', handleChallengeStarted);
    addEventListener('challengeSolved', handleChallengeSolved);
    addEventListener('flagIncorrect', handleFlagIncorrect);
    addEventListener('hintReceived', handleHintReceived);
    addEventListener('error', handleError);

    return () => {
      removeEventListener('challengeStarted', handleChallengeStarted);
      removeEventListener('challengeSolved', handleChallengeSolved);
      removeEventListener('flagIncorrect', handleFlagIncorrect);
      removeEventListener('hintReceived', handleHintReceived);
      removeEventListener('error', handleError);
    };
  }, [flagInput, hintsUsed, maxHints, onChallengeUpdate]);

  useEffect(() => {
    if (currentChallenge && currentChallenge.startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - currentChallenge.startTime!) / 1000
        );
        setTimeElapsed(elapsed);
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [currentChallenge]);

  const handleStartChallenge = async () => {
    if (!isConnected()) {
      alert('Not connected to room');
      return;
    }

    setIsGeneratingChallenge(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      startChallenge(selectedCategory, selectedDifficulty);
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge');
      setIsGeneratingChallenge(false);
      clearInterval(progressInterval);
    }
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFlag = flagInput.trim();
    if (!trimmedFlag || !currentChallenge) {
      return;
    }

    setFlagValidationError('');
    if (trimmedFlag.length < 3) {
      setFlagValidationError('Flag is too short');
      return;
    }
    if (trimmedFlag.length > 100) {
      setFlagValidationError('Flag is too long');
      return;
    }

    if (!isConnected()) {
      alert('Not connected to room');
      return;
    }

    setIsSubmitting(true);

    try {
      submitFlag(trimmedFlag);
    } catch (error) {
      console.error('Error submitting flag:', error);
      alert('Failed to submit flag');
      setIsSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (!currentChallenge || hintsUsed >= maxHints) {
      return;
    }

    if (!isConnected()) {
      alert('Not connected to room');
      return;
    }

    setIsRequestingHint(true);

    try {
      requestHint();
    } catch (error) {
      console.error('Error requesting hint:', error);
      alert('Failed to request hint');
      setIsRequestingHint(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: number): string => {
    return (
      DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || '#666'
    );
  };

  const getDifficultyLabel = (difficulty: number): string => {
    return (
      DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS] ||
      'Unknown'
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && flagInput.trim() && !isSubmitting) {
          e.preventDefault();
          handleSubmitFlag(e as any);
        } else if (e.key === 'h' && currentChallenge && hintsUsed < maxHints) {
          e.preventDefault();
          handleRequestHint();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flagInput, isSubmitting, currentChallenge, hintsUsed, maxHints]);

  const availableCategories = settings.challengeCategories || [];

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedResource(index);
      setTimeout(() => setCopiedResource(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!currentChallenge) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-cyber-surface rounded-lg p-8 shadow-md">
        {isGeneratingChallenge ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyber-cyan-600/20 border-t-cyber-cyan-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-cyber-cyan-600 font-bold text-sm">
                  {Math.round(generationProgress)}%
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-cyber-text-primary text-center mb-2">
              🤖 Generating Challenge...
            </h2>
            <p className="text-cyber-text-secondary text-center mb-4">
              AI is creating a custom {selectedCategory} challenge at{' '}
              {getDifficultyLabel(selectedDifficulty)} difficulty.
            </p>
            <div className="w-full max-w-xs bg-cyber-bg rounded-full h-2">
              <div
                className="bg-cyber-cyan-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            {estimatedTime && (
              <p className="text-xs text-cyber-text-secondary mt-2">
                Estimated solve time: {estimatedTime} minutes
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-cyber-text-primary text-center">
                🏁 Ready to Start?
              </h2>
              <p className="text-cyber-text-secondary">
                No active challenge. Start a new challenge to begin!
              </p>
            </div>

            {isRoomModerator && (
              <div className="flex flex-col space-y-4 w-full max-w-xs">
                <div>
                  <label className="block text-sm font-medium text-cyber-text-primary mb-1">
                    Category:
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary"
                    disabled={false}
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyber-text-primary mb-1">
                    Difficulty:
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) =>
                      setSelectedDifficulty(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary"
                  >
                    <option value={1}>Beginner</option>
                    <option value={2}>Intermediate</option>
                    <option value={3}>Advanced</option>
                    <option value={4}>Expert</option>
                    <option value={5}>Master</option>
                  </select>
                </div>

                <button
                  onClick={handleStartChallenge}
                  className="w-full px-4 py-2 bg-cyber-cyan-600 text-white rounded-md font-semibold hover:bg-cyber-cyan-700 transition-colors"
                  disabled={!isConnected()}
                >
                  🚀 Start Challenge
                </button>
              </div>
            )}

            {!isRoomModerator && (
              <div className="mt-4 text-cyber-text-secondary">
                <p>⏳ Waiting for the moderator to start a challenge...</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cyber-surface rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-cyber-text-primary">
          {currentChallenge.title}
        </h2>

        <div className="flex items-center gap-2">
          <span className="category-badge text-cyber-text-secondary px-2 py-1 bg-cyber-bg rounded-md text-sm">
            {getCategoryIcon(currentChallenge.category)}{' '}
            {getCategoryLabel(currentChallenge.category)}
          </span>
          <span
            className="difficulty-badge text-white px-2 py-1 rounded-md text-sm font-medium"
            style={{
              backgroundColor: getDifficultyColor(currentChallenge.difficulty),
            }}
          >
            {getDifficultyLabel(currentChallenge.difficulty)}
          </span>
          <span className="time-badge text-cyber-text-secondary px-2 py-1 bg-cyber-bg rounded-md text-sm">
            ⏱️ {formatTime(timeElapsed)}
          </span>
          {estimatedTime && (
            <span className="estimate-badge text-cyber-text-secondary px-2 py-1 bg-cyber-bg rounded-md text-sm">
              📊 Est: {estimatedTime}m
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 space-y-4">
        <div className="challenge-description">
          <div className="description-text text-cyber-text-primary prose prose-invert prose-cyan max-w-none">
            <ReactMarkdown>{currentChallenge.description}</ReactMarkdown>
          </div>

          {currentChallenge.metadata?.resources &&
            currentChallenge.metadata.resources.length > 0 && (
              <div className="challenge-resources mt-6">
                <h4 className="text-lg font-semibold text-cyber-text-primary mb-2">
                  📎 Resources:
                </h4>
                <div className="space-y-2">
                  {currentChallenge.metadata.resources.map(
                    (resource, index) => {
                      const isUrl =
                        resource.startsWith('http://') ||
                        resource.startsWith('https://');
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-cyber-bg p-2 rounded-md"
                        >
                          <div className="flex-1">
                            {isUrl ? (
                              <a
                                href={resource}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyber-cyan-600 hover:underline break-all"
                              >
                                {resource}
                              </a>
                            ) : (
                              <span className="text-cyber-text-secondary break-all">
                                {resource}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(resource, index)}
                            className="ml-2 px-2 py-1 text-xs bg-cyber-cyan-600 text-white rounded hover:bg-cyber-cyan-700 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedResource === index ? '✓' : '📋'}
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="challenge-workspace">
          <div className="workspace-header flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-cyber-text-primary">
              💻 Workspace
            </h3>
            <div className="workspace-stats flex gap-4">
              <span className="text-sm text-cyber-text-secondary">
                Attempts: {currentChallenge.attempts || 0}
              </span>
              <span className="text-sm text-cyber-text-secondary">
                Hints: {hintsUsed}/{maxHints}
              </span>
            </div>
          </div>

          <textarea
            ref={editorRef}
            value={workspaceContent}
            onChange={(e) => setWorkspaceContent(e.target.value)}
            className="challenge-editor w-full p-3 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary font-mono text-sm"
            placeholder="Use this space for notes, code, or analysis...
Tip: Your work is automatically saved!"
            rows={8}
          />
          <div className="workspace-footer flex justify-between items-center mt-2">
            <span className="text-xs text-cyber-text-secondary">
              Workspace auto-saved • {workspaceContent.length} characters
            </span>
            <button
              onClick={() => setWorkspaceContent('')}
              className="text-xs text-cyber-text-secondary hover:text-cyber-text-primary"
              title="Clear workspace"
            >
              Clear
            </button>
          </div>
        </div>

        {hints.length > 0 && (
          <div className="hints-section">
            <h3 className="text-lg font-semibold text-cyber-text-primary mb-2">
              💡 Hints
            </h3>
            <div className="hints-list space-y-2">
              {hints.map((hint, index) => (
                <div
                  key={index}
                  className="hint-item flex gap-2 p-3 bg-cyber-bg/50 rounded-md"
                >
                  <span className="hint-number text-sm text-cyber-text-secondary font-mono">
                    #{index + 1}
                  </span>
                  <span className="hint-text text-cyber-text-primary">
                    {hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {submissions.length > 0 && (
          <div className="submissions-section">
            <h3 className="text-lg font-semibold text-cyber-text-primary mb-2">
              📝 Previous Submissions
            </h3>
            <div className="submissions-list space-y-2">
              {submissions.slice(-3).map((submission, index) => (
                <div
                  key={index}
                  className={`submission-item p-3 rounded-md ${
                    submission.correct
                      ? 'bg-green-900/20 border border-green-600/30'
                      : 'bg-red-900/20 border border-red-600/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="submission-flag text-sm text-cyber-text-primary font-mono break-all">
                      {submission.flag}
                    </span>
                    <span className="submission-status text-sm font-medium ml-2 flex-shrink-0">
                      {submission.correct ? '✅ Correct' : '❌ Incorrect'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="challenge-actions mt-6 space-y-4">
        <form onSubmit={handleSubmitFlag} className="flag-submission">
          <div className="flag-input-group space-y-3">
            <div className="relative">
              <input
                ref={flagInputRef}
                type="text"
                value={flagInput}
                onChange={(e) => {
                  setFlagInput(e.target.value);
                  setFlagValidationError('');
                }}
                placeholder="Enter flag (e.g., flag{your_answer_here})"
                className={`flag-input w-full p-3 bg-cyber-bg border rounded-md text-cyber-text-primary font-mono ${
                  flagValidationError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-cyber-border focus:border-cyber-cyan-600'
                } focus:outline-none focus:ring-2 focus:ring-cyber-cyan-600/20`}
                disabled={isSubmitting}
              />
              {flagValidationError && (
                <div className="absolute -bottom-6 left-0 text-xs text-red-400">
                  {flagValidationError}
                </div>
              )}
            </div>
            <div className="text-xs text-cyber-text-secondary">
              Tip: Use Ctrl+Enter to submit quickly
            </div>
            <button
              type="submit"
              className="submit-flag-btn w-full px-4 py-3 bg-cyber-cyan-600 text-white rounded-md font-semibold hover:bg-cyber-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !flagInput.trim() || isSubmitting || !!flagValidationError
              }
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                  Submitting...
                </span>
              ) : (
                '🏁 Submit Flag'
              )}
            </button>
          </div>
        </form>

        <div className="action-buttons space-y-3">
          <button
            onClick={handleRequestHint}
            className="hint-btn w-full px-4 py-2 bg-cyber-yellow-600 text-white rounded-md font-semibold hover:bg-cyber-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              hintsUsed >= maxHints ||
              isRequestingHint ||
              settings.hintsEnabled === false
            }
            title={
              settings.hintsEnabled === false
                ? 'Hints are disabled for this room'
                : hintsUsed >= maxHints
                ? 'No more hints available'
                : 'Request a hint (Ctrl+H)'
            }
          >
            {isRequestingHint ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                Getting hint...
              </span>
            ) : (
              `💡 Hint (${hintsUsed}/${maxHints})`
            )}
          </button>

          {isRoomModerator && (
            <button
              onClick={handleStartChallenge}
              className="next-challenge-btn w-full px-4 py-2 bg-cyber-cyan-600 text-white rounded-md font-semibold hover:bg-cyber-cyan-700 transition-colors"
              title="Start a new challenge"
              disabled={isGeneratingChallenge}
            >
              {isGeneratingChallenge ? '🤖 Generating...' : '⏭️ Next Challenge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
