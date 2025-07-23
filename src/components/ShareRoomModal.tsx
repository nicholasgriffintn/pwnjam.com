import { type FC, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomKey: string;
}

const ShareRoomModal: FC<ShareRoomModalProps> = ({
  isOpen,
  onClose,
  roomKey,
}) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const shareableUrl = `${window.location.origin}/?join=${roomKey}`;
  
  const handleCopy = () => {
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(15, 15, 35, 0.8)' }}
    >
      <div className="bg-cyber-surface rounded-lg shadow-xl w-full max-w-md p-6 border border-cyber-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-cyber-text-primary">
            Share Room
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cyber-text-muted hover:text-cyber-text-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Close share modal</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-cyber-text-secondary">
              Share this link with your team:
            </p>
            <div className="flex">
              <input
                ref={inputRef}
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 px-3 py-2 border border-cyber-border rounded-l-md bg-cyber-bg text-cyber-text-primary focus:outline-none focus:ring-cyber-green-500 focus:border-cyber-green-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-cyber-green-500 text-cyber-bg rounded-r-md hover:bg-cyber-green-600 focus:outline-none focus:ring-2 focus:ring-cyber-green-300 transition-colors font-semibold"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="mb-3 text-sm text-cyber-text-secondary">
              Or scan this QR code:
            </p>
            <div className="p-4 bg-white border border-cyber-border rounded-lg">
              <QRCodeSVG value={shareableUrl} size={200} />
            </div>
          </div>

          <div className="text-sm text-cyber-text-muted italic">
            Anyone with this link can join this room.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareRoomModal; 