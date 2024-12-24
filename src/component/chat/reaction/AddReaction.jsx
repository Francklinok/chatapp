import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Adjust the path if necessary

/**
 * Adds a reaction to a specific message in a chat.
 * @param {string} chatId - The ID of the chat.
 * @param {string} messageId - The ID of the message.
 * @param {string} emoji - The emoji for the reaction.
 */
const addReaction = async ({ chatId, messageId, emoji }) => {
  const chatDocRef = doc(db, "chats", chatId); // Reference to the chat document

  try {
    // Perform the update in a transaction to ensure consistency
    await runTransaction(db, async (transaction) => {
      const chatDoc = await transaction.get(chatDocRef);
      if (!chatDoc.exists()) {
        throw "Chat does not exist!"; // Error if the chat document doesn't exist
      }

      // Get the current messages in the chat
      const messages = chatDoc.data().messages || [];
      const updatedMessages = messages.map((msg) => {
        if (msg.id === messageId) {
          // If the message ID matches, update the reaction
          const reactions = msg.reaction || {};
          reactions[emoji] = (reactions[emoji] || 0) + 1; // Increment the reaction count
          return { ...msg, reaction: reactions }; // Return the updated message
        }
        return msg; // Return the message unchanged if the ID doesn't match
      });

      // Update the chat document with the new messages array
      transaction.update(chatDocRef, { messages: updatedMessages });
    });
    console.log("Reaction added successfully!"); // Success message
  } catch (error) {
    console.error("Error adding reaction: ", error); // Error handling
  }
};

export default addReaction;



