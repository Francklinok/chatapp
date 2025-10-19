/**
 * User Status Management - Firebase Realtime Database
 *
 * This module handles real-time user online/offline status using Firebase Realtime Database.
 * It automatically tracks user presence and updates status based on connection state.
 *
 * Features:
 * - Automatically sets user as online when connected
 * - Automatically sets user as offline when disconnected (using Firebase onDisconnect)
 * - Uses server timestamps for accurate time tracking
 * - Handles connection state changes in real-time
 *
 * @module userStatus
 */

import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { rtdb } from "./firebase";

/**
 * Set User Online Status
 *
 * Establishes a real-time connection to Firebase Realtime Database and manages
 * the user's online/offline status. This function:
 *
 * 1. Listens to Firebase's `.info/connected` reference to detect connection state
 * 2. Sets the user as "online" when connected
 * 3. Registers an onDisconnect handler to automatically set "offline" status
 *    when the user disconnects (closes browser, loses connection, etc.)
 *
 * The status is stored in the Realtime Database at: `status/{userId}`
 * with the following structure:
 * {
 *   state: "online" | "offline",
 *   last_changed: timestamp
 * }
 *
 * @param {string} userId - The Firebase Authentication user ID
 * @returns {void}
 *
 * @example
 * import { setUserOnlineStatus } from './lib/userStatus';
 *
 * // Set status when user logs in
 * setUserOnlineStatus(currentUser.id);
 *
 * @see {@link https://firebase.google.com/docs/database/web/offline-capabilities Firebase Offline Capabilities}
 */
export const setUserOnlineStatus = (userId) => {
  // Validate userId
  if (!userId) {
    console.error("User ID is missing.");
    return;
  }

  // Reference to the user's status in Realtime Database
  const userStatusRef = ref(rtdb, `status/${userId}`);

  // Status object for offline state
  const isOfflineForRTDB = {
    state: "offline",
    last_changed: serverTimestamp(),
  };

  // Status object for online state
  const isOnlineForRTDB = {
    state: "online",
    last_changed: serverTimestamp(),
  };

  try {
    // Listen to Firebase's connection status
    // `.info/connected` is a special location that indicates the client's connection state
    const connectionRef = ref(rtdb, ".info/connected");

    onValue(connectionRef, (snapshot) => {
      // If client is not connected to Firebase
      if (snapshot.val() === false) {
        console.log("Client is offline.");
        return;
      }

      // Client is connected - set status to "online"
      set(userStatusRef, isOnlineForRTDB)
        .then(() => {
          console.log(`✅ User ${userId} status set to online`);
        })
        .catch((error) => {
          console.error("❌ Error setting online status:", error);
        });

      // Set up automatic offline status when user disconnects
      // This will execute on the server even if the client loses connection abruptly
      onDisconnect(userStatusRef)
        .set(isOfflineForRTDB)
        .then(() => {
          console.log(`🔌 Disconnect handler registered for user ${userId}`);
        })
        .catch((error) => {
          console.error("❌ Error setting disconnect handler:", error);
        });
    });
  } catch (error) {
    console.error("❌ Error updating status:", error);
  }
};
