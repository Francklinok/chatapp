import React, { useState, useCallback } from "react";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import moment from "moment";
import "./messagelist.css";
import addReaction from "../reaction/AddReaction";
import EmojiPicker from "emoji-picker-react";

const MessageOption = ({
  message, // The message object to be processed
  chatId, // The ID of the current chat
  db, // The Firestore database instance
  onEdit, // Callback function triggered after editing a message
  onDelete, // Callback function triggered after deleting a message
  currentUser, // The current authenticated user
}) => {
  // Function to update or delete messages in Firestore
  const updatedMessages = async (messageId, updates) => {
    try {
      console.log(`Updating message with ID: ${messageId}`, updates);

      // Reference the Firestore document for the current chat
      const chatDocRef = doc(db, "chats", chatId);
      const chatSnapshot = await getDoc(chatDocRef);

      if (chatSnapshot.exists()) {
        const chatData = chatSnapshot.data();
        let updatedMessages = [...chatData.messages];
        console.log("Original messages:", updatedMessages);

        // Update the text of the message if provided
        if (updates.text !== undefined) {
          updatedMessages = updatedMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
          console.log("Messages after text update:", updatedMessages);
        }

        // Mark the message as deleted if the delete flag is set
        if (updates.delete) {
          updatedMessages = updatedMessages.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: "Message deleted", deleted: true }
              : msg
          );
          console.log("Messages after deletion:", updatedMessages);
        }

        // Remove undefined fields from the message objects
        updatedMessages = updatedMessages.map((msg) => {
          Object.keys(msg).forEach((key) => {
            if (msg[key] === undefined) {
              delete msg[key];
            }
          });
          return msg;
        });

        console.log(
          "Messages after cleaning undefined fields:",
          updatedMessages
        );

        // Check if any messages still contain undefined fields
        const hasUndefined = updatedMessages.some((msg) =>
          Object.values(msg).some((value) => value === undefined)
        );

        if (hasUndefined) {
          console.error("Messages contain undefined fields");
          return;
        }

        // Update the Firestore document with the cleaned message array
        await updateDoc(chatDocRef, { messages: updatedMessages });
        console.log("Firestore document updated successfully.");

        // Trigger callbacks for edit or delete actions
        if (updates.text) {
          onEdit(messageId, updates.text);
        }
        if (updates.delete) {
          onDelete(messageId);
        }
      }
    } catch (err) {
      console.error("Error updating/deleting message:", err);
    }
  };

  // Handle the deletion of a message
  const handleDeleteMessage = useCallback(
    (messageId) => {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this message?"
      );
      if (confirmDelete) {
        updatedMessages(messageId, { delete: true });
      }
    },
    [chatId, db]
  );

  // Handle the editing of a message
  const handleEditMessage = useCallback(
    (messageId) => {
      const newText = prompt("Enter the new message text", message.text);
      if (newText !== null && newText.trim() !== "") {
        updatedMessages(messageId, {
          text: newText,
          editedAt: new Date(),
        });
      }
    },
    [chatId, db, message.text]
  );

  // Display message details such as sent and read timestamps
  const handleInfo = (msg) => {
    if (!msg || !msg.id) {
      console.error("Message is undefined or missing the ID:", msg);
      return;
    }

    // Check that 'createdAt' is properly defined as a Firestore Timestamp
    if (!msg.createdAt || typeof msg.createdAt.toDate !== "function") {
      console.error("The 'createdAt' field is missing or invalid:", msg.createdAt);
      return;
    }

    alert(`Message Information:
      ID: ${msg.id}
      Sent at: ${moment(msg.createdAt.toDate()).format("LLL")}
      Read at: ${
        msg.readAt && typeof msg.readAt.toDate === "function"
          ? moment(msg.readAt.toDate()).format("LLL")
          : "Unread"
      }`);
  };

  return (
    <div className="message-list">
      <div className="option">
        <span>Copy</span>
        <span>Paste</span>
        <span onClick={() => handleDeleteMessage(message?.id)}>Delete</span>
        <span onClick={() => handleEditMessage(message?.id)}>Edit</span>
        <span onClick={() => handleInfo(message)}>Info</span>
      </div>
    </div>
  );
};

export default MessageOption;



