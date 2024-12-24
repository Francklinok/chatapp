import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { rtdb } from "./firebase";

export const setUserOnlineStatus = (userId) => {
  if (!userId) {
    console.error("User ID is missing.");
    return;
  }

  const userStatusRef = ref(rtdb, `status/${userId}`);

  // Status for offline
  const isOfflineForRTDB = {
    state: "offline",
    last_changed: serverTimestamp(),
  };

  // Status for online
  const isOnlineForRTDB = {
    state: "online",
    last_changed: serverTimestamp(),
  };

  try {
    // Listen to the `.info/connected` reference to check if the client is connected to Firebase
    const connectionRef = ref(rtdb, ".info/connected");

    onValue(userStatusRef, (snapshot) => {
      if (snapshot.val() === false) {
        // If not connected, no need to do anything further
        console.log("Client is offline.");
        return;
      }

      // If connected, set the user status to "online"
      set(userStatusRef, isOnlineForRTDB);

      // Automatically set the status to "offline" when the client disconnects
      onDisconnect(userStatusRef).set(isOfflineForRTDB);
    });
  } catch (error) {
    console.error("Error updating status:", error);
  }
};
