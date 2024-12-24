/**
 * Main Chat Component
 * This component manages and renders the chat interface, handling messages, files, emoji reactions,
 * user typing status, and call functionalities (audio/video). It integrates Firebase for real-time
 * data updates and storage, and uses external libraries for enhanced functionality.
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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Pour le stockage des fichiers
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

/**
 * Main Chat component.
 * Handles rendering, sending, and managing messages, files, and call functionalities.
 * @component
 */
const Chat = () => {
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
  const [callType, setCallType] = useState(null); // "audio" ou "video"
  const [isInitiatingCall, setIsInitiatingCall] = useState(false); // true si on initie l'appel
  const [isReceivingCall, setIsReceivingCall] = useState(false); // true si on reçoit l'appel
  const { currentUser } = useUserStore();
  const [isRecording, setIsRecording] = useState(false); // Etat pour gérer l'enregistrement
  const [typingUsers, setTypingUsers] = useState([]);
  const endRef = useRef(null);
  const timeoutRef = useRef(null);

  console.log("donner de l appel", initializeCall);

  // Clean up resources when a call ends.
  useEffect(() => {
    if (callState.status === "ended") {
      cleanupCall();
    }
  }, [callState.status]);

  /**
   * Effect to listen to incoming calls.
   * Updates state when a call is initiated.
   * @function
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

  // Listen for changes in  the call and  if it when necessary
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

  //Listen for changes in the chat document
  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      const chatData = res.data();
      if (chatData && chatData.messages) {
        setChat(chatData);
      }
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  // Set loading to false when chat data is available
  useEffect(() => {
    setLoading(false); // set loading to false once chat data is available
  }, [chat]); // This effect will run every time 'chat' data is updated

  // Listen for tping users and update the tping status
  useEffect(() => {
    if (!chatId || !user?.id) return;

    const typingDocRef = doc(db, "chats", chatId);

    const unsubscribe = onSnapshot(typingDocRef, (snapshot) => {
      const data = snapshot.data();
      if (data && data.typing) {
        // Filtrer les utilisateurs sauf l'utilisateur actuel
        setTypingUsers(
          Object.keys(data.typing).filter(
            (uid) => uid !== user.id && data.typing[uid]?.isTyping
          )
        );
      } else {
        setTypingUsers([]); // Aucun utilisateur en train d'écrire
      }
    });

    return () => unsubscribe();
  }, [chatId, user?.id, setTypingUsers]);

  //clear the timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Tracks typing status in Firestore.
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
   * Function to stop typing status in Firestore.
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

  // Function to handle changes in the text input field
  const handleTextChange = (e) => {
    setText(e.target.value); // Update the state 'text' with the new value entered by the user
    // handleTyping();
    // handleTypingOptimistic();
  };

  // Function to handle emoji selection
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji); // Append the selected emoji to the current text
    setOpen(false); // Close the emoji picker after selecting an emoji
    console.log(e); // Log the emoji event object for debugging or further actions
  };

  // Function to toggle the visibility of an image
  const handleImage = () => {
    setVisibleF((prev) => !prev); // Toggle the visibility state of an image, changing it from true to false or vice versa
  };

  // Group messages by date
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

  // Edit message
  const handleEditMessage = (messageId, newText) => {
    console.log(`Message édité: ID=${messageId}, Nouveau Texte=${newText}`);
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, text: newText } : msg
      )
    );
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    console.log(`Message supprimé: ID=${messageId}`);
  };

  /**
   * Uploads a file to Firebase storage.
   * @function
   * @param {File} file - The file to upload.
   * @param {string} fileType - The type of the file.
   * @returns {Promise<Object>} - The uploaded file metadata including its URL.
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
   * Sends a message or files.
   * @function
   * @param {Object} param0 - Contains the text and files to send.
   * @param {string} param0.text - The message text.
   * @param {Array} param0.files - Array of files to send.
   */
  const handleSend = async ({ text = "", files = [] }) => {
    if (!text.trim() && files.length === 0) return; // Don't send anything if message is empty and no files are selected.

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

      // Reference to the chat document in Firestore
      const chatRef = doc(db, "chats", chatId);

      // Add the new message to the chat document
      await updateDoc(chatRef, {
        messages: arrayUnion(newMessage),
      });

      // Update user chat information with the new message
      updateUserChats(newMessage);

      // Reset the input text field after sending
      setText("");
    } catch (error) {
      console.error("Error sending message:", error); // Log any error encountered
    }
  };

  /**
   * Updates user chat information with the new message.
   * @function
   * @param {Object} newMessage - The new message object to update in user chats.
   */
  const updateUserChats = async (newMessage) => {
    const userIDs = [currentUser.id, user.id]; // The two users involved in the chat

    for (const id of userIDs) {
      try {
        // Reference to the user's chat data in Firestore
        const userChatsRef = doc(db, "userchats", id);

        // Get the current user chats
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          // Find the chat that corresponds to the current chat
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          if (chatIndex !== -1) {
            // Determine the content of the 'lastMessage' field
            let lastMessageContent = newMessage.text || "";
            if (newMessage.files && newMessage.files.length > 0) {
              const fileTypes = newMessage.files.map((file) => file.type);
              // Set different message content based on file type
              if (fileTypes.includes("image"))
                lastMessageContent = "Photo sent";
              else if (fileTypes.includes("video"))
                lastMessageContent = "Video sent";
              else if (fileTypes.includes("audio"))
                lastMessageContent = "Audio sent";
              else if (fileTypes.includes("document"))
                lastMessageContent = "Document sent";
              else lastMessageContent = "File sent";
            }

            // Update the last message and other chat details
            userChatsData.chats[chatIndex] = {
              ...userChatsData.chats[chatIndex],
              lastMessage: lastMessageContent,
              isSeen: id === currentUser.id, // Mark as seen immediately for the sender
              updatedAt: Date.now(), // Set the current timestamp for last update
            };

            // Save the updated chat data in Firestore
            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          } else {
            console.error(`Chat not found for user: ${id}`); // Log error if chat is not found
          }
        } else {
          console.error(
            `No 'userchats' document found for user: ${id}` // Log error if no user chats document exists
          );
        }
      } catch (error) {
        console.error(`Error updating chats for user: ${id}`, error);
      }
    }
  };

  /**
   * Starts an audio or video call with the user.
   * @function
   * @param {boolean} isVideo - Whether it's a video call or not (defaults to false for audio).
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
   * Ends the ongoing call.
   * @function
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
   * Starts recording the call.
   * @function
   */
  const handleStartRecording = () => {
    setIsRecording(true); // Set recording state to true
  };

  /**
   * Stops recording the call.
   * @function
   */
  const handleStopRecording = () => {
    setIsRecording(false); // Set recording state to false
  };

  /**
   * Handles the click event on a message to toggle visibility of the emoji picker.
   * @function
   * @param {string} messageId - The ID of the message being clicked.
   */
  const handleClick = (messageId) => {
    setActiveMessageId((prevId) => (prevId === messageId ? null : messageId)); // Toggle active message ID
    setEmojiPickerVisible((prev) => ({
      ...prev,
      [messageId]: !prev[messageId], // Toggle emoji picker visibility for the clicked message
    }));
  };

  return (
    <>
      <div className="chat">
        <div className="top">
          <div className="user">
            <img src={user?.avatar?.url || "./avatar.png"} alt="" />
            <div className="text">
              <span>{user?.username}</span>
              <span>
                <OnlineStatus userId={user?.id} />
              </span>
              <span className="typing">
                {typingUsers.length > 0 &&
                  `${typingUsers.join(", ")} ${
                    typingUsers.length > 1 ? "sont" : "est"
                  } en train d'écrire...`}
              </span>
            </div>
          </div>
          <div className="icons">
            <img
              src="./phone.png"
              onClick={() => handleStartCall(false)}
              alt="call icone"
            />
            <img
              src="./video.png"
              onClick={() => handleStartCall(true)}
              alt=""
            />
            <img src="./info.png" alt="" />
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
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};
export default Chat;
