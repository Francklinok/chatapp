import { useState, useEffect } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useCallStore } from "../../../../lib/useCall";
import { useCallData } from "../../../../lib/handleCall";
import "./callerinterface.css";

const CallerInterface = ({ callId, callType, onEndCall }) => {
  const { playSound, stopSound, resetCallState, updateCallStatus } =
    useCallStore();
  const { endCall } = useCallData();
  console.log("callid, calltype ", callId, callType);

  const [callStatus, setCallStatus] = useState("En attente de réponse...");
  const [isInCall, setIsInCall] = useState(false);
  // const [isVideo, setIsVideo] = useState(callType === "video");

  useEffect(() => {
    if (!callId) {
      console.error("callId est null ou undefined.");
      setCallStatus("Erreur : Identifiant d'appel manquant.");
      return;
    }

    const callDoc = doc(db, "calls", callId);

    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      const callData = snapshot.data();
      console.log("callData", callData);

      if (!callData) {
        console.error("Données d'appel manquantes.");
        setCallStatus("Erreur : Données d'appel manquantes.");
        return;
      }

      // Mise à jour du statut d'appel en fonction des données Firestore
      if (callData.accepted) {
        setCallStatus("Appel accepté");
        stopSound(); // Arrêter la sonnerie une fois l'appel accepté
        setIsInCall(true);
      } else if (callData.rejected) {
        setCallStatus("Appel rejeté");
        handleEndCall();
      } else if (callData.status === "ended") {
        handleEndCall();
      } else {
        setCallStatus("En attente de réponse...");
      }

      // Mise à jour de l'état de l'appel dans le store
      updateCallStatus(callData.status || "En attente de réponse...");
    });

    // Démarrage de la sonnerie lorsque l'appel est en attente
    playSound("apemis", true);

    // Clean-up
    return () => {
      unsubscribe();
      stopSound(); // Arrêter la sonnerie à la fin du composant
    };
  }, [callId, playSound, stopSound]);

  const handleEndCall = () => {
    stopSound();
    endCall(callId); // Terminer l'appel côté serveur
    setCallStatus("Appel terminé");
    updateCallStatus(callId, "ended");
    resetCallState(); // Réinitialiser l'état de l'appel dans le store
    setIsInCall(false); // Sortir de l'appel
    if (onEndCall) onEndCall(); // Callback pour informer du retour dans l'état principal
  };

  return (
    <div
      className={`caller-interface ${
        callType == "video" ? "video-call" : "audio-call"
      }`}
    >
      <h2>{callStatus}</h2>
      <button className="end-call-button" onClick={handleEndCall}>
        Terminer l'appel
      </button>

      {callType == "video" ? (
        <div className="video-container">
          {isInCall && (
            <>
              <video
                id="localVideo"
                autoPlay
                muted
                playsInline
                // style={{ display: "block" }}
              ></video>
              <video
                id="remoteVideo"
                autoPlay
                playsInline
                // style={{ display: "block" }}
              ></video>
            </>
          )}
        </div>
      ) : (
        <div className="audio-interface">
          <p>Appel audio en cours...</p>
          <div className="caller-profile">
            <img
              src="/path-to-caller-profile.jpg"
              alt="Profil de l'appelant"
              className="profile-picture"
            />
            <p>Nom de l'appelant</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallerInterface;
