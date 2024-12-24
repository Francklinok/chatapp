import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../../lib/firebase";

const OnlineStatus = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      return;
    }

    const userStatusRef = ref(rtdb, `users/${userId}/status`);

    const unsubscribe = onValue(
      userStatusRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("Status fetched:", data); // Debug
          setStatus(data);
          setError(null); // Clear previous errors
        } else {
          console.warn(`No status found for user ID: ${userId}`);
          setStatus({ state: "offline", last_changed: null });
        }
      },
      (err) => {
        console.error("Error fetching status:", err);
        setError("Permission denied or invalid path.");
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!status) {
    return <p>Loading status...</p>;
  }

  return (
    <div className="online-status">
      {status.state === "online" ? (
        <span style={{ color: "green" }}>🟢 Online</span>
      ) : (
        <span style={{ color: "gray" }}>
          ⚪ Last seen:{" "}
          {status.last_changed && !isNaN(status.last_changed)
            ? new Date(status.last_changed).toLocaleString()
            : "Unknown"}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
