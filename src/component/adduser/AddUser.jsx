/**
 * AddUser Component - Search and add new chat contacts
 *
 * This component provides a search interface to find and add new users to chat with.
 * It allows searching for users by username and creating new chat conversations.
 *
 * Features:
 * - Search users by exact username match
 * - Display found user's profile (avatar and username)
 * - Create new chat conversation with selected user
 * - Initialize chat documents in Firestore
 * - Update both users' chat lists
 *
 * Process:
 * 1. User enters a username to search
 * 2. Query Firestore users collection
 * 3. Display matching user if found
 * 4. On "Add User", create a new chat document
 * 5. Update both users' chat lists with the new chat reference
 *
 * @component
 * @returns {JSX.Element} The add user search interface
 *
 * @example
 * <AddUser />
 */

import "./addUser.css";
import { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  /**
   * Handles user search by username
   *
   * Process:
   * 1. Extracts username from form input
   * 2. Queries Firestore users collection for exact match
   * 3. Sets user state if found, clears if not found
   *
   * Note: Uses exact match (==) for username, case-sensitive
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username"); // Get the username from the form input

    try {
      // Reference to the "users" collection in Firestore
      const userRef = collection(db, "users");
      // Query to search for the user with the specified username
      const q = query(userRef, where("username", "==", username));
      // Execute the query
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        // If the user is found, set the user state with the first document's data
        setUser(querySnapShot.docs[0].data());
        console.log("User found");
      } else {
        // If no user is found, log it
        console.log("User not found");
      }
    } catch (err) {
      // Handle errors during the search process
      console.log("Error searching user", err);
    }
  };

  /**
   * Handles adding a found user to create a new chat
   *
   * Process:
   * 1. Creates a new chat document with empty messages array
   * 2. Updates the found user's chat list (userchats collection)
   * 3. Updates the current user's chat list (userchats collection)
   * 4. Both users get the same chatId reference for the conversation
   *
   * Chat structure:
   * - chats/{chatId}: Contains messages array
   * - userchats/{userId}: Contains array of chat references
   *
   * Each chat reference includes:
   * - chatId: Reference to the chat document
   * - lastMessage: Preview of last message
   * - receiverId: The other user in the conversation
   * - updatedAt: Timestamp for sorting
   *
   * @async
   */
  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      // Create a new document reference for the chat
      const newChatRef = doc(chatRef);

      // Create a new chat document with initial data
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Update the user chats collection for the found user by adding the new chat
      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      // Update the current user's chats collection by adding the new chat
      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      }).then(() => {
        // Log success after updating the chats for both users
        console.log("Current user successfully updated");
        console.log(user);
        console.log(currentUser);
      });

      // Log success after creating the new chat
      console.log("Chat created successfully...");
    } catch (err) {
      // Handle errors during the process of adding the user to the chat
      console.log("Error adding user to chat:", err);
    }
  };

  return (
    <div className="addUser">
      <div className="addUser-content">
        {/* Form to search for a user by username */}
        <form onSubmit={handleSearch}>
          <input type="text" placeholder="username" name="username" required />
          <button>Search</button>
        </form>

        {/* Display user details and "Add User" button if user is found */}
        {user && (
          <div className="user">
            <div className="detail">
              <img src={user.avatar || "./avatar.png"} alt="" />
              <span>{user.username}</span>
            </div>
            {/* Button to add the found user to a chat */}
            <button onClick={handleAdd}>Add User</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUser;




