/**
 * OnlineStatus Component - Real-time user online status indicator
 *
 * This component displays the current online/offline status of a user
 * and shows their last seen time when offline.
 *
 * Features:
 * - Real-time status updates via Firebase Realtime Database
 * - Shows "online" for active users (green text)
 * - Shows "last seen" with relative time for offline users (gray text)
 * - Handles various time formats:
 *   - "just now" for < 1 minute
 *   - "X mins ago" for < 1 hour
 *   - "X hours ago" for < 24 hours
 *   - "X days ago" for < 1 week
 *   - Full date for older timestamps
 * - Graceful error handling for missing permissions
 *
 * Status tracking:
 * - Listens to /status/{userId} in Realtime Database
 * - Updates automatically when user status changes
 * - Displays offline if no status data found
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.userId - The user ID to track status for
 * @returns {JSX.Element} Formatted status text with appropriate styling
 *
 * @example
 * <OnlineStatus userId="user123" />
 */

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../../lib/firebase";

const OnlineStatus = ({ userId }) => {
  const [status, setStatus] = useState("offline");
  const [lastSeen, setLastSeen] = useState(null);

  /**
   * Effect: Set up real-time listener for user status
   *
   * Subscribes to the user's status in Firebase Realtime Database
   * and updates local state when changes occur.
   *
   * Handles:
   * - Online/offline state changes
   * - Last seen timestamp updates
   * - Missing data (shows offline)
   * - Permission errors (graceful fallback to offline)
   */
  useEffect(() => {
    if (!userId) {
      return;
    }

    const userStatusRef = ref(rtdb, `status/${userId}`);

    const unsubscribe = onValue(
      userStatusRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setStatus(data.state || "offline");
          setLastSeen(data.last_changed);
        } else {
          setStatus("offline");
          setLastSeen(null);
        }
      },
      (error) => {
        console.warn("Could not fetch user status:", error.message);
        setStatus("offline");
        setLastSeen(null);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (status === "online") {
    return (
      <span style={{ color: "#00a884", fontSize: "13px", fontWeight: "400" }}>
        online
      </span>
    );
  }

  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo = "";
    if (diffMins < 1) {
      timeAgo = "just now";
    } else if (diffMins < 60) {
      timeAgo = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      timeAgo = lastSeenDate.toLocaleDateString();
    }

    return (
      <span style={{ color: "#8696a0", fontSize: "13px", fontWeight: "400" }}>
        last seen {timeAgo}
      </span>
    );
  }

  return (
    <span style={{ color: "#8696a0", fontSize: "13px", fontWeight: "400" }}>
      offline
    </span>
  );
};

export default OnlineStatus;
