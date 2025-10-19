/**
 * Welcome Component - Landing page display when no chat is selected
 *
 * This component serves as a placeholder screen that appears in the main chat area
 * when no conversation is currently active or selected.
 *
 * Features:
 * - Displays welcome icon with gradient styling
 * - Shows application name "Chat Web"
 * - Information about offline messaging capability
 * - End-to-end encryption notice with lock icon
 * - Responsive design matching the app's theme
 *
 * Visual elements:
 * - Custom SVG icon with gradient fill
 * - Lock icon to indicate security
 * - Clean, centered layout
 *
 * This component is typically displayed:
 * - On initial app load before selecting a chat
 * - After logging in with no active conversation
 * - When a chat is deselected or closed
 *
 * @component
 * @returns {JSX.Element} The welcome screen interface
 *
 * @example
 * <Welcome />
 */

import "./welcome.css";

const Welcome = () => {
  return (
    <div className="welcome">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg viewBox="0 0 303 172" width="360" height="205">
            <defs>
              <linearGradient id="welcome-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#00a884" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#00a884" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            <path fill="url(#welcome-gradient)" d="M229.565 160.031c2.876 0 5.21-2.333 5.21-5.209V100.88c0-2.876-2.334-5.209-5.21-5.209h-33.394V87.74c0-2.876-2.333-5.209-5.209-5.209h-33.394V74.6c0-2.876-2.333-5.209-5.209-5.209h-33.394c-2.876 0-5.209 2.333-5.209 5.209v7.931h-33.394c-2.876 0-5.209 2.333-5.209 5.209v7.931H76.559c-2.876 0-5.209 2.333-5.209 5.209v53.942c0 2.876 2.333 5.209 5.209 5.209h33.394v7.931c0 2.876 2.333 5.209 5.209 5.209h33.394v7.931c0 2.876 2.333 5.209 5.209 5.209h75.8c2.876 0 5.21-2.333 5.21-5.209v-7.931z"/>
          </svg>
        </div>

        <h2>Chat Web</h2>
        <p className="welcome-text">
          Send and receive messages without keeping your phone online.<br/>
        </p>

        <div className="welcome-footer">
          <svg viewBox="0 0 10 12" width="10" height="12">
            <path fill="currentColor" d="M4.8 1.5A2.7 2.7 0 0 0 2.1 4.2v.5H1.5c-.3 0-.5.2-.5.5v4.9c0 .3.2.5.5.5h6c.3 0 .5-.2.5-.5V5.2c0-.3-.2-.5-.5-.5H7.4v-.5C7.4 2.1 6.3 1 4.8 1.5zm2.1 2.7v.5h-4v-.5c0-1.1.9-2 2-2s2 .9 2 2z"/>
          </svg>
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
