/**
 * Notification Component - Global toast notification container
 *
 * This component provides a centralized toast notification system for the entire application.
 * It wraps react-toastify's ToastContainer to display success, error, info, and warning messages.
 *
 * Features:
 * - Positioned at bottom-right of screen
 * - Handles all toast notifications throughout the app
 * - Automatic dismissal with timeout
 * - Stacking support for multiple notifications
 * - Customizable appearance via react-toastify
 *
 * Toast types used in the app:
 * - toast.success() - Successful operations (login, message sent, etc.)
 * - toast.error() - Error messages (failed operations, validation errors)
 * - toast.info() - Informational messages
 * - toast.warning() - Warning messages
 *
 * Usage in other components:
 * ```javascript
 * import { toast } from "react-toastify";
 * toast.success("Login successful!");
 * toast.error("Failed to send message");
 * ```
 *
 * @component
 * @returns {JSX.Element} The notification container component
 *
 * @example
 * // In App.jsx
 * <Notification />
 */

import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Notification = () => {
    return (
        <div className="">
            <ToastContainer position="bottom-right"/>
        </div>
    )
};

export default Notification;