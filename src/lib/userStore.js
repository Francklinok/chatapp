/**
 * User Store - Zustand State Management
 *
 * This store manages the authenticated user's state including:
 * - Current user data
 * - Loading states
 * - User data caching with localStorage
 * - Fetch prevention to avoid duplicate requests
 *
 * @module userStore
 */

import { create } from "zustand";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * User Store Hook
 *
 * Provides global state management for the authenticated user.
 *
 * @typedef {Object} UserStore
 * @property {Object|null} currentUser - The current authenticated user data
 * @property {boolean} isLoading - Whether user data is currently loading
 * @property {boolean} isFetching - Flag to prevent multiple simultaneous fetch requests
 * @property {Function} fetchUserInfo - Function to fetch user data from Firestore
 */
export const useUserStore = create((set, get) => ({
  currentUser: null,
  isLoading: true,
  isFetching: false,

  /**
   * Fetch User Information
   *
   * Retrieves user data from localStorage cache or Firestore.
   * Implements the following optimizations:
   * 1. Prevents duplicate fetch requests using isFetching flag
   * 2. Uses localStorage for caching to reduce Firestore reads
   * 3. Validates cached data before using it
   * 4. Automatically clears invalid cache entries
   *
   * @async
   * @param {string} uid - The Firebase Authentication user ID
   * @returns {Promise<void>}
   *
   * @example
   * const { fetchUserInfo } = useUserStore();
   * await fetchUserInfo('user123');
   */
  fetchUserInfo: async (uid) => {
    // Validate UID parameter
    if (!uid) {
      console.warn("No UID provided for fetchUserInfo");
      return set({ currentUser: null, isLoading: false });
    }

    const { isFetching } = get();

    // Prevent duplicate requests
    if (isFetching) {
      console.log("Already fetching user info, skipping...");
      return;
    }

    // Set loading states
    set({ isFetching: true, isLoading: true });
    console.log("Fetching user info for UID:", uid);

    try {
      // Attempt to load from localStorage cache
      const cachedUser = localStorage.getItem(`user_${uid}`);
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          console.log("Using cached user data:", parsedUser);
          set({
            currentUser: parsedUser,
            isFetching: false,
            isLoading: false,
          });
          return;
        } catch (e) {
          // Clear corrupted cache
          console.warn("Invalid JSON in localStorage for user:", uid, e);
          localStorage.removeItem(`user_${uid}`);
        }
      }

      // Fetch from Firestore if not cached
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log("Fetched user data from Firestore:", userData);

        // Validate data structure before caching
        if (userData && typeof userData === "object") {
          // Cache for future use
          localStorage.setItem(`user_${uid}`, JSON.stringify(userData));

          set({
            currentUser: userData,
            isFetching: false,
            isLoading: false,
          });
        } else {
          console.warn("Invalid user data from Firestore:", userData);
          set({
            currentUser: null,
            isFetching: false,
            isLoading: false,
          });
        }
      } else {
        // User document doesn't exist in Firestore
        console.warn("User document does not exist for UID:", uid);
        set({
          currentUser: null,
          isFetching: false,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      set({
        currentUser: null,
        isFetching: false,
        isLoading: false,
      });
    }
  },
}));
