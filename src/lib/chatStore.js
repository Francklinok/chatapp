/**
 * Chat Store - Zustand State Management
 *
 * This store manages the global state for chat functionality including:
 * - Active chat selection
 * - User blocking status
 * - Chat participant information
 *
 * @module chatStore
 */

import { create } from "zustand";
import { useUserStore } from "./userStore";
import { updateDoc, doc, arrayUnion, getDoc } from "firebase/firestore";

/**
 * Chat Store Hook
 *
 * Provides global state management for chat-related data and actions.
 *
 * @typedef {Object} ChatStore
 * @property {string|null} chatId - The ID of the currently active chat
 * @property {Object|null} user - The user object of the chat participant
 * @property {boolean} isCurrentUserBlocked - Whether the current user is blocked by the other participant
 * @property {boolean} isReceiverBlocked - Whether the current user has blocked the other participant
 * @property {Function} changeChat - Function to switch to a different chat
 * @property {Function} changeBlock - Function to toggle block status
 * @property {Function} resetChat - Function to reset chat state on logout
 */
export const useChatStore = create((set, get) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  /**
   * Change Active Chat
   *
   * Updates the active chat and determines the blocking status between users.
   * Handles three scenarios:
   * 1. Current user is blocked by the other participant
   * 2. Current user has blocked the other participant
   * 3. No blocking between users
   *
   * @async
   * @param {string} chatId - The ID of the chat to activate
   * @param {Object} user - The user object of the chat participant
   * @returns {Promise<void>}
   */
  changeChat: async (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // Validate user object
    if (!user) {
      console.error("User is undefined in changeChat");
      return;
    }

    // Scenario 1: Current user is blocked by the other participant
    if (user.blocked.includes(currentUser.id)) {
      set({
        chatId,
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    }
    // Scenario 2: Current user has blocked the other participant
    else if (currentUser.blocked.includes(user.id)) {
      set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    }
    // Scenario 3: No blocking between users (normal chat)
    else {
      set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  /**
   * Toggle Block Status
   *
   * Toggles the blocking status of the current chat participant.
   * This allows users to block/unblock other users.
   *
   * @returns {void}
   */
  changeBlock: () => {
    set((state) => ({
      isReceiverBlocked: !state.isReceiverBlocked,
    }));
  },

  /**
   * Reset Chat State
   *
   * Clears all chat-related state. Typically called during logout
   * to ensure no residual chat data remains.
   *
   * @returns {void}
   */
  resetChat: () => {
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));
