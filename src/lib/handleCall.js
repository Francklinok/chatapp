import { useState, useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useCallStore } from "./useCall";

// const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478", // Adresse de votre serveur TURN
      username: "your-username", // Nom d'utilisateur pour le serveur TURN
      credential: "your-password", // Mot de passe pour le serveur TURN
    },
  ],
};

export function useCallData() {
  const {
    updateCallStatus,
    resetCallState,
    playSound,
    stopSound,
    callState,
    setLocalStream,
    setRemoteStream,
    attachStream,
    setLocalVideoRef,
    setRemoteVideoRef,
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    // Nettoyage lors du démontage du composant
    return () => cleanupCall();
  }, []);

  /**
   * Prépare le flux média pour un appel.
   * @param {boolean} isVideo - Indique si le flux doit inclure la vidéo.
   */
  const prepareMediaStream = async (isVideo) => {
    try {
      // const stream = await navigator.mediaDevices.getUserMedia({
      //   audio: true,
      //   video: isVideo,
      // });
      const constraints = { audio: true, video: isVideo };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
      // return stream;
    } catch (error) {
      console.error("Erreur d'accès aux médias :", error);
      throw new Error("Impossible d'accéder au média.");
    }
  };

  /**
   * Configure les flux locaux et distants pour l'appel.
   * @param {RTCPeerConnection} pc - Instance de RTCPeerConnection.
   * @param {boolean} isVideo - Indique si la vidéo est incluse.
   */
  const setupStreams = async (pc, isVideo) => {
    try {
      const localStream = await prepareMediaStream(isVideo);
      setLocalStream(localStream);

      // Configure le flux vidéo local
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        await localVideoRef.current.play();
        setLocalVideoRef(localVideoRef);
      }

      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        const remoteStream = new MediaStream();
        event.streams[0]
          .getTracks()
          .forEach((track) => remoteStream.addTrack(track));
        setRemoteStream(remoteStream);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
          setRemoteVideoRef(remoteVideoRef);
        }
      };
    } catch (error) {
      console.error("Erreur lors de la configuration des flux :", error);
      resetCallState();
    }
  };

  /**
   * Initialise une connexion peer-to-peer.
   * @returns {RTCPeerConnection} - Instance de RTCPeerConnection configurée.
   */
  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Candidat ICE :", event.candidate);
        // Envoyer les candidats ICE à Firebase ou un serveur de signalisation.
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("État ICE :", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.error("Échec de la connexion ICE");
        cleanupCall();
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const monitorCallState = (callId) => {
    const callDoc = doc(db, "calls", callId);

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.status === "ended") {
        if (!callState.isIncall) return;
        cleanupCall();
        playSound("apfinis", false);
      } else if (data.status === "calling" || data.status === "ringing") {
        updateCallStatus({
          // isCalling: true,
          isCalling: data.status === "calling",
          isRinging: data.status === "ringing",
        });
      } else if (data.status === "in_call") {
        updateCallStatus({ isInCall: true });
      }

      if (data.rejected) {
        playSound("apfinis", false);
        cleanupCall();
        updateCallStatus({ isInCall: false, isCalling: false });
      }
    });
  };

  /**
   * Démarre un appel.
   * @param {string} callId - Identifiant unique de l'appel.
   * @param {boolean} isVideo - Indique si l'appel inclut la vidéo.
   * @param {string} callerId - Identifiant de l'appelant.
   * @param {string} receiverId - Identifiant du destinataire.
   */

  const startCall = async (callId, isVideo = false, callerId, receiverId) => {
    try {
      if (!callId || !receiverId) {
        throw new Error("callId et receiverId sont requis.");
      }

      // const pc = new RTCPeerConnection(ICE_SERVERS);
      // setPeerConnection(pc);

      const pc = setupPeerConnection();
      await setupStreams(pc, isVideo);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await setDoc(doc(db, "calls", callId), {
        callerId,
        receiverId,
        offer: { type: offer.type, sdp: offer.sdp },
        type: isVideo ? "video" : "audio",
        status: "calling",
        createdAt: new Date(),
      });

      playSound("apemis", true);
      updateCallStatus({ isCalling: true });
      monitorCallState(callId);
    } catch (error) {
      console.error("Erreur lors de l'initiation de l'appel :", error);
      resetCallState();
    }
  };
  const initializeCall = async ({ callId, isVideo, callerId, receiverId }) => {
    try {
      console.log("Initializing call with:", {
        callId,
        isVideo,
        callerId,
        receiverId,
      });

      // const localStream = await prepareMediaStream(isVideo);

      startCall(callId, isVideo, callerId, receiverId); // Lancer l'appel après initialisation

      updateCallStatus({
        callId,
        isCalling: true,
        isOutgoingCall: true,
        isVideoCall: isVideo,
        callerId,
        receiverId,
        // localStream,
      });
    } catch (error) {
      console.error("Erreur d'initialisation :", error);
      resetCallState();
    }
  };

  const answerCall = async (callId) => {
    try {
      const callDoc = doc(db, "calls", callId);
      const callData = (await getDoc(callDoc)).data();

      // const pc = new RTCPeerConnection(ICE_SERVERS);
      // setPeerConnection(pc);
      const pc = setupPeerConnection();

      setupStreams(pc, callData.type === "video");

      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await setDoc(
        callDoc,
        {
          answer: { type: answer.type, sdp: answer.sdp },
          status: "in_call",
        },
        { merge: true }
      );

      playSound("ringing", true);
      updateCallStatus({ isInCall: true });
      await updateDoc(doc(db, "calls", callId), { accepted: true });
      // updateCallStatus(callId, "accepted");
      // setCallStatus("En cours d'appel");
    } catch (error) {
      console.error("Erreur lors de la réponse :", error);
      resetCallState();
    }
  };

  /**
   * Termine un appel en cours.
   * @param {string} callId - Identifiant unique de l'appel.
   */
  const endCall = async (callId) => {
    try {
      await updateDoc(doc(db, "calls", callId), { status: "ended" });
      // await setDoc(
      //   doc(db, "calls", callId),
      //   { status: "ended" },
      //   { merge: true }
      // );
      cleanupCall();
    } catch (error) {
      console.error("Erreur lors de la fin de l'appel :", error);
    }
  };

  /**
   * Nettoie les ressources utilisées par l'appel.
   */
  const cleanupCall = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    const { localStream, remoteStream } = callState;
    [localStream, remoteStream].forEach((stream) => {
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    // if (localStream) localStream.getTracks().forEach((track) => track.stop());
    // if (remoteStream) remoteStream.getTracks().forEach((track) => track.stop());
    stopSound();
    resetCallState();
  };

  return {
    initializeCall,
    answerCall,
    endCall,
    cleanupCall,
  };
}


// const prepareMediaStream = async (isVideo) => {
//   try {
//     const constraints = {
//       audio: true,
//       video: isVideo
//         ? {
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//             facingMode: "user",
//           }
//         : false,
//     };

//     const stream = await navigator.mediaDevices.getUserMedia(constraints);
//     return stream;
//   } catch (error) {
//     console.error("Media access error:", error);
//     throw new Error(`Cannot access media: ${error.message}`);
//   }
// };
// const localStream = await prepareMediaStream(isVideo);
// console.log(
//   "Local stream tracks:",
//   localStream.getTracks().map((t) => ({
//     kind: t.kind,
//     enabled: t.enabled,
//     muted: t.muted,
//   }))
// );

// pc.oniceconnectionstatechange = () => {
//   console.log("ICE Connection State:", pc.iceConnectionState);
//   console.log("ICE Gathering State:", pc.iceGatheringState);
// };

// const setupStreams = async (pc, isVideo) => {
//   try {
//     // Get local media stream
//     const localStream = await prepareMediaStream(isVideo);
//     setLocalStream(localStream);

//     // Attach local stream to video element
//     if (localVideoRef.current) {
//       localVideoRef.current.srcObject = localStream;
//       // Ensure video element properties are set
//       localVideoRef.current.muted = true;
//       localVideoRef.current.autoplay = true;
//       localVideoRef.current.playsInline = true;

//       try {
//         await localVideoRef.current.play();
//       } catch (playError) {
//         console.error("Error auto-playing local video:", playError);
//       }
//     }

//     // Add tracks to peer connection
//     localStream.getTracks().forEach((track) => {
//       pc.addTrack(track, localStream);
//     });

//     // Handle remote stream
//     pc.ontrack = (event) => {
//       console.log("Received remote track:", event.track.kind);

//       if (!remoteVideoRef.current) {
//         console.error("Remote video element not found");
//         return;
//       }

//       // Create new MediaStream if it doesn't exist
//       if (!remoteVideoRef.current.srcObject) {
//         remoteVideoRef.current.srcObject = new MediaStream();
//       }

//       // Add the track to the existing stream
//       const stream = remoteVideoRef.current.srcObject;
//       if (!stream.getTracks().find((t) => t.id === event.track.id)) {
//         stream.addTrack(event.track);
//       }

//       // Ensure video element properties are set
//       remoteVideoRef.current.autoplay = true;
//       remoteVideoRef.current.playsInline = true;

//       try {
//         remoteVideoRef.current.play();
//       } catch (playError) {
//         console.error("Error auto-playing remote video:", playError);
//       }

//       setRemoteStream(stream);
//     };

//     return localStream;
//   } catch (error) {
//     console.error("Error setting up streams:", error);
//     throw error;
//   }
// };
