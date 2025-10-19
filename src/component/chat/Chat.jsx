/**
 * Chat Component - Real-time messaging interface with multimedia support
 *
 * This component provides a comprehensive chat interface with support for:
 * - Real-time text messaging with Markdown rendering
 * - File sharing (images, videos, audio, documents)
 * - Emoji reactions and emoji picker
 * - Audio/video calling functionality
 * - Voice message recording
 * - Typing indicators
 * - Message editing and deletion
 * - User blocking/unblocking
 * - Online status tracking
 *
 * Features:
 * - Real-time synchronization with Firebase Firestore
 * - File upload to Firebase Storage
 * - WebRTC-based audio/video calls
 * - Message grouping by date
 * - Markdown support with GitHub Flavored Markdown
 * - Emoji reactions on messages
 * - Voice message recording with microphone
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onShowDetails - Callback to show user details panel
 * @returns {JSX.Element} The chat interface component
 *
 * @example
 * <Chat onShowDetails={() => setShowDetails(true)} />
 */

import EmojiPicker from "emoji-picker-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import "./chat.css";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
  query,
  where,
  collection,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import OnlineStatus from "../online/Status";
import moment from "moment";
import File from "./file/File";
import Reaction from "./reaction/Reaction";
import MessageOption from "./messageOption/MessageList";
import CallerInterface from "./call/callInterface/callerInterface";
import ReceiverInterface from "./call/callInterface/respondInterface";
import Recorder from "./file/recorder/Recorder";
import { useCallStore } from "../../lib/useCall";
import { useCallData } from "../../lib/handleCall";

const Chat = ({ onShowDetails }) => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [VisibleF, setVisibleF] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState({});
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const { callState, resetCallState, updateCallStatus } = useCallStore();

  const { initializeCall, cleanupCall } = useCallData();
  // const { handleStartTyping, handleStopTyping } = useTypingTracker(chatId, user, setTypingUsers, setLoading, chat);

  const [callId, setCallId] = useState(null);
  const [callType, setCallType] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false); 
  const [isReceivingCall, setIsReceivingCall] = useState(false); 
  const { currentUser } = useUserStore();
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const endRef = useRef(null);
  const timeoutRef = useRef(null);

  console.log("donner de l appel", initializeCall);

  /**
   * Effect: Clean up call resources when a call ends
   * Monitors the call state and triggers cleanup when status becomes "ended"
   */
  useEffect(() => {
    if (callState && callState.status === "ended") {
      cleanupCall();
    }
  }, [callState?.status]);

  /**
   * Handles the display of user details panel
   * Invokes the onShowDetails callback if provided
   */
  const handleShowDetails = () => {
    if (onShowDetails) {
      onShowDetails();
    } else {
      console.log("Show details clicked - no handler provided");
    }
  };

  /**
   * Effect: Listen for incoming calls
   * Sets up a real-time listener for incoming calls from other users
   * Updates local state when a call is initiated
   */
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const incomingCallQuery = query(
      collection(db, "calls"),
      where("receiverId", "==", currentUser.id),
      where("status", "==", "calling")
    );

    const unsubscribeIncoming = onSnapshot(incomingCallQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const callData = doc.data();
        if (callData && !callData.accepted && !callData.rejected) {
          setCallId(doc.id);
          setIsReceivingCall(true);
          setCallType(callData.type);
        }
      });
    });

    return () => unsubscribeIncoming();
  }, [currentUser, updateCallStatus]);

  /**
   * Effect: Monitor active call status changes
   * Listens to the current call document and ends the call if status is "ended" or "rejected"
   */
  useEffect(() => {
    if (!callId) return;

    const callRef = doc(db, "calls", callId);
    const unsubscribeOutgoing = onSnapshot(callRef, (snapshot) => {
      const callData = snapshot.data();

      if (callData?.status === "ended" || callData.status === "rejected") {
        handleEndCall();
      }
    });

    return () => unsubscribeOutgoing();
  }, [callId]);

  /**
   * Effect: Listen for real-time chat updates
   * Subscribes to chat document changes and updates the local chat state
   * Provides console logging for debugging message synchronization
   */
  useEffect(() => {
    if (!chatId) return;

    console.log(`🎧 Setting up listener for chatId: ${chatId}`);

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      const chatData = res.data();
      console.log(`📨 Received chat update for chatId: ${chatId}`, {
        messagesCount: chatData?.messages?.length || 0,
        lastMessage: chatData?.messages?.[chatData.messages.length - 1]?.text?.substring(0, 30)
      });

      if (chatData && chatData.messages) {
        setChat(chatData);
      }
    });

    return () => {
      console.log(`🔌 Unsubscribing from chatId: ${chatId}`);
      unSub();
    };
  }, [chatId]);

  /**
   * Effect: Update loading state when chat data is available
   * Sets loading to false once chat data has been fetched
   */
  useEffect(() => {
    setLoading(false);
  }, [chat]);

  /**
   * Effect: Listen for typing status updates
   * Monitors typing indicators from other users in the chat
   * Filters out the current user from the typing users list
   */
  useEffect(() => {
    if (!chatId || !user?.id) return;

    const typingDocRef = doc(db, "chats", chatId);

    const unsubscribe = onSnapshot(typingDocRef, (snapshot) => {
      const data = snapshot.data();
      if (data && data.typing) {
        setTypingUsers(
          Object.keys(data.typing).filter(
            (uid) => uid !== user.id && data.typing[uid]?.isTyping
          )
        );
      } else {
        setTypingUsers([]); 
      }
    });

    return () => unsubscribe();
  }, [chatId, user?.id, setTypingUsers]);

  /**
   * Effect: Clean up typing timeout on component unmount
   * Ensures proper cleanup of the typing indicator timeout
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Initiates typing status indicator
   * Updates Firestore to show the current user is typing
   * Sets a 5-second timeout to automatically stop the typing indicator
   *
   * @async
   * @function
   */
  const handleStartTyping = async () => {
    if (!chatId || !user?.username) return;

    const typingDocRef = doc(db, "chats", chatId);

    try {
      await updateDoc(typingDocRef, {
        [`typing.${user.id}`]: { isTyping: true },
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => handleStopTyping(), 5000);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de saisie:",
        error
      );
    }
  };

  /**
   * Stops the typing status indicator
   * Updates Firestore to show the current user has stopped typing
   * Clears any existing typing timeout
   *
   * @async
   * @function
   */
  const handleStopTyping = async () => {
    if (!chatId || !user?.username) return;

    const typingDocRef = doc(db, "chats", chatId);

    try {
      await updateDoc(typingDocRef, {
        [`typing.${user.id}`]: { isTyping: false },
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de saisie:",
        error
      );
    }
  };

  /**
   * Handles text input changes
   * Updates the message text state as the user types
   *
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event
   */
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  /**
   * Handles emoji selection from the emoji picker
   * Appends the selected emoji to the current message text
   *
   * @param {Object} e - The emoji picker event object
   * @param {string} e.emoji - The selected emoji character
   */
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
    console.log(e);
  };

  /**
   * Toggles the file attachment panel visibility
   * Shows or hides the file upload interface
   */
  const handleImage = () => {
    setVisibleF((prev) => !prev);
  };

  /**
   * Groups chat messages by date for organized display
   * Formats messages into date-based sections using moment.js
   *
   * @type {Object.<string, Array>}
   */
  const groupedMessages = chat?.messages?.reduce((acc, message) => {
    let date;

    if (
      message.createdAt &&
      typeof message.createdAt.toDate === "function" &&
      !isNaN(message.createdAt.toDate())
    ) {
      date = moment(message.createdAt.toDate()).format("YYYY-MM-DD");
    } else {
      console.error("invalid message date", message);
      date = "invalid date";
    }

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  /**
   * Handles message editing
   * Updates the message text in the local messages state
   *
   * @param {string} messageId - The ID of the message to edit
   * @param {string} newText - The new text content for the message
   */
  const handleEditMessage = (messageId, newText) => {
    console.log(`Message édité: ID=${messageId}, Nouveau Texte=${newText}`);
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, text: newText } : msg
      )
    );
  };

  /**
   * Handles message deletion
   * Placeholder function for deleting messages (to be implemented)
   *
   * @async
   * @param {string} messageId - The ID of the message to delete
   */
  const handleDeleteMessage = async (messageId) => {
    console.log(`Message supprimé: ID=${messageId}`);
  };

  /**
   * Uploads a file to Firebase Storage
   * Organizes files into folders based on their type (photos, videos, audios, documents, etc.)
   * Uses UUID to generate unique filenames
   *
   * @async
   * @param {File} file - The file object to upload
   * @param {string} fileType - The type of file (image, video, audio, document, contact)
   * @returns {Promise<Object>} The uploaded file metadata
   * @returns {string} return.name - Original filename
   * @returns {string} return.type - File type
   * @returns {string} return.url - Firebase Storage download URL
   * @throws {Error} If upload fails
   */
  const sendFile = async (file, fileType) => {
    try {
      // Mapping file types to storage folder names
      const folderMap = {
        image: "photos",
        video: "videos",
        audio: "audios",
        document: "documents",
        contact: "contacts",
      };
      // Choose folder based on the file type, default to 'others' if not matched
      const folder = folderMap[fileType] || "others";
      const fileRef = ref(storage, `${folder}/${uuidv4()}-${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      return new Promise((resolve, reject) => {
        // Track upload state and handle completion or errors
        uploadTask.on(
          "state_changed",
          null, // No progress tracking is defined here
          (error) => reject(error), // Reject the promise on error
          async () => {
            // Get the download URL once the upload completes successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              name: file.name,
              type: fileType,
              url: downloadURL,
            });
          }
        );
      });
    } catch (error) {
      console.error("Error uploading file:", error); // Log error if something goes wrong
      throw error; // Throw error to be handled by the caller
    }
  };

  /**
   * Sends a message with optional file attachments
   * Handles both text messages and file uploads, creates a message object,
   * stores it in Firestore, and updates user chat metadata
   *
   * Features:
   * - Validates message content (text or files required)
   * - Uploads files to Firebase Storage
   * - Creates unique message IDs using UUID
   * - Updates both chat document and user chats
   * - Stops typing indicator after sending
   *
   * @async
   * @param {Object} params - Message parameters
   * @param {string} [params.text=""] - The message text content
   * @param {Array<{file: File, type: string}>} [params.files=[]] - Array of file objects with their types
   * @throws {Error} If message sending fails
   */
  const handleSend = async ({ text = "", files = [] }) => {
    if (!text.trim() && files.length === 0) return;

    if (!chatId || !user?.id) {
      console.error("❌ Cannot send message: chatId or user.id is missing");
      return;
    }

    try {
      let uploadedFiles = [];

      // If files are provided, upload them
      if (files.length > 0) {
        uploadedFiles = await Promise.all(
          files.map((fileObj) => sendFile(fileObj.file, fileObj.type)) // Include file type when calling sendFile
        );
      }

      // Create a new message object
      const newMessage = {
        id: uuidv4(),
        senderId: currentUser.id,
        text: text.trim() || null,
        createdAt: new Date(),
        files: uploadedFiles.length > 0 ? uploadedFiles : null, // Attach uploaded files if any
        type: uploadedFiles.length > 0 ? "file" : "text", // Message type (file or text)
        isSeen: false,
        reaction: {},
      };

      console.log("📤 Sending message:", {
        chatId,
        senderId: currentUser.id,
        receiverId: user.id,
        messagePreview: text.substring(0, 50)
      });

      // Reference to the chat document in Firestore
      const chatRef = doc(db, "chats", chatId);

      // Add the new message to the chat document
      await updateDoc(chatRef, {
        messages: arrayUnion(newMessage),
      });

      console.log("✅ Message added to chat document");

      // Update user chat information with the new message
      await updateUserChats(newMessage);

      console.log("✅ Message sent successfully");

      // Reset the input text field after sending
      setText("");

      // Stop typing indicator
      await handleStopTyping();
    } catch (error) {
      console.error("❌ Error sending message:", error); // Log any error encountered
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    }
  };

  /**
   * Updates user chat metadata after sending a message
   * Updates the chat list for both sender and receiver with the latest message info
   *
   * Process:
   * 1. Retrieves each user's chat list from Firestore
   * 2. Finds the specific chat by chatId
   * 3. Updates lastMessage, isSeen status, and timestamp
   * 4. Saves updated chat list back to Firestore
   *
   * Features:
   * - Automatically marks sender's message as seen
   * - Marks receiver's message as unseen
   * - Displays file type icons for media messages
   * - Provides detailed console logging for debugging
   *
   * @async
   * @param {Object} newMessage - The message object to update in user chats
   * @param {string} newMessage.text - Message text content
   * @param {Array} newMessage.files - Attached files
   * @param {string} newMessage.senderId - ID of the message sender
   */
  const updateUserChats = async (newMessage) => {
    const userIDs = [currentUser.id, user.id]; // The two users involved in the chat

    console.log("🔍 Starting updateUserChats with:", {
      currentUserId: currentUser.id,
      receiverId: user.id,
      chatId: chatId,
      messagePreview: newMessage.text?.substring(0, 30)
    });

    for (const id of userIDs) {
      try {
        console.log(`\n📝 Processing user: ${id === currentUser.id ? 'SENDER' : 'RECEIVER'} (${id})`);

        // Reference to the user's chat data in Firestore
        const userChatsRef = doc(db, "userchats", id);

        // Get the current user chats
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          console.log(`   📦 User ${id} has ${userChatsData.chats?.length || 0} chats`);

          if (!userChatsData.chats || !Array.isArray(userChatsData.chats)) {
            console.error(`   ❌ Invalid chats structure for user: ${id}`);
            continue;
          }

          // Find the chat that corresponds to the current chat
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          console.log(`   🔎 Searching for chatId: ${chatId}`);
          console.log(`   📍 Chat found at index: ${chatIndex}`);

          if (chatIndex !== -1) {
            const existingChat = userChatsData.chats[chatIndex];
            console.log(`   📄 Existing chat:`, {
              chatId: existingChat.chatId,
              receiverId: existingChat.receiverId,
              lastMessage: existingChat.lastMessage,
              isSeen: existingChat.isSeen
            });

            // Determine the content of the 'lastMessage' field
            let lastMessageContent = newMessage.text || "";
            if (newMessage.files && newMessage.files.length > 0) {
              const fileTypes = newMessage.files.map((file) => file.type);
              // Set different message content based on file type
              if (fileTypes.includes("image"))
                lastMessageContent = "📷 Photo";
              else if (fileTypes.includes("video"))
                lastMessageContent = "🎥 Video";
              else if (fileTypes.includes("audio"))
                lastMessageContent = "🎵 Audio";
              else if (fileTypes.includes("document"))
                lastMessageContent = "📄 Document";
              else lastMessageContent = "📎 File";
            }

            // Update the last message and other chat details
            userChatsData.chats[chatIndex] = {
              ...userChatsData.chats[chatIndex],
              lastMessage: lastMessageContent,
              isSeen: id === currentUser.id, // Mark as seen immediately for the sender
              updatedAt: Date.now(), // Set the current timestamp for last update
            };

            console.log(`   📝 Updated chat to:`, {
              lastMessage: lastMessageContent,
              isSeen: id === currentUser.id,
              updatedAt: userChatsData.chats[chatIndex].updatedAt
            });

            // Save the updated chat data in Firestore
            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });

            console.log(`   ✅ Chat updated successfully in Firestore for user: ${id}`);
          } else {
            console.error(`   ❌ Chat NOT FOUND in userchats for user: ${id}`);
            console.error(`   📋 Available chatIds:`, userChatsData.chats.map(c => c.chatId));
            console.error(`   🔍 Looking for chatId: ${chatId}`);
          }
        } else {
          console.error(`   ❌ No 'userchats' document found for user: ${id}`);
        }
      } catch (error) {
        console.error(`   ❌ Error updating chats for user: ${id}`, error);
      }
    }

    console.log("✅ updateUserChats completed\n");
  };

  /**
   * Initiates an audio or video call
   * Creates a unique call ID and initializes the WebRTC call session
   *
   * @param {boolean} [isVideo=false] - True for video call, false for audio-only
   */
  const handleStartCall = (isVideo = false) => {
    const callId = `call_${Date.now()}`; // Generate a unique call ID based on the current timestamp
    const callerId = currentUser.id;
    const receiverId = user.id;
    if (user.id) {
      // Initialize the call with the generated callId and other details
      initializeCall({ callId, isVideo, callerId, receiverId });
      setCallId(callId);
      setCallType(isVideo ? "video" : "audio");
      setIsInitiatingCall(true); // Set the initiating call state to true
    }
  };

  /**
   * Ends the current call session
   * Updates call status in Firestore and cleans up local call state
   *
   * @async
   */
  const handleEndCall = async () => {
    if (!callId) return; // Do nothing if there is no active call

    try {
      // Update the call status to "ended" in Firestore
      const callRef = doc(db, "calls", callId);
      await updateDoc(callRef, {
        status: "ended",
      });

      // Clean up the call state
      cleanupCall();
      resetCallState();
      setCallId(null); // Reset call ID
      setIsInitiatingCall(false); // Reset call initiation state
      setIsReceivingCall(false); // Reset call reception state
    } catch (error) {
      console.error("Error ending the call:", error); // Log any error encountered
    }
  };

  /**
   * Starts voice message recording
   * Sets the recording state to active
   */
  const handleStartRecording = () => {
    setIsRecording(true);
  };

  /**
   * Stops voice message recording
   * Sets the recording state to inactive
   */
  const handleStopRecording = () => {
    setIsRecording(false);
  };

  /**
   * Handles message click to show/hide options
   * Toggles the visibility of message options (reactions, edit, delete)
   * Only one message can have visible options at a time
   *
   * @param {string} messageId - The unique identifier of the clicked message
   */
  const handleClick = (messageId) => {
    setActiveMessageId((prevId) => (prevId === messageId ? null : messageId));
    setEmojiPickerVisible((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  return (
    <>
      <div className="chat">
        <div className="chat-header">
          <div className="user-info" onClick={handleShowDetails}>
            <img src={user?.avatar?.url || "./avatar.png"} alt="User Avatar" className="user-avatar" />
            <div className="user-details">
              <h3 className="username">{user?.username}</h3>
              <div className="status-container">
                <OnlineStatus userId={user?.id} />
                {typingUsers.length > 0 && (
                  <span className="typing-indicator">
                    typing...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="action-btn"
              title="Search in conversation"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14Z"/>
              </svg>
            </button>

            <button 
              className="action-btn"
              onClick={() => handleStartCall(false)}
              title="Voice call"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
              </svg>
            </button>

            <button 
              className="action-btn"
              onClick={() => handleStartCall(true)}
              title="Video call"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
              </svg>
            </button>

            <button 
              className="action-btn menu-btn"
              title="Menu"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* caller interface*/}

        {isInitiatingCall && callId && (
          <CallerInterface
            callId={callId}
            callType={callType}
            onEndCall={handleEndCall}
          />
        )}

        {/* receiver interface */}
        {isReceivingCall && callId && (
          <ReceiverInterface
            callId={callId}
            callType={callType}
            onEndCall={handleEndCall}
          />
        )}
        <div className="center">
          {loading && <p1>Loading messages...</p1>}
          {groupedMessages &&
            Object.keys(groupedMessages).map((date) => (
              <div key={date} className="date">
                <div className="date-header">{date}</div>

                {groupedMessages[date].map((message) => {
                  const isOwnMessage = message.senderId === currentUser?.id;
                  const isActive = activeMessageId === message?.id;
                  const isDeleted = message.deleted;

                  return (
                    <div
                      className={`message ${isOwnMessage ? "own" : ""}`}
                      key={message.id}
                      onClick={() => handleClick(message?.id)}
                    >
                      {!isOwnMessage && (
                        <img
                          src={user?.avatar?.url || "./avatar.png"}
                          alt="Avatar"
                        />
                      )}

                      <div className="text-react">
                        <div
                          className="texts"
                          style={{
                            backgroundColor: isDeleted ? "#536177a1" : "",
                          }}
                        >
                          <div className="message-render">
                            {isDeleted ? (
                              <em className="message-delete">
                                Message supprimé
                              </em>
                            ) : (
                              <div className="render">
                                {message.text && (
                                  <ReactMarkdown
                                    className="message-text"
                                    remarkPlugins={[remarkGfm]}
                                  >
                                    {message.text}
                                  </ReactMarkdown>
                                )}
                                {message.files &&
                                  message.files.map((file, idx) => (
                                    <div
                                      key={idx}
                                      className={`file-preview ${file.type}`}
                                    >
                                      {file.type === "image" && (
                                        <img src={file.url} alt={file.name} />
                                      )}
                                      {file.type === "video" && (
                                        <video controls>
                                          <source
                                            src={file.url}
                                            type="video/mp4"
                                          />
                                        </video>
                                      )}
                                      {file.type === "audio" && (
                                        <audio controls>
                                          <source
                                            src={file.url}
                                            type="audio/mpeg"
                                          />
                                        </audio>
                                      )}
                                      {file.type === "document" && (
                                        <a href={file.url} download>
                                          {file.name}
                                        </a>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}

                            <span className="date">
                              {message.createdAt &&
                              message.createdAt.toDate &&
                              !isNaN(message.createdAt.toDate())
                                ? new Intl.DateTimeFormat("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  }).format(
                                    new Date(message.createdAt?.toDate())
                                  )
                                : "date invalide"}
                            </span>
                          </div>
                        </div>
                        {message.reaction &&
                          Object.keys(message.reaction).length > 0 && (
                            <div className="react-message">
                              {Object.entries(message.reaction).map(
                                ([emoji, count]) => (
                                  <span key={emoji} className="emoji">
                                    {emoji}
                                    {count}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                      </div>

                      {isActive && (
                        <div
                          className={`options ${
                            isOwnMessage ? "align-left" : "align-right"
                          }`}
                        >
                          <div className="messageoption">
                            <MessageOption
                              message={message}
                              chatId={chatId}
                              db={db}
                              onEdit={handleEditMessage}
                              onDelete={handleDeleteMessage}
                              currentUser={currentUser}
                            />
                          </div>

                          <div className="reaction">
                            <Reaction message={message} chatId={chatId} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div ref={endRef}></div>
              </div>
            ))}
        </div>

        <Recorder
          className="recorder"
          chatId={chatId}
          senderId={currentUser.id}
          sendAudio={handleSend}
          startRecording={isRecording}
          stopRecording={!isRecording}
        />

        <div className="bottom">
          <div className="icons">
            <img src="./attachfile.png" onClick={handleImage} alt="" />
            <div className={`mic-button ${isRecording ? "recording" : ""}`}>
              <img
                src="./mic.png"
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                aria-label="Enregistrer un message audio"
                alt="Microphone"
              />
            </div>
          </div>

          <textarea
            id="messageInput"
            placeholder={
              isCurrentUserBlocked || isReceiverBlocked
                ? "you can note send a message"
                : "type a message ..."
            }
            value={text}
            onKeyDown={handleStartTyping}
            onKeyUp={handleStopTyping}
            onChange={handleTextChange}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />

          <div className="emoji">
            <img
              src="./emoji.png"
              alt=""
              onClick={() => {
                setOpen((prev) => !prev);
              }}
            />
          </div>
          {open && (
            <div className="picker">
              <EmojiPicker open={open} onEmojiClick={handleEmoji} />
            </div>
          )}
          <div className="files">
            {VisibleF && <File onSend={handleSend} />}
          </div>
          <button
            className="sendButton"
            onClick={() => handleSend({ text })}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
            title="Send message"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};
export default Chat;
