import React, { useState } from "react";
import Picker from "emoji-picker-react"; // Import the emoji picker component
import addReaction from "./AddReaction"; // Ensure the path is correct for your AddReaction module
import "./reaction.css"; // Ensure you create the necessary styles in this CSS file
import EmojiPicker from "emoji-picker-react"; // Import the emoji picker library

const Reaction = ({ message, chatId }) => {
  // State to track if the default emojis are shown
  const [showDefaultEmojis, setShowDefaultEmojis] = useState(false);
  // State to track if the emoji picker is shown
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // List of 6 default emojis
  const defaultEmojis = ["❤️", "😂", "😮", "😢", "👍", "👎"];

  // Handle click on a default emoji and add the reaction
  const handleDefaultEmojiClick = (emoji) => {
    addReaction({ chatId, messageId: message.id, emoji });
    setShowDefaultEmojis(false); // Close the default emojis list after selection
  };

  // Handle click on an emoji from the Emoji Picker and add the reaction
  const handlePickerEmojiClick = (event, emojiObject) => {
    const emoji = emojiObject.emoji; // Get the emoji from the picker
    addReaction({ chatId, messageId: message.id, emoji }); // Add the selected emoji as a reaction
    setShowEmojiPicker(false); // Close the emoji picker after selection
  };

  return (
    <div className="reaction-container">
      <div className="emoji-reaction-container">
        {/* Render each default emoji */}
        {defaultEmojis.map((emoji) => (
          <span
            key={emoji}
            className="emoji-option"
            onClick={() => handleDefaultEmojiClick(emoji)} // Add reaction on click
          >
            {emoji}
          </span>
        ))}
        {/* Button to show the emoji picker */}
        <button
          className="more-emoji-button"
          onClick={() => setShowEmojiPicker(true)} // Open the emoji picker on click
        >
          +
        </button>
      </div>

      {/* Show the Emoji Picker if it's open */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <EmojiPicker onEmojiClick={handlePickerEmojiClick} /> {/* Handle emoji selection */}
        </div>
      )}
    </div>
  );
};

export default Reaction;



