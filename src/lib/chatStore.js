// Import necessary modules and functions
import { create } from "zustand"; // Zustand for state management
import { useUserStore } from "./userStore"; // Access to user state
import { updateDoc, doc, arrayUnion, getDoc } from "firebase/firestore"; // Firebase Firestore utilities

// Zustand store for managing chat-related state
export const useChatStore = create((set, get) => ({
  chatId: null, // Current chat ID
  user: null, // Current chat participant
  isCurrentUserBlocked: false, // Whether the current user is blocked by the chat participant
  isReceiverBlocked: false, // Whether the chat participant is blocked by the current user

  // Function to change the active chat and handle block status
  changeChat: async (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser; // Get the current user's data from userStore

    if (!user) {
      console.error("User is undefined in changeChat"); // Log an error if no user is provided
      return;
    }

    // Check if the current user is blocked by the chat participant
    if (user.blocked.includes(currentUser.id)) {
      set({
        chatId, // Set the chat ID
        user: null, // No active chat participant
        isCurrentUserBlocked: true, // Mark current user as blocked
        isReceiverBlocked: false, // Current user has not blocked the participant
      });
    }
    // Check if the chat participant is blocked by the current user
    else if (currentUser.blocked.includes(user.id)) {
      set({
        chatId, // Set the chat ID
        user, // Set the active chat participant
        isCurrentUserBlocked: false, // Current user is not blocked
        isReceiverBlocked: true, // Mark participant as blocked
      });
    }
    // If neither party is blocked, set the chat normally
    else {
      set({
        chatId, // Set the chat ID
        user, // Set the active chat participant
        isCurrentUserBlocked: false, // No blocking by the participant
        isReceiverBlocked: false, // No blocking by the current user
      });
    }
  },

  // Function to toggle the block status of the chat participant
  changeBlock: () => {
    set((state) => ({
      isReceiverBlocked: !state.isReceiverBlocked, // Toggle the block state
    }));
  },
}));
