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

// Component: Details
// Handles user profile details, blocking/unblocking users, and logging out
const Details = () => {
  // Access chat-related state and functions
  const {user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } =
    useChatStore();
  // Access current user data
  const { currentUser } = useUserStore();

  // Function to block or unblock a user
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

  // Function to log out the user
  // const handleLogout = async () => {
  //   try {
  //     const userId = auth.currentUser.uid; // Get the current user's ID

  //     // Update the user's status to offline
  //     const userStatusRef = doc(db, "status", userId);
  //     await updateDoc(userStatusRef, {
  //       state: "offline",
  //       last_changed: serverTimestamp(),
  //     });

  //     // Sign out the user
  //     await auth.signOut();
  //     toast.success("Logout successful"); // Display a success notification
  //   } catch (err) {
  //     console.error(err); // Log any errors
  //     toast.error("Error logging out"); // Display an error notification
  //   }
  // };

  return (
    <>
        <div className="details">
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
                <img src="./arrowUp.png" alt="" />
              </div>
            </div>
            <div className="options">
              <div className="title">
                <span>Privacy & help</span>
                <img src="./arrowUp.png" alt="" />
              </div>
            </div>
            <div className="options">
              <div className="title">
                <span>Share photos</span>
                <img src="./arrowDown.png" alt="" />
              </div>
            </div>
          </div>

          <div className="button">
            <button onClick={handleBlock}>
              {isCurrentUserBlocked
                ? "you are blocked"
                : isReceiverBlocked
                ? "user block"
                : "blocked user"}
            </button>

            <button className="logout" onClick={() => auth.signOut()}>
              {" "}
              log out{" "}
            </button>
          </div>
        </div>
      
    </>
  );
};

export default Details;
