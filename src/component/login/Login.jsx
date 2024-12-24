import "./login.css";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Upload from "../../lib/upload";
import { setUserOnlineStatus } from "../../lib/userStatus";

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [avatar, setAvatar] = useState({ file: null, url: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Regular expression for email validation
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Helper function to validate email format
  const validateEmail = (email) =>
    EMAIL_REGEX.test(String(email).toLowerCase());

  // Handle avatar selection and preview
  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar({ file, url: URL.createObjectURL(file) });
    }
  };

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const { username, email, password, confirmPassword } =
      Object.fromEntries(formData);

    // Validate inputs
    if (!validateEmail(email)) {
      toast.error("Invalid email address.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!avatar.file) {
      toast.error("Please upload an avatar.");
      return;
    }
    if (username.length < 3 || username.length > 20) {
      toast.error("Username must be between 3 and 20 characters.");
      return;
    }

    setLoading(true);
    try {
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", email));
      if (userDoc.exists()) {
        toast.error("An account with this email already exists.");
        setLoading(false);
        return;
      }

      // Register user with Firebase Authentication
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // Upload avatar and get the image URL
      const imgUrl = await Upload(avatar.file, "image");

      // Save user data in Firestore
      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });

      // Initialize user chats in Firestore
      await setDoc(doc(db, "userchats", res.user.uid), { chats: [] });

      toast.success("Account successfully created!");
      // Redirect or perform other actions if needed
    } catch (err) {
      console.error("Error during registration:", err);
      toast.error(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUserOnlineStatus(userCredential.user.uid);
      toast.success("Login successful!");
    } catch (err) {
      console.error("Error during login:", err);
      toast.error(err.message || "Failed to login.");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    const email = prompt("Please enter your email to reset your password:");

    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (err) {
      console.error("Error sending password reset email:", err);
      toast.error(err.message || "Failed to send password reset email.");
    }
  };

  return (
    <div className="login">
      {isLoginMode ? (
        <div className="item">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div className="email">
              <input type="email" placeholder="Email" name="email" required />
            </div>
            <div className="password">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="show-password"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit" disabled={loading}>
              Sign In
            </button>
          </form>
          <div className="info">
            <p>
              Forgot your password?{" "}
              <span onClick={handlePasswordReset}>Reset it here</span>
            </p>
            <p>
              Don't have an account?{" "}
              <span onClick={() => setIsLoginMode(false)}>Register here</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="item">
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <label htmlFor="file" className="avatar-upload">
              <img src={avatar.url || "./avatar.png"} alt="Avatar" />
              Upload file here
            </label>
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              onChange={handleAvatar}
            />
            <div className="username">
              <input
                type="text"
                placeholder="Username"
                name="username"
                required
              />
            </div>
            <div className="email">
              <input type="email" placeholder="Email" name="email" required />
            </div>
            <div className="password">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="show-password"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="password">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                name="confirmPassword"
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="show-password"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit" disabled={loading}>
              Sign Up
            </button>
          </form>
          <div className="info">
            <p>
              Already have an account?{" "}
              <span onClick={() => setIsLoginMode(true)}>Login here</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
