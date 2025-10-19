

import Chat from "./component/chat/Chat";
import Details from "./component/detail/Details";
import List from "./component/list/List";
import Login from "./component/login/Login";
import Notification from "./component/notification/Notification";
import Welcome from "./component/welcome/Welcome";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { useEffect, useState } from "react";

/**
 * Main App Component
 *
 * Manages the application's authentication flow and main layout structure.
 * Shows different UI based on authentication state and chat selection.
 *
 * @returns {JSX.Element} The main application UI
 */
const App = () => {
  // Extract user state and actions from Zustand store
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();

  // Get current chat ID from chat store
  const { chatId } = useChatStore();

  // Local state for toggling the Details panel
  const [showDetails, setShowDetails] = useState(false);

  /**
   * Authentication Listener Effect
   *
   * Listens for Firebase Authentication state changes and automatically
   * fetches user data when a user signs in or refreshes the page.
   *
   * Cleanup function unsubscribes from auth state changes on unmount.
   */
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      // Fetch user profile data from Firestore when auth state changes
      fetchUserInfo(user?.uid);
    });

    // Cleanup subscription on component unmount
    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  /**
   * Loading State
   *
   * Display loading screen while fetching initial user data.
   * This prevents flashing of login screen when user is already authenticated.
   */
  if (isLoading) {
    return <div className="loading">loading, please wait...</div>;
  }

  // Debug logging for current user state
  console.log("Current user is", currentUser);

  /**
   * Main Application Layout
   *
   * Conditionally renders different layouts based on:
   * 1. Authentication status (logged in vs logged out)
   * 2. Chat selection (chat selected vs welcome screen)
   * 3. Details panel visibility
   */
  return (
    <div className="container">
      {currentUser ? (
        // Authenticated User Layout
        <>
          {/* Left Column: Chat List */}
          <List />

          {/* Center Column: Chat or Welcome */}
          {chatId ? (
            <>
              {/* Active Chat View */}
              <Chat onShowDetails={() => setShowDetails(!showDetails)} />

              {/* Right Column: User Details (Conditional) */}
              {showDetails && <Details onClose={() => setShowDetails(false)} />}
            </>
          ) : (
            /* Welcome Screen (No chat selected) */
            <Welcome />
          )}
        </>
      ) : (
        // Unauthenticated Layout: Login Screen
        <Login />
      )}

      {/* Global Notification Toast Component (Always rendered) */}
      <Notification />
    </div>
  );
};

export default App;
