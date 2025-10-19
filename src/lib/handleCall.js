import { useState, useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useCallStore } from "./useCall";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function useCallData() {
  const store = useCallStore();
  const {
    updateCallStatus,
    resetCallState,
    playSound,
    stopSound,
    setLocalStream,
    setRemoteStream,
    setLocalVideoRef,
    setRemoteVideoRef,
    localStream,
    remoteStream,
  } = store;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    return () => cleanupCall();
  }, []);

 
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
   * @param {RTCPeerConnection} pc 
   * @param {boolean} isVideo 
   */
  const setupStreams = async (pc, isVideo) => {
    try {
      const localStream = await prepareMediaStream(isVideo);
      setLocalStream(localStream);

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

  const setupPeerConnection = async (callId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = async (event) => {
      if (event.candidate && callId) {
        try {
          const callDoc = doc(db, "calls", callId);
          const callData = (await getDoc(callDoc)).data();
          const candidates = callData?.iceCandidates || [];

          await updateDoc(callDoc, {
            iceCandidates: [
              ...candidates,
              {
                candidate: event.candidate.candidate,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                sdpMid: event.candidate.sdpMid,
              },
            ],
          });
        } catch (error) {
          console.error("Erreur lors de l'ajout du candidat ICE:", error);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("État de connexion ICE:", pc.iceConnectionState);
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        console.warn("Connexion ICE interrompue");
      }
      if (pc.iceConnectionState === "connected") {
        console.log("Connexion ICE établie avec succès");
        stopSound();
      }
    };

    return pc;
  };

  const monitorCallState = (callId, isAnswerer = false) => {
    const callDoc = doc(db, "calls", callId);

    const unsubscribe = onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.iceCandidates && peerConnectionRef.current) {
        for (const candidate of data.iceCandidates) {
          try {
            if (candidate.candidate) {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }
          } catch (error) {
            console.error("Erreur lors de l'ajout du candidat ICE:", error);
          }
        }
      }

      if (!isAnswerer && data.answer && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } catch (error) {
          console.error("Erreur lors du setRemoteDescription:", error);
        }
      }

      if (data.status === "ended" || data.rejected) {
        playSound("apfinis", false);
        cleanupCall();
        updateCallStatus({ isInCall: false, isCalling: false, isRinging: false });
      } else if (data.status === "in_call" && data.accepted) {
        stopSound();
        updateCallStatus({ isInCall: true, isCalling: false, isRinging: false });
      }
    });

    return unsubscribe;
  };

  /**
   * @param {string} callId 
   * @param {boolean} isVideo 
   * @param {string} callerId 
   * @param {string} receiverId
   */

  const startCall = async (callId, isVideo = false, callerId, receiverId) => {
    try {
      if (!callId || !receiverId) {
        throw new Error("callId et receiverId sont requis.");
      }

      const pc = await setupPeerConnection(callId);
      await setupStreams(pc, isVideo);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
      await pc.setLocalDescription(offer);

      await setDoc(doc(db, "calls", callId), {
        callerId,
        receiverId,
        offer: { type: offer.type, sdp: offer.sdp },
        type: isVideo ? "video" : "audio",
        status: "calling",
        accepted: false,
        rejected: false,
        iceCandidates: [],
        createdAt: new Date(),
      });

      playSound("apemis", true);
      updateCallStatus({ isCalling: true, callId, isVideoCall: isVideo });

      monitorCallState(callId, false);
    } catch (error) {
      console.error("Erreur lors de l'initiation de l'appel :", error);
      resetCallState();
      throw error;
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


      startCall(callId, isVideo, callerId, receiverId); 

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

      if (!callData || !callData.offer) {
        throw new Error("Données d'appel invalides");
      }

      const pc = await setupPeerConnection(callId);
      await setupStreams(pc, callData.type === "video");

      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await updateDoc(callDoc, {
        answer: { type: answer.type, sdp: answer.sdp },
        status: "in_call",
        accepted: true,
      });

      stopSound();
      updateCallStatus({
        isInCall: true,
        isRinging: false,
        callId,
        isVideoCall: callData.type === "video"
      });

      monitorCallState(callId, true);
    } catch (error) {
      console.error("Erreur lors de la réponse :", error);
      resetCallState();
      throw error;
    }
  };

  /**
   * @param {string} callId 
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

 
  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const streams = [localStream, remoteStream];
    streams.forEach((stream) => {
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Track ${track.kind} arrêté`);
        });
      }
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

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


