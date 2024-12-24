import Chat from "./component/chat/Chat";
import Details from "./component/detail/Details";
import List from "./component/list/List";
import Login from "./component/login/Login";
import Notification from "./component/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { useEffect } from "react";

const App = () => {
  // Access user-related state and methods from the user store.
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();

  // Access chat-related state from the chat store.
  const { chatId } = useChatStore();

  // Effect to listen for authentication state changes using Firebase Auth.
  useEffect(() => {
    // Subscribe to authentication state changes.
    const unSub = onAuthStateChanged(auth, (user) => {
      // Fetch additional user information if a user is logged in.
      fetchUserInfo(user?.uid);
    });

    // Cleanup the subscription when the component is unmounted.
    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  // Display a loading message if the app is still loading user data.
  if (isLoading) {
    return <div className="loading">loading, please wait...</div>;
  }

  // Debugging: Log the current user to the console.
  console.log("Current user is", currentUser);

  return (
    <div className="container">
      {currentUser ? (
        // If a user is logged in, display the List and conditionally render Chat and Details components.
        <>
          <List />
          {chatId && <Chat />}
          {chatId && <Details />}
        </>
      ) : (
        // If no user is logged in, display the Login component.
        <Login />
      )}
      {/* Display the Notification component, always visible  */}
      <Notification />
    </div>
  );
};

export default App;
