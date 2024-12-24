import { useEffect, useState } from "react";
import AddUser from "../../adduser/AddUser";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { useUserStore } from "../../../lib/userStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./chatList.css";

const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const { changeChat } = useChatStore();
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (!currentUser?.id) return;

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data()?.chats || [];

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

        const unreadCount = filteredChats.reduce(
          (acc, chat) => acc + (chat.isSeen ? 0 : 1),
          0
        );
        // setTotalUnreadCount(unreadCount);

        setChats(filteredChats);
      }
    );
    return () => {
      unSub();
    };
  }, [currentUser.id]);

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

  // const filteredChats = chats.filter((c) => {
  //   return c.user?.username.toLowerCase().includes(input.toLowerCase());
  // });

  const filteredChats = chats.filter((c) => {
    return c.user?.username.toLowerCase().includes(input.toLowerCase());
  });

  const truncateText = (text) => {
    if (!text) return ""; // Handle empty or null text
    const lines = text.split("\n");
    return lines.slice(0, 2).join("\n"); // Limit to first two lines
  };

  return (
    <>
      <div className="chatlist">
        {filteredChats.map((chat) => (
          <div
            className="items"
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
              // style={{
              //   borderColor: chat?.isSeen ? "transparent" : "#f9e",
              // }}
            />
            <div className="text">
              <span>
                {chat.user?.blocked.includes(currentUser.id)
                  ? "Utilisateur"
                  : chat.user?.username}
              </span>

              <p>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {truncateText(chat.lastMessage)}
                </ReactMarkdown>
              </p>
            </div>
            <div className="status">
              {chat.isSeen ? (
                <span className="seen-indicator">✔️</span>
              ) : (
                <span className="unseen-indicator">✔️</span>
              )}
            </div>
          </div>
        ))}
        <div className="search">
          <img
            src={addMode ? "./minus.png" : "./plus.png"}
            alt="Icone d'ajout utilisateur"
            className="add"
            onClick={() => setAddMode((prev) => !prev)}
          />
        </div>
        {addMode && <AddUser />}
      </div>
    </>
  );
};

export default Chatlist;
