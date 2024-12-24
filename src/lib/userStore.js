import { create } from "zustand";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const useUserStore = create((set, get) => ({
  currentUser: null,
  isLoading: true,
  isFetching: false, // Flag to prevent multiple fetches

  fetchUserInfo: async (uid) => {
    if (!uid) {
      console.warn("No UID provided for fetchUserInfo");
      return set({ currentUser: null, isLoading: false });
    }

    const { isFetching } = get();

    // Prevent multiple fetch calls if already fetching
    if (isFetching) return;

    // Set fetching and loading flags
    set({ isFetching: true, isLoading: true });

    try {
      // Check if user data is cached in localStorage
      const cachedUser = localStorage.getItem(`user_${uid}`);
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          set({
            currentUser: parsedUser,
            isFetching: false,
            isLoading: false,
          });
          return;
        } catch (e) {
          console.warn("Invalid JSON in localStorage for user:", uid, e);
          localStorage.removeItem(`user_${uid}`); // Clear the invalid cache
        }
      }

      // Fetch user data from Firestore if not in cache
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        // Validate user data before caching
        if (userData && typeof userData === "object") {
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

// import { create } from "zustand";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "./firebase";

// export const useUserStore = create((set, get) => ({
//   currentUser: null,
//   isLoading: true,
//   isFetching: false, // Flag to prevent multiple fetches

//   fetchUserInfo: async (uid) => {
//     if (!uid) {
//       return set({ currentUser: null, isLoading: false });
//     }

//     const { isFetching } = get();

//     // Prevent multiple fetch calls if already fetching
//     if (isFetching) return;

//     // Set fetching and loading flags
//     set({ isFetching: true, isLoading: true });

//     // Check if user data is cached in localStorage
//     const cachedUser = localStorage.getItem(`user_${uid}`);
//     if (cachedUser) {
//       set({
//         currentUser: JSON.parse(cachedUser),
//         isFetching: false,
//         isLoading: false,
//       });
//       return;
//     }

//     try {
//       // Fetch user data from Firestore
//       const docRef = doc(db, "users", uid);
//       const docSnap = await getDoc(docRef);

//       if (docSnap.exists()) {
//         const userData = docSnap.data();

//         // Cache user data in localStorage
//         localStorage.setItem(`user_${uid}`, JSON.stringify(userData));

//         set({
//           currentUser: userData,
//           isFetching: false,
//           isLoading: false,
//         });
//       } else {
//         set({
//           currentUser: null,
//           isFetching: false,
//           isLoading: false,
//         });
//       }
//     } catch (err) {
//       console.log("Error....", err);
//       set({
//         currentUser: null,
//         isFetching: false,
//         isLoading: false,
//       });
//     }
//   },
// }));
