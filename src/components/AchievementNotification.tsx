import { useState, useEffect } from 'react';
import type { WebSocketMessage, Achievement } from '../types';
import { addEventListener, removeEventListener } from '../lib/api-service';
import { useAchievements } from '../contexts/PlatformConfigContext';

interface AchievementNotificationProps {
  // No props needed
}

export function AchievementNotification({}: AchievementNotificationProps) {
  const [notifications, setNotifications] = useState<Achievement[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Achievement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { achievements, isEnabled } = useAchievements();

  useEffect(() => {
    if (!isEnabled) return;

    const handleAchievementUnlocked = (data: WebSocketMessage) => {
      if (data.message && data.message.startsWith('achievement:')) {
        const achievementId = data.message.split(':')[1];
        const achievement = achievements.find((a: Achievement) => a.id === achievementId);
        if (achievement) {
          setNotifications(prev => [...prev, { ...achievement, unlocked: true }]);
        }
      }
    };

    const handleScoreUpdate = (data: WebSocketMessage) => {
      if (data.message && data.message.includes('achievements:')) {
        const achievementIds = data.message.split('achievements:')[1]?.split(',') || [];
        const newAchievements = achievementIds
          .map((achievementId: string) => achievements.find((a: Achievement) => a.id === achievementId))
          .filter(Boolean) as Achievement[];
        
        if (newAchievements.length > 0) {
          setNotifications(prev => [...prev, ...newAchievements.map((a: Achievement) => ({ ...a, unlocked: true }))]);
        }
      }
    };

    addEventListener('scoreUpdated', handleAchievementUnlocked);
    addEventListener('scoreUpdated', handleScoreUpdate);

    return () => {
      removeEventListener('scoreUpdated', handleAchievementUnlocked);
      removeEventListener('scoreUpdated', handleScoreUpdate);
    };
  }, [achievements, isEnabled]);

  // Process notification queue
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const [next, ...remaining] = notifications;
      setCurrentNotification(next);
      setNotifications(remaining);
      setIsVisible(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentNotification(null);
        }, 300); // Wait for fade out animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications, currentNotification]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentNotification(null);
    }, 300);
  };

  if (!isEnabled || !currentNotification) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className="bg-gradient-to-r from-cyber-yellow-600 to-cyber-orange-600 rounded-xl p-4 shadow-2xl border border-cyber-yellow-500/30 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl animate-bounce">
              {currentNotification.icon}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-sm">
                🎉 Achievement Unlocked!
              </h3>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                +{currentNotification.points}
              </span>
            </div>
            
            <h4 className="font-semibold text-white text-base mb-1 truncate">
              {currentNotification.name}
            </h4>
            
            <p className="text-yellow-100 text-xs leading-relaxed">
              {currentNotification.description}
            </p>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-yellow-200 capitalize">
                {currentNotification.category}
              </span>
              
              <button
                onClick={handleDismiss}
                className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar animation */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full transition-all duration-5000 ease-out"
            style={{ 
              width: isVisible ? '100%' : '0%',
              transitionDelay: isVisible ? '0ms' : '0ms'
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Achievement progress indicator component
interface AchievementProgressProps {
  achievementId: string;
  currentProgress: number;
  maxProgress: number;
  showProgress?: boolean;
}

export function AchievementProgress({ 
  achievementId, 
  currentProgress, 
  maxProgress,
  showProgress = true 
}: AchievementProgressProps) {
  const { achievements, isEnabled } = useAchievements();
  
  if (!isEnabled) return null;
  
  const achievement = achievements.find((a: Achievement) => a.id === achievementId);
  if (!achievement || achievement.unlocked) return null;
  
  const progressPercent = Math.min((currentProgress / maxProgress) * 100, 100);
  const isNearComplete = progressPercent >= 80;
  
  if (!showProgress && progressPercent < 20) return null;
  
  return (
    <div className={`transition-all duration-300 ${isNearComplete ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-3 bg-cyber-surface-alt border border-cyber-border rounded-lg p-3">
        <div className="flex-shrink-0">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
              isNearComplete 
                ? 'bg-cyber-yellow-500/20 border border-cyber-yellow-500/50' 
                : 'bg-cyber-bg border border-cyber-border'
            }`}
          >
            {achievement.icon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-cyber-text-primary text-sm truncate">
              {achievement.name}
            </h4>
            <span className="text-xs text-cyber-text-secondary flex-shrink-0">
              {currentProgress}/{maxProgress}
            </span>
          </div>
          
          <div className="w-full bg-cyber-bg rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isNearComplete 
                  ? 'bg-gradient-to-r from-cyber-yellow-500 to-cyber-orange-500' 
                  : 'bg-cyber-cyan-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {isNearComplete && (
            <p className="text-xs text-cyber-yellow-400 mt-1 animate-pulse">
              Almost there! 🎯
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AchievementNotification;