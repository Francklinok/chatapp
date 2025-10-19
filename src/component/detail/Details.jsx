/**
 * Details Component - Chat user details and settings panel
 *
 * This component displays detailed information about the chat recipient
 * and provides access to chat-specific settings and actions.
 *
 * Features:
 * - Display recipient's profile (avatar, username, online status)
 * - Chat settings section (collapsible)
 * - Privacy & help section (collapsible)
 * - Shared media section (collapsible)
 * - Block/unblock user functionality
 * - Quick logout option
 * - Close button to dismiss panel
 *
 * Block functionality:
 * - Prevents blocked users from sending messages
 * - Shows "You are blocked" if current user is blocked
 * - Shows "Unblock user" or "Block user" button accordingly
 * - Updates Firestore blocked list in real-time
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the details panel
 * @returns {JSX.Element} The user details panel
 *
 * @example
 * <Details onClose={() => setShowDetails(false)} />
 */

import "./details.css";
import {
  doc,
  updateDoc,
  serverTimestamp,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import OnlineStatus from "../online/Status";
import { toast } from "react-toastify";

const Details = ({ onClose }) => {
  const {user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } =
    useChatStore();
  const { currentUser } = useUserStore();

  /**
   * Handles blocking/unblocking a user
   *
   * Process:
   * 1. Checks if user exists
   * 2. Updates current user's blocked array in Firestore
   * 3. Adds user ID if blocking, removes if unblocking
   * 4. Updates local block state via changeBlock()
   *
   * @async
   */
  const handleBlock = async () => {
    if (!user) return; // Return early if no user is provided

    const userDocRef = doc(db, "users", currentUser.id); // Reference to the current user's document

    try {
      // Update the blocked status of the user
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });

      changeBlock(); // Toggle the blocked state in the application
    } catch (err) {
      console.log(err); // Log any errors
    }
  };


  return (
    <>
        <div className="details">
          {onClose && (
            <button className="close-button" onClick={onClose} title="Close">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          )}

          <div className="user">
            <img src={user?.avatar?.url || "./avatar.png"} alt="" />
            <h2>{user?.username}</h2>
            <p>
              <OnlineStatus userId={user?.id} />
            </p>
          </div>

          <div className="info">
            <div className="options">
              <div className="title">
                <span>Chat settings</span>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
              </div>
            </div>
            <div className="options">
              <div className="title">
                <span>Privacy & help</span>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
              </div>
            </div>
            <div className="options">
              <div className="title">
                <span>Shared media</span>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="button">
            <button onClick={handleBlock}>
              {isCurrentUserBlocked
                ? "You are blocked"
                : isReceiverBlocked
                ? "Unblock user"
                : "Block user"}
            </button>

            <button className="logout" onClick={() => auth.signOut()}>
              Logout
            </button>
          </div>
        </div>

    </>
  );
};

export default Details;
