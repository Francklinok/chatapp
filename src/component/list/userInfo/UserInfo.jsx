/**
 * UserInfo Component - User profile and settings panel
 *
 * This component displays the current user's profile information and provides
 * access to various application features and settings.
 *
 * Features:
 * - Display user avatar and username
 * - Quick action buttons (new chat, status)
 * - Dropdown menu with options:
 *   - Create new group (placeholder)
 *   - Starred messages (placeholder)
 *   - Settings (placeholder)
 *   - Logout functionality
 * - Click-outside detection to close menu
 * - Modal dialogs for group creation and settings
 *
 * The component manages:
 * - User authentication state
 * - Menu visibility
 * - Modal visibility for different features
 *
 * @component
 * @returns {JSX.Element} The user info panel with profile and actions
 *
 * @example
 * <UserInfo />
 */

import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";
import { useState, useEffect, useRef } from "react";
import { auth } from "../../../lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const { resetChat } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef(null);

  /**
   * Effect: Close dropdown menu when clicking outside
   * Sets up and cleans up event listener for click-outside detection
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  /**
   * Handles new chat creation action
   * Placeholder function for initiating a new chat
   */
  const handleNewChat = () => {
    console.log("New chat clicked");
    setShowMenu(false);
  };

  /**
   * Toggles the dropdown menu visibility
   */
  const handleMenu = () => {
    setShowMenu(!showMenu);
  };

  /**
   * Handles user logout
   * Signs out from Firebase, resets the chat state, and displays a success message
   *
   * @async
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetChat(); // Clear current chat
      toast.success("Logged out successfully");
      setShowMenu(false);
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  /**
   * Opens the create group modal
   * Closes the dropdown menu and displays the group creation dialog
   */
  const handleCreateGroup = () => {
    setShowCreateGroup(true);
    setShowMenu(false);
  };

  /**
   * Opens the settings modal
   * Closes the dropdown menu and displays the settings dialog
   */
  const handleSettings = () => {
    setShowSettings(true);
    setShowMenu(false);
  };

  /**
   * Handles starred messages action
   * Placeholder function for viewing starred/favorite messages
   */
  const handleStarredMessages = () => {
    console.log("Starred messages clicked");
    setShowMenu(false);
  };

  return (
    <div className="userinfo">
      {/* User Profile Section */}
      <div className="user-profile">
        <div className="user-avatar">
          <img 
            src={currentUser?.avatar?.url || "./avatar.png"} 
            alt="User Avatar" 
          />
        </div>
        <div className="user-details">
          <h3>{currentUser?.username || "User"}</h3>
        </div>
      </div>

      {/* Action Icons */}
      <div className="action-icons">
        <button 
          className="icon-btn"
          title="New chat"
          onClick={handleNewChat}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.022 18.423 23.022 12.228c.001-6.195-5.021-11.217-11.218-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159z"/>
          </svg>
        </button>

        <button 
          className="icon-btn"
          title="Status"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z"/>
          </svg>
        </button>

        <div className="menu-container" ref={menuRef}>
          <button 
            className="icon-btn"
            title="Menu"
            onClick={handleMenu}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
            </svg>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <div className="menu-item" onClick={handleCreateGroup}>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M16 4c0-1.11.89-2 2-2s2 .89 2 2c0 1.11-.89 2-2 2s-2-.89-2-2zM4 18v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1H4zM8 10c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 2c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2z"/>
                </svg>
                New group
              </div>
              <div className="menu-item" onClick={handleStarredMessages}>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Starred messages
              </div>
              <div className="menu-item" onClick={handleSettings}>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
                Settings
              </div>
              <div className="menu-item logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
                </svg>
                Log out
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Group</h3>
              <button className="close-btn" onClick={() => setShowCreateGroup(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <input 
                type="text" 
                placeholder="Group name"
                className="group-name-input"
              />
              <p className="modal-text">This feature will be implemented soon!</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="close-btn" onClick={() => setShowSettings(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <div className="settings-item">
                  <div className="settings-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                    </svg>
                  </div>
                  <span>Profile</span>
                </div>
                <div className="settings-item">
                  <div className="settings-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L19,5V4A2,2 0 0,0 17,2H7C5.89,2 5,2.89 5,4V5L3,7V9H5V19A2,2 0 0,0 7,21H10V19H7V9H17V19H14V21H17A2,2 0 0,0 19,19V9H21Z"/>
                    </svg>
                  </div>
                  <span>Privacy</span>
                </div>
                <div className="settings-item">
                  <div className="settings-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L18,9.5L16.5,8L11,13.5L7.5,10L6,11.5L11,16.5Z"/>
                    </svg>
                  </div>
                  <span>Security</span>
                </div>
                <div className="settings-item">
                  <div className="settings-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"/>
                    </svg>
                  </div>
                  <span>Notifications</span>
                </div>
              </div>
              <p className="modal-text">Settings functionality will be implemented soon!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;