import { useState, useEffect, useRef } from "react";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useCallStore } from "../../../../lib/useCall";
import { useCallData } from "../../../../lib/handleCall";
import "./respondInterface.css";

const ReceiverInterface = ({ callId, callType, onEndCall }) => {
  const {
    updateCallStatus, // Défaut pour éviter les erreurs
    playSound,
    stopSound,
    resetCallState,
    isCalling,
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
  } = useCallStore();

  const { answerCall } = useCallData();

  const [callStatus, setCallStatus] = useState("Appel entrant...");
  const [isCallOngoing, setIsCallOngoing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!callId) return;

    const callDoc = doc(db, "calls", callId);

    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      const callData = snapshot.data();

      if (!callData) return;

      if (callData?.accepted) {
        stopSound();
        setCallStatus("En cours d'appel");
        setIsCallOngoing(true);
        updateCallStatus(callId, "accepted");
      } else if (callData?.rejected || callData?.status === "ended") {
        setCallStatus("Appel terminé ou rejeté");
        updateCallStatus(callId, "ended");
        handleEndCall();
      }
    });

    playSound("ringtone", true);

    return () => {
      unsubscribe();
      stopSound();
    };
  }, [callId, playSound, stopSound]);

  const handleAccept = async () => {
    try {
      await answerCall(callId);
      // await updateDoc(doc(db, "calls", callId), { accepted: true });
      updateCallStatus(callId, "accepted");
      setCallStatus("En cours d'appel");
      setIsCallOngoing(true);
      console.log(
        "mes params",
        localVideoRef,
        remoteVideoRef,
        localStream,
        remoteStream
      );
    } catch (error) {
      console.error("Erreur lors de l'acceptation de l'appel :", error);
      setError("Impossible d'accepter l'appel. Veuillez réessayer.");
    }
  };

  const handleEndCall = async () => {
    stopSound();
    setCallStatus("Appel terminé");
    // resetCallState();

    try {
      await updateDoc(doc(db, "calls", callId), { status: "ended" });
      updateCallStatus(callId, "ended");
      setCallStatus("Appel terminé");
      if (onEndCall) onEndCall();
    } catch (error) {
      console.error("Erreur lors de la fin de l'appel :", error);
      setError("Impossible de terminer l'appel.");
    }
  };

  return (
    <div
      className={`call-interface ${
        callType === "video" ? "video-call" : "audio-call"
      }`}
    >
      <h2>{callStatus}</h2>
      {error && <div className="error-message">{error}</div>}
      {!isCallOngoing && callStatus === "Appel entrant..." && (
        <div className="buttons">
          <button className="accept-button" onClick={handleAccept}>
            Accepter
          </button>

          <button className="end-call-button" onClick={handleEndCall}>
            Terminer l'appel
          </button>
        </div>
      )}
      {callType === "video" && isCallOngoing && (
        <div className="video-container">
          <video
            id="localVideo"
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
          ></video>
          <video
            id="remoteVideo"
            ref={remoteVideoRef}
            autoPlay
            playsInline
          ></video>
        </div>
      )}
      {isCallOngoing && (
        <button className="end-call-button" onClick={handleEndCall}>
          Terminer l'appel
        </button>
      )}
      {isCallOngoing && (
        <button className="end-call-button" onClick={handleEndCall}>
          Terminer l'appel
        </button>
      )}
    </div>
  );
};

export default ReceiverInterface;
