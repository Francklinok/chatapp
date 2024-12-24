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
  // State to store the user data when a user is found
  const [user, setUser] = useState(null);

  // Getting the current logged-in user from the user store
  const { currentUser } = useUserStore();

  // Function to handle the search of a user by username
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

  // Function to handle adding the found user to a chat
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
    <>
      <div className="addUser">
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
    </>
  );
};

export default AddUser;




