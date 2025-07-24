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
  CATEGORY_ICONS,
  ALL_CATEGORIES,
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

  const intervalRef = useRef<number | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

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

    const handleFlagIncorrect = () => {
      setSubmissions((prev) => [
        ...prev,
        {
          flag: flagInput,
          timestamp: Date.now(),
          correct: false,
        },
      ]);
      setFlagInput('');
      setIsSubmitting(false);
    };

    const handleHintReceived = (data: WebSocketMessage) => {
      if (data.hint) {
        setLastHintResponse(data.hint);
        setHints((prev) => [...prev, data.hint!]);
        setHintsUsed((prev) => prev + 1);
        if (data.maxHints) setMaxHints(data.maxHints);
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

    try {
      startChallenge(selectedCategory, selectedDifficulty);
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge');
      setIsGeneratingChallenge(false);
    }
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flagInput.trim() || !currentChallenge) {
      return;
    }

    if (!isConnected()) {
      alert('Not connected to room');
      return;
    }

    setIsSubmitting(true);

    try {
      submitFlag(flagInput.trim());
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

  const getCategoryIcon = (category: string): string => {
    return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '❓';
  };

  // TODO: Chaallenges should really come from the API.
  const availableCategories = ALL_CATEGORIES.filter((cat) =>
    settings.challengeCategories?.includes(cat.id)
  );

  if (!currentChallenge) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-cyber-surface rounded-lg p-8 shadow-md">
        {isGeneratingChallenge ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan-600 mb-4"></div>
            <h2 className="text-2xl font-bold text-cyber-text-primary text-center mb-2">
              🤖 Generating Challenge...
            </h2>
            <p className="text-cyber-text-secondary text-center">
              AI is creating a custom challenge for you. This may take a few moments.
            </p>
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
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
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

        <div className="flex items-center">
          <span className="category-badge text-cyber-text-secondary mr-2">
            {getCategoryIcon(currentChallenge.category)}{' '}
            {currentChallenge.category.toUpperCase()}
          </span>
          <span
            className="difficulty-badge text-white px-2 py-1 rounded-md"
            style={{
              backgroundColor: getDifficultyColor(currentChallenge.difficulty),
            }}
          >
            {getDifficultyLabel(currentChallenge.difficulty)}
          </span>
          <span className="time-badge text-cyber-text-secondary">
            ⏱️ {formatTime(timeElapsed)}
          </span>
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
                <ul className="list-disc list-inside text-cyber-text-secondary">
                  {currentChallenge.metadata.resources.map(
                    (resource, index) => {
                      const isUrl =
                        resource.startsWith('http://') ||
                        resource.startsWith('https://');
                      return (
                        <li key={index}>
                          {isUrl ? (
                            <a
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyber-cyan-600 hover:underline"
                            >
                              {resource}
                            </a>
                          ) : (
                            resource
                          )}
                        </li>
                      );
                    }
                  )}
                </ul>
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
            className="challenge-editor w-full p-3 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary"
            placeholder="Use this space for notes, code, or analysis..."
            rows={8}
          />
        </div>

        {hints.length > 0 && (
          <div className="hints-section">
            <h3 className="text-lg font-semibold text-cyber-text-primary mb-2">
              💡 Hints
            </h3>
            <div className="hints-list space-y-2">
              {hints.map((hint, index) => (
                <div key={index} className="hint-item flex gap-2 p-3 bg-cyber-bg/50 rounded-md">
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
                  className={`submission-item flex justify-between items-center p-3 rounded-md ${
                    submission.correct ? 'bg-green-900/20 border border-green-600/30' : 'bg-red-900/20 border border-red-600/30'
                  }`}
                >
                  <span className="submission-flag text-sm text-cyber-text-primary font-mono">
                    {submission.flag}
                  </span>
                  <span className="submission-status text-sm font-medium">
                    {submission.correct ? '✅ Correct' : '❌ Incorrect'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="challenge-actions mt-6 space-y-4">
        <form onSubmit={handleSubmitFlag} className="flag-submission">
          <div className="flag-input-group space-y-3">
            <input
              type="text"
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              placeholder="Enter flag (e.g., flag{your_answer_here})"
              className="flag-input w-full p-3 bg-cyber-bg border border-cyber-border rounded-md text-cyber-text-primary"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="submit-flag-btn w-full px-4 py-3 bg-cyber-cyan-600 text-white rounded-md font-semibold hover:bg-cyber-cyan-700 transition-colors"
              disabled={!flagInput.trim() || isSubmitting}
            >
              {isSubmitting ? '⏳ Submitting...' : '🏁 Submit Flag'}
            </button>
          </div>
        </form>

        <div className="action-buttons space-y-3">
          <button
            onClick={handleRequestHint}
            className="hint-btn w-full px-4 py-2 bg-cyber-yellow-600 text-white rounded-md font-semibold hover:bg-cyber-yellow-700 transition-colors"
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
                : 'Request a hint'
            }
          >
            {isRequestingHint
              ? '⏳ Getting hint...'
              : `💡 Hint (${hintsUsed}/${maxHints})`}
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
