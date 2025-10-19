/**
 * ChatList Component - Displays user's chat conversations
 *
 * This component provides a list view of all active chat conversations for the current user.
 * It handles real-time updates, search functionality, and chat management.
 *
 * Features:
 * - Real-time chat list updates via Firestore
 * - Search functionality to filter chats by username
 * - Display of last message preview with Markdown support
 * - Unread message indicators
 * - Chat deletion capability
 * - Add new user/chat functionality
 * - Timestamp formatting (relative and absolute)
 * - Active chat highlighting
 *
 * The component:
 * 1. Listens to the user's chat collection in Firestore
 * 2. Fetches recipient user data for each chat
 * 3. Sorts chats by most recent activity
 * 4. Displays unread message count
 * 5. Allows clicking to open a chat conversation
 *
 * @component
 * @returns {JSX.Element} The chat list interface
 *
 * @example
 * <ChatList />
 */

import { useEffect, useState } from "react";
import AddUser from "../../adduser/AddUser";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { useUserStore } from "../../../lib/userStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import moment from "moment";
import "./chatList.css";

const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const { changeChat, chatId } = useChatStore();
  const { currentUser } = useUserStore();

  /**
   * Formats timestamp for display in chat list
   * Provides human-readable time formatting:
   * - "HH:mm" for today
   * - "Yesterday" for yesterday
   * - Day name for within the last week
   * - Full date (DD/MM/YYYY) for older messages
   *
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted time string
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const now = moment();
    const messageTime = moment(timestamp);

    if (now.diff(messageTime, 'days') === 0) {
      return messageTime.format('HH:mm');
    } else if (now.diff(messageTime, 'days') === 1) {
      return 'Yesterday';
    } else if (now.diff(messageTime, 'days') < 7) {
      return messageTime.format('dddd');
    } else {
      return messageTime.format('DD/MM/YYYY');
    }
  };

  /**
   * Effect: Set up real-time listener for user's chat list
   *
   * Process:
   * 1. Subscribes to the current user's chat document in Firestore
   * 2. For each chat, fetches the recipient's user data
   * 3. Filters out null entries (deleted users)
   * 4. Sorts chats by most recent activity (updatedAt)
   * 5. Calculates unread message count for each chat
   *
   * The listener provides real-time updates when:
   * - New messages are received
   * - Messages are read/unread
   * - New chats are created
   * - Chats are deleted
   */
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log(`🎧 ChatList: Setting up listener for user: ${currentUser.id}`);

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        console.log(`📨 ChatList: Received userchats update`);
        const items = res.data()?.chats || [];
        console.log(`   📦 Found ${items.length} chats in userchats`);

        const promises = items.map(async (item) => {
          if (!item.receiverId) return null;

          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.data();

          return user ? { ...item, user } : null;
        });

        const chatData = await Promise.all(promises);

        const filteredChats = chatData
          .filter((chat) => chat !== null)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((chat) => ({
            ...chat,
            unreadCount: chat.messages?.filter((m) => !m.isSeen).length || 0,
          }));

        console.log(`   ✅ ChatList updated with ${filteredChats.length} chats`);
        if (filteredChats.length > 0) {
          console.log(`   📝 Most recent chat:`, {
            chatId: filteredChats[0].chatId,
            lastMessage: filteredChats[0].lastMessage,
            isSeen: filteredChats[0].isSeen,
            updatedAt: new Date(filteredChats[0].updatedAt).toLocaleString()
          });
        }

        const unreadCount = filteredChats.reduce(
          (acc, chat) => acc + (chat.isSeen ? 0 : 1),
          0
        );
        // setTotalUnreadCount(unreadCount);

        setChats(filteredChats);
      }
    );
    return () => {
      console.log(`🔌 ChatList: Unsubscribing listener`);
      unSub();
    };
  }, [currentUser.id]);

  /**
   * Handles chat selection and marks it as seen
   *
   * Process:
   * 1. Validates chat and user data
   * 2. Updates local state to mark chat as seen
   * 3. Updates Firestore with new seen status
   * 4. Changes active chat in the store to display the conversation
   *
   * @async
   * @param {Object} chat - The chat object to select
   * @param {string} chat.chatId - Unique chat identifier
   * @param {Object} chat.user - Recipient user data
   * @param {boolean} chat.isSeen - Whether the chat has been seen
   */
  const handleSelect = async (chat) => {
    if (!chat || !chat.user) {
      console.log("Chat ou données utilisateur manquantes");
      return;
    }

    // Mark selected chat as seen
    const userChats = chats.map((item) => {
      if (item.chatId === chat.chatId) {
        return { ...item, unreadCount: 0, isSeen: true };
      }
      return item;
    });
    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      }); // Update Firestore
      changeChat(chat.chatId, chat.user); // Update active chat in store
    } catch (err) {
      console.log("Erreur lors de la mise à jour des données de chat :", err);
    }
  };

  /**
   * Handles chat deletion
   *
   * Process:
   * 1. Prevents event bubbling to avoid triggering chat selection
   * 2. Shows confirmation dialog
   * 3. Removes chat from user's chat list in Firestore
   * 4. Resets active chat if the deleted chat was currently open
   *
   * @async
   * @param {React.MouseEvent} e - Click event object
   * @param {Object} chatToDelete - The chat to delete
   * @param {string} chatToDelete.chatId - Unique identifier of the chat to delete
   */
  const handleDeleteChat = async (e, chatToDelete) => {
    e.stopPropagation();

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
      return;
    }

    try {
      const userChatsRef = doc(db, "userchats", currentUser.id);

      // Filter out the chat to delete
      const updatedChats = chats.filter((chat) => chat.chatId !== chatToDelete.chatId);

      await updateDoc(userChatsRef, {
        chats: updatedChats,
      });

      console.log("✅ Conversation supprimée avec succès");

      // If the deleted chat was the active one, reset the chat
      if (chatId === chatToDelete.chatId) {
        changeChat(null, null);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression de la conversation:", error);
      alert("Erreur lors de la suppression de la conversation");
    }
  };

  /**
   * Filters chats based on search input
   * Performs case-insensitive search on usernames
   *
   * @type {Array<Object>}
   */
  const filteredChats = chats.filter((c) => {
    return c.user?.username.toLowerCase().includes(input.toLowerCase());
  });

  /**
   * Truncates message text to first two lines for preview
   * Prevents overly long messages from breaking the UI layout
   *
   * @param {string} text - The message text to truncate
   * @returns {string} Truncated text (max 2 lines)
   */
  const truncateText = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.slice(0, 2).join("\n");
  };

  return (
    <>
      <div className="chatlist">
        <div className="search-header">
          <div className="searchbar">
            <img src="./search.png" alt="Search" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <button
            className="add-user-btn"
            onClick={() => {
              console.log("Add button clicked, current addMode:", addMode);
              setAddMode((prev) => !prev);
            }}
            title={addMode ? "Cancel" : "Add new contact"}
          >
            {addMode ? (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            )}
          </button>
        </div>

        {addMode && <AddUser />}

        {filteredChats.map((chat) => (
          <div
            className={`items ${chat.chatId === chatId ? 'active' : ''}`}
            key={chat.chatId}
            onClick={() => handleSelect(chat)}
          >
            <img
              src={
                chat.user?.blocked.includes(currentUser.id)
                  ? "./avatar.png"
                  : chat.user?.avatar?.url || "./avatar.png"
              }
              alt=""
            />
            <div className="text">
              <span>
                {chat.user?.blocked.includes(currentUser.id)
                  ? "Utilisateur"
                  : chat.user?.username}
              </span>

              <div className="last-message">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {truncateText(chat.lastMessage)}
                </ReactMarkdown>
              </div>
            </div>
            <div className="status">
              <span className="time">{formatTime(chat.updatedAt)}</span>
              {!chat.isSeen && (
                <span className="unread-badge"></span>
              )}
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteChat(e, chat)}
                title="Supprimer la conversation"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Chatlist;
