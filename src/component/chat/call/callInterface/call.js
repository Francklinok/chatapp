import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export const peerConnection = new RTCPeerConnection();

// Jouer un son
export function playSound(type) {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.loop = true;
  audio.play();
}

// Arrêter le son
export function stopSound() {
  const audio = document.querySelector("audio");
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

// Initialiser un appel
export async function startCall(callId, isCaller) {
  const callDoc = doc(db, "calls", callId);

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      const candidatesCollection = collection(
        callDoc,
        isCaller ? "callerCandidates" : "receiverCandidates"
      );
      await addDoc(candidatesCollection, event.candidate.toJSON());
    }
  };

  peerConnection.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // Ajouter le flux local
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));
  const localVideo = document.getElementById("localVideo");
  if (localVideo) {
    localVideo.srcObject = localStream;
  }
}

// import { useState, useEffect } from "react";
// import { endCall, stopSound, playSound } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import "./callerinterface.css"; // Importation du fichier CSS
// import { db } from "../../../../lib/firebase";

// export function CallerInterface({ callId, isVideo, onEndCall, callerId }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");
//   // const [receiverId, setReceiverId] = useState(null);

//   useEffect(() => {
//     const callDoc = doc(db, "calls", callId);

//     // Écoute les changements de statut pour vérifier si l'appel est accepté ou rejeté
//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       // Vérification de la correspondance des identifiants pour éviter les erreurs de statut
//       if (callData?.callerId !== callerId) {
//         console.log("Cet appel n'est pas destiné à cet utilisateur.");
//         return; // Si l'appel n'est pas destiné à ce callerId, on ne fait rien
//       }

//       // Enregistrer le receiverId depuis les données de l'appel
//       // setReceiverId(callData?.receiverId);

//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       }
//     });

//     playSound("apemis");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, callerId]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${
//         isVideo ? "video-call-interface" : "audio-call-interface"
//       }`}
//     >
//       <p>{callStatus}</p>
//       <button onClick={handleEndCall}> Terminer l'appel</button>
//       {isVideo && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//     </div>
//   );
// }

// import {
//   doc,
//   setDoc,
//   collection,
//   onSnapshot,
//   deleteDoc,
// } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";

// const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
// export let peerConnection = null;
// let localStream = null;
// let remoteStream = null;
// let currentSound = null; // Variable pour stocker le son en cours de lecture

// // Fonction pour démarrer un appel
// export async function startCall(callId, callerId, receiverId, isVideo = false) {
//   const callDoc = doc(db, "calls", callId);

//   try {
//     peerConnection = new RTCPeerConnection(servers);
//     localStream = await navigator.mediaDevices.getUserMedia({
//       video: isVideo,
//       audio: true,
//     });
//     localStream
//       .getTracks()
//       .forEach((track) => peerConnection.addTrack(track, localStream));

//     // Ajout de la vidéo locale si nécessaire
//     const localVideo = document.getElementById("localVideo");
//     if (localVideo && isVideo) localVideo.srcObject = localStream;

//     remoteStream = new MediaStream();
//     peerConnection.ontrack = (event) => {
//       event.streams[0]
//         .getTracks()
//         .forEach((track) => remoteStream.addTrack(track));
//     };

//     // Ajout de la vidéo distante si nécessaire
//     const remoteVideo = document.getElementById("remoteVideo");
//     if (remoteVideo && isVideo) remoteVideo.srcObject = remoteStream;

//     // Gestion des candidats ICE
//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         setDoc(
//           doc(collection(callDoc, "callerCandidates")),
//           event.candidate.toJSON()
//         );
//       }
//     };

//     // Ecoute de l'offre et réponse
//     onSnapshot(callDoc, (snapshot) => {
//       const data = snapshot.data();
//       if (data?.answer && !peerConnection.currentRemoteDescription) {
//         peerConnection.setRemoteDescription(
//           new RTCSessionDescription(data.answer)
//         );
//       }
//     });
//   } catch (error) {
//     console.error("Erreur lors de la configuration de l'appel:", error);
//   }
// }

// // Fonction pour initier un appel avec les IDs de l'appelant et du récepteur
// export async function initiateCall(callerId, receiverId, isVideo = false) {
//   const callId = `${callerId}-${receiverId}-${Date.now()}`; // Crée un identifiant unique pour l'appel
//   const callRef = doc(db, "calls", callId); // Référence au document de l'appel
//   try {
//     // Démarrer l'appel en initialisant la connexion et les flux multimédia
//     await startCall(callId, callerId, receiverId, isVideo);

//     // Créer une offre
//     const offerDescription = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offerDescription);
//     const offer = { sdp: offerDescription.sdp, type: offerDescription.type };

//     // Ajouter l'offre à Firestore
//     await setDoc(callRef, {
//       callerId,
//       receiverId,
//       offer,
//       status: "ringing", // Statut de l'appel
//       timestamp: new Date(),
//     });

//     // Jouer la sonnerie de l'appel
//     playSound("apemis");
//   } catch (error) {
//     console.error("Erreur lors de l'initiation de l'appel:", error);
//   }
// }

// // Fonction pour arrêter l'appel
// export function endCall(callId) {
//   if (peerConnection) {
//     peerConnection.close();
//     peerConnection = null;
//   }

//   if (localStream) {
//     localStream.getTracks().forEach((track) => track.stop());
//     localStream = null;
//   }

//   if (remoteStream) {
//     remoteStream.getTracks().forEach((track) => track.stop());
//     remoteStream = null;
//   }

//   const callDoc = doc(db, "calls", callId);
//   deleteDoc(callDoc);

//   stopSound(); // Arrête la sonnerie en cours
//   playSound("apfinis");
// }

// // Fonction pour lire des sons
// export function playSound(type) {
//   const sounds = {
//     apemis: new Audio("./apemis.mp3"),
//     apfinis: new Audio("./apfinis.mp3"),
//     ringtone: new Audio("./ringtone.mp3"),
  //   };

//   stopSound(); // Arrête tout son en cours avant d'en jouer un nouveau
//   currentSound = sounds[type];
//   if (currentSound) {
//     currentSound
//       .play()
//       .catch((err) =>
//         console.error(`Erreur lors de la lecture du son ${type}: ${err}`)
//       );
//   }
// }

// // Fonction pour arrêter le son en cours
// export function stopSound() {
//   if (currentSound) {
//     currentSound.pause();
//     currentSound.currentTime = 0;
//     currentSound = null;
//   }
// }

// import {
//   // getFirestore,
//   doc,
//   setDoc,
//   collection,
//   onSnapshot,
//   deleteDoc,
// } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
// export let peerConnection = null;
// let localStream = null;
// let remoteStream = null;
// let currentSound = null; // Variable pour stocker le son en cours de lecture
// // Fonction pour démarrer un appel
// export async function startCall(callId, isVideo = false) {
//   const callDoc = doc(collection(db, "calls"), callId);
//   try {
//     peerConnection = new RTCPeerConnection(servers);
//     localStream = await navigator.mediaDevices.getUserMedia({
//       video: isVideo,
//       audio: true,
//     });
//     localStream
//       .getTracks()
//       .forEach((track) => peerConnection.addTrack(track, localStream));

//     const localVideo = document.getElementById("localVideo");
//     if (localVideo && isVideo) localVideo.srcObject = localStream;

//     remoteStream = new MediaStream();
//     peerConnection.ontrack = (event) => {
//       event.streams[0]
//         .getTracks()
//         .forEach((track) => remoteStream.addTrack(track));
//     };
//     const remoteVideo = document.getElementById("remoteVideo");
//     if (remoteVideo && isVideo) remoteVideo.srcObject = remoteStream;
//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         setDoc(
//           doc(collection(callDoc, "callerCandidates")),
//           event.candidate.toJSON()
//         );
//       }
//     };

//     onSnapshot(callDoc, (snapshot) => {
//       const data = snapshot.data();
//       if (data?.answer && !peerConnection.currentRemoteDescription) {
//         peerConnection.setRemoteDescription(
//           new RTCSessionDescription(data.answer)
//         );
//       }
//     });
//   } catch (error) {
//     console.error("Erreur lors de la configuration de l'appel:", error);
//   }
// }

// // Fonction pour initier un appel
// export async function initiateCall(callId, isVideo = false) {
//   try {
//     await startCall(callId, isVideo);

//     const offerDescription = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offerDescription);
//     const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
//     await setDoc(doc(db, "calls", callId), { offer });

//     playSound("apemis");
//   } catch (error) {
//     console.error("Erreur lors de l'initiation de l'appel:", error);
//   }
// }

// // Fonction pour arrêter l'appel
// export function endCall(callId) {
//   if (peerConnection) {
//     peerConnection.close();
//     peerConnection = null;
//   }

//   if (localStream) {
//     localStream.getTracks().forEach((track) => track.stop());
//     localStream = null;
//   }

//   if (remoteStream) {
//     remoteStream.getTracks().forEach((track) => track.stop());
//     remoteStream = null;
//   }

//   const callDoc = doc(db, "calls", callId);
//   deleteDoc(callDoc);

//   stopSound(); // Arrête la sonnerie en cours
//   playSound("apfinis");
// }

// // Fonction pour lire des sons
// export function playSound(type) {
//   const sounds = {
//     apemis: new Audio("./apemis.mp3"),
//     apfinis: new Audio("./apfinis.mp3"),
//     ringtone: new Audio("./ringtone.mp3"),
//   };

//   stopSound(); // Arrête tout son en cours avant d'en jouer un nouveau
//   currentSound = sounds[type];
//   if (currentSound) {
//     currentSound
//       .play()
//       .catch((err) =>
//         console.error(`Erreur lors de la lecture du son ${type}: ${err}`)
//       );
//   }
// }

// // Fonction pour arrêter le son en cours
// export function stopSound() {
//   if (currentSound) {
//     currentSound.pause();
//     currentSound.currentTime = 0;
//     currentSound = null;
//   }
// }

// import {
//   // getFirestore,
//   doc,
//   setDoc,
//   collection,
//   onSnapshot,
//   deleteDoc,
// } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// // const db = getFirestore();
// const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
// export let peerConnection = null;
// let localStream = null;
// let remoteStream = null;
// // Fonction pour démarrer un appel
// export async function startCall(callId, isVideo = false) {
//   const callDoc = doc(collection(db, "calls"), callId);
//   try {
//     peerConnection = new RTCPeerConnection(servers);
//     localStream = await navigator.mediaDevices.getUserMedia({
//       video: isVideo,
//       audio: true,
//     });
//     localStream
//       .getTracks()
//       .forEach((track) => peerConnection.addTrack(track, localStream));
//     const localVideo = document.getElementById("localVideo");
//     if (localVideo && isVideo) localVideo.srcObject = localStream;
//     remoteStream = new MediaStream();
//     peerConnection.ontrack = (event) => {
//       event.streams[0]
//         .getTracks()
//         .forEach((track) => remoteStream.addTrack(track));
//     };
//     const remoteVideo = document.getElementById("remoteVideo");
//     if (remoteVideo && isVideo) remoteVideo.srcObject = remoteStream;

//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         setDoc(
//           doc(collection(callDoc, "callerCandidates")),
//           event.candidate.toJSON()
//         );
//       }
//     };

//     onSnapshot(callDoc, (snapshot) => {
//       const data = snapshot.data();
//       if (data?.answer && !peerConnection.currentRemoteDescription) {
//         peerConnection.setRemoteDescription(
//           new RTCSessionDescription(data.answer)
//         );
//       }
//     });
//   } catch (error) {
//     console.error("Erreur lors de la configuration de l'appel:", error);
//   }
// }

// // Fonction pour initier un appel
// export async function initiateCall(callId, isVideo = false) {
//   try {
//     await startCall(callId, isVideo);

//     const offerDescription = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offerDescription);
//     const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
//     await setDoc(doc(db, "calls", callId), { offer });

//     playSound("apemis");
//   } catch (error) {
//     console.error("Erreur lors de l'initiation de l'appel:", error);
//   }
// }

// // Fonction pour arrêter l'appel
// export function endCall(callId) {
//   if (peerConnection) {
//     peerConnection.close();
//     peerConnection = null;
//   }

//   if (localStream) {
//     localStream.getTracks().forEach((track) => track.stop());
//     localStream = null;
//   }

//   if (remoteStream) {
//     remoteStream.getTracks().forEach((track) => track.stop());
//     remoteStream = null;
//   }

//   const callDoc = doc(db, "calls", callId);
//   deleteDoc(callDoc);

//   playSound("apfinis");
// }

// // Fonction pour lire des sons
// export function playSound(type) {
//   const sounds = {
//     apemis: new Audio("./apemis.mp3"),
//     apefinis: new Audio("./apfinis.mp3"),
//     ringtone: new Audio("./ringtone.mp3"),
//   };
//   const sound = sounds[type];
//   if (sound)
//     sound
//       .play()
//       .catch((err) =>
//         console.error(`Erreur lors de la lecture du son ${type}: ${err}`)
//       );
// }

// export function stopSound() {
//   if (currentSound) {
//     currentSound.pause();
//     currentSound.currentTime = 0;
//     currentSound = null;
//   }
// }
// import { useState, useEffect } from "react";
// import { endCall, stopSound, playSound } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import "./callerinterface.css"; // Importation du fichier CSS
// import { db } from "../../../../lib/firebase";
// // const db = getFirestore();

// export function CallerInterface({ callId, isVideo, onEndCall }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");

//   useEffect(() => {
//     const callDoc = doc(db, "calls", callId);

//     // Écoute les changements de statut pour vérifier si l'appel est accepté ou rejeté
//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();
//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       }
//     });
//     playSound("apemis");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${
//         isVideo ? "video-call-interface" : "audio-call-interface"
//       }`}
//     >
//       <p>{callStatus}</p>
//       <button onClick={handleEndCall}>Terminer l'appel</button>
//       {isVideo && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { endCall, stopSound, playSound } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import "./callerinterface.css"; // Importation du fichier CSS
// import { db } from "../../../../lib/firebase";

// export function CallerInterface({ callId, isVideo, onEndCall, callerId }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");
//   // const [receiverId, setReceiverId] = useState(null);

//   useEffect(() => {
//     const callDoc = doc(db, "calls", callId);

//     // Écoute les changements de statut pour vérifier si l'appel est accepté ou rejeté
//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       // Vérification de la correspondance des identifiants pour éviter les erreurs de statut
//       if (callData?.callerId !== callerId) {
//         console.log("Cet appel n'est pas destiné à cet utilisateur.");
//         return; // Si l'appel n'est pas destiné à ce callerId, on ne fait rien
//       }

//       // Enregistrer le receiverId depuis les données de l'appel
//       // setReceiverId(callData?.receiverId);

//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       }
//     });

//     playSound("apemis");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, callerId]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${
//         isVideo ? "video-call-interface" : "audio-call-interface"
//       }`}
//     >
//       <p>{callStatus}</p>
//       <button onClick={handleEndCall}> Terminer l'appel</button>
//       {isVideo && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { endCall, playSound, stopSound } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import "./callerinterface.css";

// export function CallerInterface({ callId, isVideo, onEndCall, callerId }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");

//   useEffect(() => {
//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.callerId !== callerId) return;

//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       }
//     });

//     playSound("apemis");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, callerId]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     if (onEndCall) onEndCall();
//   };

//   return (
//     <div className={`caller-interface ${isVideo ? "video-call" : "audio-call"}`}>
//       <p>{callStatus}</p>
//       <button onClick={handleEndCall}>Terminer l'appel</button>
//       {isVideo && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//     </div>
//   );
// }
// import {
//   doc,
//   getDoc,
//   setDoc,
//   collection,
//   onSnapshot,
// } from "firebase/firestore";
// import {
//   startCall,
//   playSound,
//   stopSound,
//   peerConnection,
// } from "../startcall/StartCall";
// import { db } from "../../../../lib/firebase";

// // Fonction pour répondre à un appel
// export async function answerCall(callId) {
//   const callDoc = doc(db, "calls", callId);

//   try {
//     const callData = (await getDoc(callDoc)).data();
//     if (!callData || !callData.offer) {
//       throw new Error("Aucune offre trouvée pour cet appel.");
//     }

//     // Initialiser l'appel
//     await startCall(callId, false);

//     // Définir la description distante avec l'offre
//     await peerConnection.setRemoteDescription(
//       new RTCSessionDescription(callData.offer)
//     );

//     // Créer et définir la réponse locale
//     const answerDescription = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answerDescription);

//     // Enregistrer la réponse dans Firestore
//     const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
//     await setDoc(callDoc, { answer }, { merge: true });

//     // Écouter les candidats ICE de l'appelant
//     listenForICECandidates(callId, "callerCandidates");

//     // Arrêter la sonnerie lorsque l'appel est accepté
//     stopSound();
//   } catch (error) {
//     console.error("Erreur lors de la réponse à l'appel:", error);
//   }
// }

// // Fonction pour rejeter un appel
// export async function rejectCall(callId) {
//   const callDoc = doc(db, "calls", callId);

//   try {
//     const callData = (await getDoc(callDoc)).data();
//     if (!callData) {
//       throw new Error("Aucun appel trouvé.");
//     }

//     // Mettre à jour l'état de l'appel pour indiquer qu'il a été rejeté
//     await setDoc(callDoc, { rejected: true }, { merge: true });

//     // Fermer la connexion si elle existe
//     if (peerConnection) {
//       peerConnection.close();
//     }

//     // Arrêter la sonnerie lorsque l'appel est rejeté
//     stopSound();

//     // Jouer un son pour notifier le rejet de l'appel
//     playSound("call_rejected");

//     console.log("Appel rejeté.");
//   } catch (error) {
//     console.error("Erreur lors du rejet de l'appel:", error);
//   }
// }

// // Écoute des candidats ICE
// function listenForICECandidates(callId, candidateType) {
//   const callDoc = doc(db, "calls", callId);
//   const candidatesCollection = collection(callDoc, candidateType);

//   onSnapshot(candidatesCollection, (snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       if (change.type === "added") {
//         const candidateData = change.doc.data();
//         if (candidateData) {
//           const candidate = new RTCIceCandidate(candidateData);
//           peerConnection.addIceCandidate(candidate).catch((error) => {
//             console.error("Erreur lors de l'ajout du candidat ICE:", error);
//           });
//         }
//       }
//     });
//   });
// }

// import {
//   doc,
//   getDoc,
//   setDoc,
//   collection,
//   onSnapshot,
// } from "firebase/firestore";
// import {
//   startCall,
//   playSound,
//   stopSound,
//   peerConnection,
// } from "../startcall/StartCall";
// import { db } from "../../../../lib/firebase";

// // Fonction pour répondre à un appel
// export async function answerCall(callId, receiverId) {
//   try {
//     const callDoc = doc(db, "calls", callId);
//     const callData = (await getDoc(callDoc)).data();

//     if (!callData?.offer) {
//       throw new Error("Aucune offre trouvée pour cet appel.");
//     }

//     if (callData.receiverId !== receiverId) {
//       throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
//     }

//     // Initialiser l'appel
//     await startCall(callId, false);

//     // Définir la description distante avec l'offre
//     await peerConnection.setRemoteDescription(
//       new RTCSessionDescription(callData.offer)
//     );

//     // Créer et définir la réponse locale
//     const answerDescription = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answerDescription);

//     // Enregistrer la réponse dans Firestore
//     await setDoc(
//       callDoc,
//       { answer: { type: answerDescription.type, sdp: answerDescription.sdp } },
//       { merge: true }
//     );

//     // Écouter les candidats ICE de l'appelant
//     listenForICECandidates(callId, "callerCandidates");

//     // Arrêter la sonnerie lorsque l'appel est accepté
//     stopSound();
//   } catch (error) {
//     console.error("Erreur lors de la réponse à l'appel:", error);
//   }
// }

// // Fonction pour rejeter un appel
// export async function rejectCall(callId, receiverId) {
//   try {
//     const callDoc = doc(db, "calls", callId);
//     const callData = (await getDoc(callDoc)).data();

//     if (!callData) {
//       throw new Error("Aucun appel trouvé.");
//     }

//     if (callData.receiverId !== receiverId) {
//       throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
//     }

//     // Mettre à jour Firestore pour indiquer le rejet
//     await setDoc(callDoc, { rejected: true }, { merge: true });

//     // Fermer la connexion si elle existe
//     peerConnection?.close();

//     // Arrêter la sonnerie et jouer un son de notification
//     stopSound();
//     playSound("call_rejected");

//     console.log("Appel rejeté.");
//   } catch (error) {
//     console.error("Erreur lors du rejet de l'appel:", error);
//   }
// }

// // Fonction pour écouter les candidats ICE
// function listenForICECandidates(callId, candidateType) {
//   const callDoc = doc(db, "calls", callId);
//   const candidatesCollection = collection(callDoc, candidateType);

//   onSnapshot(candidatesCollection, (snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       if (change.type === "added") {
//         const candidateData = change.doc.data();
//         if (candidateData) {
//           const candidate = new RTCIceCandidate(candidateData);
//           peerConnection
//             .addIceCandidate(candidate)
//             .catch((error) =>
//               console.error("Erreur lors de l'ajout du candidat ICE:", error)
//             );
//         }
//       }
//     });
//   });
// }

// import {
//   doc,
//   getDoc,
//   setDoc,
//   collection,
//   onSnapshot,
// } from "firebase/firestore";
// import {
//   startCall,
//   playSound,
//   stopSound,
//   peerConnection,
// } from "../startcall/StartCall";
// import { db } from "../../../../lib/firebase";

// // Fonction pour répondre à un appel
// export async function answerCall(callId, receiverId) {
//   const callDoc = doc(db, "calls", callId);

//   try {
//     const callData = (await getDoc(callDoc)).data();
//     if (!callData || !callData.offer) {
//       throw new Error("Aucune offre trouvée pour cet appel.");
//     }

//     // Vérification que l'appel est destiné au bon destinataire
//     if (callData.receiverId !== receiverId) {
//       throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
//     }

//     // Initialiser l'appel
//     await startCall(callId, false);

//     // Définir la description distante avec l'offre
//     await peerConnection.setRemoteDescription(
//       new RTCSessionDescription(callData.offer)
//     );

//     // Créer et définir la réponse locale
//     const answerDescription = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answerDescription);

//     // Enregistrer la réponse dans Firestore
//     const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
//     await setDoc(callDoc, { answer }, { merge: true });

//     // Écouter les candidats ICE de l'appelant
//     listenForICECandidates(callId, "callerCandidates");

//     // Arrêter la sonnerie lorsque l'appel est accepté
//     stopSound();
//   } catch (error) {
//     console.error("Erreur lors de la réponse à l'appel:", error);
//   }
// }

// // Fonction pour rejeter un appel
// export async function rejectCall(callId, receiverId) {
//   const callDoc = doc(db, "calls", callId);

//   try {
//     const callData = (await getDoc(callDoc)).data();
//     if (!callData) {
//       throw new Error("Aucun appel trouvé.");
//     }

//     // Vérification que l'appel est destiné au bon destinataire
//     if (callData.receiverId !== receiverId) {
//       throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
//     }

//     // Mettre à jour l'état de l'appel pour indiquer qu'il a été rejeté
//     await setDoc(callDoc, { rejected: true }, { merge: true });

//     // Fermer la connexion si elle existe
//     if (peerConnection) {
//       peerConnection.close();
//     }

//     // Arrêter la sonnerie lorsque l'appel est rejeté
//     stopSound();

//     // Jouer un son pour notifier le rejet de l'appel
//     playSound("call_rejected");

//     console.log("Appel rejeté.");
//   } catch (error) {
//     console.error("Erreur lors du rejet de l'appel:", error);
//   }
// }

// // Écoute des candidats ICE
// function listenForICECandidates(callId, candidateType) {
//   const callDoc = doc(db, "calls", callId);
//   const candidatesCollection = collection(callDoc, candidateType);

//   onSnapshot(candidatesCollection, (snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       if (change.type === "added") {
//         const candidateData = change.doc.data();
//         if (candidateData) {
//           const candidate = new RTCIceCandidate(candidateData);
//           peerConnection.addIceCandidate(candidate).catch((error) => {
//             console.error("Erreur lors de l'ajout du candidat ICE:", error);
//           });
//         }
//       }
//     });
//   });
// }

// import { useState, useEffect } from "react";
// import { playSound, stopSound } from "../startcall/StartCall";
// import { answerCall, rejectCall } from "../respondcall/RespondCall";
// import { doc, setDoc, onSnapshot } from "firebase/firestore";
// import "./respondInterface.css";
// import { db } from "../../../../lib/firebase";

// export function ReceiverInterface({ callId, callType, onEndCall, receiverId }) {
//   const [callStatus, setCallStatus] = useState("Appel entrant...");
//   const [callerId, setCallerId] = useState(null);

//   useEffect(() => {
//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.receiverId !== receiverId) {
//         console.log("Cet appel n'est pas destiné à cet utilisateur.");
//         return;
//       }

//       setCallerId(callData?.callerId);

//       if (callData?.accepted) {
//         setCallStatus("En cours d'appel");
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         onEndCall();
//         stopSound();
//       }
//     });

//     playSound("ringtone");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, receiverId, onEndCall]);

//   const handleAccept = async () => {
//     try {
//       await answerCall(callId, receiverId);

//       await setDoc(
//         doc(db, "calls", callId),
//         { accepted: true },
//         { merge: true }
//       );
//       setCallStatus("En cours d'appel");
//     } catch (error) {
//       console.error("Erreur lors de l'acceptation de l'appel:", error);
//     }
//   };

//   const handleReject = async () => {
//     try {
//       await rejectCall(callId, receiverId);

//       await setDoc(
//         doc(db, "calls", callId),
//         { rejected: true },
//         { merge: true }
//       );
//       setCallStatus("Appel rejeté");
//       onEndCall();
//     } catch (error) {
//       console.error("Erreur lors du rejet de l'appel:", error);
//     }
//   };

//   return (
//     <div
//       className={`call-interface ${
//         callType === "audio" ? "audio-call" : "video-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>

//       {callStatus === "Appel entrant..." && (
//         <div className="buttons">
//           <button onClick={handleAccept}>Accepter</button>
//           <button onClick={handleReject}>Rejeter</button>
//         </div>
//       )}

//       {callType === "video" && (
//         <div className="video-call">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}

//       {callType === "audio" && (
//         <div className="audio-call">
//           <p>Appel Audio en cours...</p>
//         </div>
//       )}
//     </div>
//   );
// }
// // import { useState, useEffect } from "react";
// // import { playSound, stopSound } from "../startcall/StartCall";
// // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // import { doc, setDoc } from "firebase/firestore";
// // import "./respondInterface.css";
// // // const db = getFirestore();
// // import { db } from "../../../../lib/firebase";

// // export function ReceiverInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("Appel entrant...");

// //   useEffect(() => {
// //     // Play ringtone for incoming calls
// //     playSound("ringtone");

// //     return () => {
// //       // Clean up when the component is unmounted
// //       stopSound(); // Play call end sound if the call ends
// //     };
// //   }, []);

// //   const handleAccept = async () => {
// //     try {
// //       await answerCall(callId);
// //       await setDoc(
// //         doc(db, "calls", callId),
// //         { accepted: true },
// //         { merge: true }
// //       );
// //       setCallStatus("En cours d'appel");
// //     } catch (error) {
// //       console.error("Erreur lors de l'acceptation de l'appel:", error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       await rejectCall(callId);
// //       await setDoc(
// //         doc(db, "calls", callId),
// //         { rejected: true },
// //         { merge: true }
// //       );
// //       setCallStatus("Appel rejeté");
// //       onEndCall();
// //       stopSound(); // Arrêter la sonnerie
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel:", error);
// //     }
// //   };

// //   return (
// //     <div
// //       className={`call-interface ${
// //         callType === "audio" ? "audio-call" : "video-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>

// //       {callStatus === "Appel entrant..." && (
// //         <div className="buttons">
// //           <button onClick={handleAccept}>Accepter</button>
// //           <button onClick={handleReject}>Rejeter</button>
// //         </div>
// //       )}

// //       {/* Video or Audio Call Display */}
// //       {callType === "video" && (
// //         <div className="video-call">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       )}

// //       {callType === "audio" && (
// //         <div className="audio-call">
// //           <div className="audio-call-info">
// //             <p>Appel Audio en cours...</p>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }


// // import { useState, useEffect } from "react";
// // import { playSound, stopSound } from "../startcall/StartCall";
// // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // import { doc, setDoc, onSnapshot} from "firebase/firestore";
// // import "./respondInterface.css";
// // import { db } from "../../../../lib/firebase";



// // export function ReceiverInterface({ callId, callType, onEndCall, receiverId }) {
// //   const [callStatus, setCallStatus] = useState("Appel entrant...");
// //   const [callerId, setCallerId] = useState(null);

// //   useEffect(() => {
// //     const callDoc = doc(db, "calls", callId);

// //     // Écoute des changements dans le document d'appel
// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();

// //       // Vérification que l'appel est destiné au bon destinataire
// //       if (callData?.receiverId !== receiverId) {
// //         console.log("Cet appel n'est pas destiné à cet utilisateur.");
// //         return; // Si l'appel n'est pas destiné au receiverId, on ne fait rien
// //       }

// //       // Enregistrer l'ID de l'appelant pour pouvoir afficher correctement le statut
// //       setCallerId(callData?.callerId);

// //       if (callData?.accepted) {
// //         setCallStatus("En cours d'appel");
// //       } else if (callData?.rejected) {
// //         setCallStatus("Appel rejeté");
// //         onEndCall();
// //         stopSound(); // Arrêter la sonnerie
// //       }
// //     });

// //     // Jouer la sonnerie pour un appel entrant
// //     playSound("ringtone");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId, receiverId]);

// //   const handleAccept = async () => {
// //     try {
// //       // Accepter l'appel
// //       await answerCall(callId);
// //       // Mettre à jour Firestore pour marquer l'appel comme accepté
// //       await setDoc(
// //         doc(db, "calls", callId),
// //         { accepted: true },
// //         { merge: true }
// //       );
// //       setCallStatus("En cours d'appel");
// //     } catch (error) {
// //       console.error("Erreur lors de l'acceptation de l'appel:", error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       // Rejeter l'appel
// //       await rejectCall(callId);
// //       // Mettre à jour Firestore pour marquer l'appel comme rejeté
// //       await setDoc(
// //         doc(db, "calls", callId),
// //         { rejected: true },
// //         { merge: true }
// //       );
// //       setCallStatus("Appel rejeté");
// //       onEndCall();
// //       stopSound(); // Arrêter la sonnerie
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel:", error);
// //     }
// //   };

// //   return (
// //     <div
// //       className={`call-interface ${
// //         callType === "audio" ? "audio-call" : "video-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>

// //       {callStatus === "Appel entrant..." && (
// //         <div className="buttons">
// //           <button onClick={handleAccept}>Accepter</button>
// //           <button onClick={handleReject}>Rejeter</button>
// //         </div>
// //       )}

// //       {/* Affichage de l'appel vidéo ou audio */}
// //       {callType === "video" && (
// //         <div className="video-call">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       )}

// //       {callType === "audio" && (
// //         <div className="audio-call">
// //           <div className="audio-call-info">
// //             <p>Appel Audio en cours...</p>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
// import {
//   doc,
//   getDoc,
//   setDoc,
//   collection,
//   onSnapshot,
// } from "firebase/firestore";
// import {
//   startCall,
//   playSound,
//   stopSound,
//   peerConnection,
// } from "../startcall/StartCall";
// import { db } from "../../../../lib/firebase";

// // Fonction pour répondre à un appel
// export async function answerCall(callId) {
//   try {
//     const callDoc = doc(db, "calls", callId);
//     const callData = (await getDoc(callDoc)).data();

//     if (!callData?.offer) {
//       throw new Error("Aucune offre trouvée pour cet appel.");
//     }

//     // if (callData.receiverId !== receiverId) {
//     //   throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
//     // }

//     // Initialiser l'appel
//     await startCall(callId, false);

//     // Définir la description distante avec l'offre
//     await peerConnection.setRemoteDescription(
//       new RTCSessionDescription(callData.offer)
//     );

//     // Créer et définir la réponse locale
//     const answerDescription = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answerDescription);

//     onSnapshot(callDoc, (snapshot) => {
//       const data = snapshot.data();
//       if (data?.status === "ended") {
//         console.log("L'appel a été terminé.");
//         peerConnection?.close();
//         stopSound();
//       }
//     });

//     // Enregistrer la réponse dans Firestore
//     await setDoc(
//       callDoc,
//       { answer: { type: answerDescription.type, sdp: answerDescription.sdp } },
//       { merge: true }
//     );

//     // Écouter les candidats ICE de l'appelant
//     listenForICECandidates(callId, "callerCandidates");

//     // Arrêter la sonnerie lorsque l'appel est accepté
//     stopSound();
//   } catch (error) {
//     console.error("Erreur lors de la réponse à l'appel:", error);
//   }
// }

// // Fonction pour rejeter un appel
// export async function rejectCall(callId) {
//   try {
//     const callDoc = doc(db, "calls", callId);
//     const callData = (await getDoc(callDoc)).data();

//     if (!callData) {
//       throw new Error("Aucun appel trouvé.");
//     }

//     // if (callData.receiverId !== receiverId) {
//     //   throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
//     // }

//     // Mettre à jour Firestore pour indiquer le rejet
//     await setDoc(callDoc, { rejected: true }, { merge: true });

//     // Fermer la connexion si elle existe
//     peerConnection?.close();

//     // Arrêter la sonnerie et jouer un son de notification
//     stopSound();
//     playSound("call_rejected");

//     console.log("Appel rejeté.");
//   } catch (error) {
//     console.error("Erreur lors du rejet de l'appel:", error);
//   }
// }

// // Fonction pour écouter les candidats ICE
// function listenForICECandidates(callId, candidateType) {
//   const callDoc = doc(db, "calls", callId);
//   const candidatesCollection = collection(callDoc, candidateType);

//   onSnapshot(candidatesCollection, (snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       if (change.type === "added") {
//         const candidateData = change.doc.data();
//         if (candidateData) {
//           const candidate = new RTCIceCandidate(candidateData);
//           peerConnection
//             .addIceCandidate(candidate)
//             .catch((error) =>
//               console.error("Erreur lors de l'ajout du candidat ICE:", error)
//             );
//         }
//       }
//     });
//   }
// );
// }


import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";

const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
export let peerConnection = null;
let localStream = null;
let remoteStream = null;
let currentSound = null; // Stockage du son en cours de lecture

// Fonction pour démarrer un appel
export async function startCall(callId, isVideo = false) {
  const callDoc = doc(db, "calls", callId);

  try {
    peerConnection = new RTCPeerConnection(servers);

    localStream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Ajout du flux vidéo local
    const localVideo = document.getElementById("localVideo");
    if (localVideo && isVideo) localVideo.srcObject = localStream;

    // Préparer le flux vidéo distant
    remoteStream = new MediaStream();
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo && isVideo) remoteVideo.srcObject = remoteStream;

    // Gestion des candidats ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        setDoc(
          doc(collection(callDoc, "callerCandidates")),
          event.candidate.toJSON()
        );
      }
    };

    // Gestion des réponses de l'autre utilisateur
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });
  } catch (error) {
    console.error("Erreur lors de la configuration de l'appel:", error);
    throw error; // Propager l'erreur pour être gérée par l'appelant
  }
}

// Fonction pour initier un appel
export async function initiateCall(callerId, receiverId, isVideo = false) {
  const callId = `${callerId}-${receiverId}-${Date.now()}`; // ID unique pour l'appel
  console.log("the caller id is", callId);
  const callRef = doc(db, "calls", callId);
  console.log("callref is ", callRef);

  try {
    await startCall(callId, isVideo);

    // Créer une offre
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = { sdp: offerDescription.sdp, type: offerDescription.type };

    // Enregistrer l'appel dans Firestore
    await setDoc(callRef, {
      callerId,
      receiverId,
      offer,
      status: "initiated", // Statut initial
      timestamp: new Date(),
    });

    // Jouer la sonnerie de l'appel
    playSound("apemis");
  } catch (error) {
    console.error("Erreur lors de l'initiation de l'appel:", error);
  }
}

// Fonction pour arrêter un appel
// export function endCall(callId) {
//   if (peerConnection) peerConnection.close();
//   peerConnection = null;

//   if (localStream) {
//     localStream.getTracks().forEach((track) => track.stop());
//     localStream = null;
//   }

//   if (remoteStream) {
//     remoteStream.getTracks().forEach((track) => track.stop());
//     remoteStream = null;
//   }

//   deleteDoc(doc(db, "calls", callId));
//   stopSound(); // Arrêter le son actuel
//   playSound("apfinis");
// }

export async function endCall(callId) {
  if (peerConnection) peerConnection.close();
  peerConnection = null;

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => track.stop());
    remoteStream = null;
  }

  // Vérifiez si le document existe avant de le supprimer
  const callDoc = doc(db, "calls", callId);
  const callSnapshot = await getDoc(callDoc);
  if (callSnapshot.exists()) {
    await deleteDoc(callDoc);
    console.log("Document supprimé.");
  } else {
    console.warn("Le document à supprimer n'existe pas.");
  }
  await setDoc(callDoc, { status: "ended" }, { merge: true });

  stopSound();
  playSound("apfinis");
}

// Gestion des sons
export function playSound(type) {
  const sounds = {
    apemis: new Audio("./apemis.mp3"),
    apfinis: new Audio("./apfinis.mp3"),
    ringtone: new Audio("./ringtone.mp3"),
  };

  stopSound();
  currentSound = sounds[type];
  if (currentSound) {
    currentSound
      .play()
      .catch((err) =>
        console.error(`Erreur lors de la lecture du son ${type}:`, err)
      );
  }
}

export function stopSound() {
  if (currentSound) {
    currentSound.pause();
    currentSound.currentTime = 0;
    currentSound = null;
  }
}


"import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  startCall,
  playSound,
  stopSound,
  peerConnection,
} from "../../../../dechet/startcall/StartCall";
import { db } from "../../../../lib/firebase";

// Fonction pour répondre à un appel
export async function answerCall(callId) {
  try {
    const callDoc = doc(db, "calls", callId);
    const callData = (await getDoc(callDoc)).data();

    if (!callData?.offer) {
      throw new Error("Aucune offre trouvée pour cet appel.");
    }

    // if (callData.receiverId !== receiverId) {
    //   throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
    // }

    // Initialiser l'appel
    await startCall(callId, false);

    // Définir la description distante avec l'offre
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(callData.offer)
    );

    // Créer et définir la réponse locale
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.status === "ended") {
        console.log("L'appel a été terminé.");
        peerConnection?.close();
        stopSound();
      }
    });

    // Enregistrer la réponse dans Firestore
    await setDoc(
      callDoc,
      { answer: { type: answerDescription.type, sdp: answerDescription.sdp } },
      { merge: true }
    );

    // Écouter les candidats ICE de l'appelant
    listenForICECandidates(callId, "callerCandidates");

    // Arrêter la sonnerie lorsque l'appel est accepté
    stopSound();
  } catch (error) {
    console.error("Erreur lors de la réponse à l'appel:", error);
  }
}

// Fonction pour rejeter un appel
export async function rejectCall(callId) {
  try {
    const callDoc = doc(db, "calls", callId);
    const callData = (await getDoc(callDoc)).data();

    if (!callData) {
      throw new Error("Aucun appel trouvé.");
    }

    // if (callData.receiverId !== receiverId) {
    //   throw new Error("Cet appel n'est pas destiné à cet utilisateur.");
    // }

    // Mettre à jour Firestore pour indiquer le rejet
    await setDoc(callDoc, { rejected: true }, { merge: true });

    // Fermer la connexion si elle existe
    peerConnection?.close();

    // Arrêter la sonnerie et jouer un son de notification
    stopSound();
    playSound("call_rejected");

    console.log("Appel rejeté.");
  } catch (error) {
    console.error("Erreur lors du rejet de l'appel:", error);
  }
}

// Fonction pour écouter les candidats ICE
function listenForICECandidates(callId, candidateType) {
  const callDoc = doc(db, "calls", callId);
  const candidatesCollection = collection(callDoc, candidateType);

  onSnapshot(candidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidateData = change.doc.data();
        if (candidateData) {
          const candidate = new RTCIceCandidate(candidateData);
          peerConnection
            .addIceCandidate(candidate)
            .catch((error) =>
              console.error("Erreur lors de l'ajout du candidat ICE:", error)
            );
        }
      }
    });
  }
);

//   debounce(async () => {
//     setIsTyping(true);

//     try {
//       const chatDocRef = doc(db, "chats", chatId);

//       await updateDoc(chatDocRef, {
//         [`typingUsers.${currentUser.id}`]: serverTimestamp(),
//       });
//     } catch (err) {
//       console.error("Error updating typing indicator:", err);
//     }

//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }

//     timeoutRef.current = setTimeout(() => {
//       setIsTyping(false);
//       removeTypingIndicator();
//     }, 1000);
//   }, 1000),
//   [chatId, currentUser.id]
// );

// useEffect(() => {
//   if (!chatId) return;

//   const chatDocRef = doc(db, "chats", chatId);

//   const unsubscribeTyping = onSnapshot(chatDocRef, (snapshot) => {
//     const chatData = snapshot.data();
//     if (chatData?.typingUsers) {
//       const otherTypingUsers = Object.keys(chatData.typingUsers).filter(
//         (id) => id !== currentUser.id
//       );

//       if (otherTypingUsers.length > 0) {
//         console.log("L'utilisateur écrit :", otherTypingUsers);
//         setIsTyping(true); // Montre que quelqu'un d'autre écrit
//       } else {
//         setIsTyping(false); // Personne n'écrit
//       }
//     }
//   });

//   return () => unsubscribeTyping();
// }, [chatId, currentUser.id]);

// useEffect(() => {
//   const chatDocRef = doc(db, "chats", chatId);
//   // const chatDocRef = doc(collection(db, "chats"), chatId);
//   const unsubscribeTyping = onSnapshot(chatDocRef, (snapshot) => {
//     const chatData = snapshot.data();
//     if (chatData && chatData.typingUsers) {
//       const otherUsersTyping = Object.keys(chatData.typingUsers).filter(
//         (id) => id !== currentUser.id
//       );
//     }
//   });

//   return () => unsubscribeTyping();
// }, [chatId, currentUser.id]);

// +useEffect(() => {
//   // Créer un identifiant d'appel unique
//   const newCallId = `${currentUser.id}-${user.id}-${Date.now()}`;
//   setCallId(newCallId);

//   // Écouter pour savoir si un appel est en cours de réception
//   const callDoc = doc(db, "calls", newCallId);
//   const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//     const callData = snapshot.data();
//     if (
//       callData &&
//       callData.offer &&
//       callData.receiverId === currentUser.id
//     ) {
//       setIsReceivingCall(true);
//       setCallType(callData.isVideo ? "video" : "audio");
//     }
//   });

//   return () => unsubscribe();
// }, [currentUser.id, user.id]);


}"// import { useState, useEffect } from "react";
// import { endCall, playSound, stopSound } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import "./callerinterface.css";

// export function CallerInterface({ callId, isVideo, onEndCall }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");

//   useEffect(() => {
//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       // if (callData?.callerId !== callerId) return;

//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       }
//     });

//     playSound("apemis");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     if (onEndCall) onEndCall();
//   };

//   return (
//     <div className={`caller-interface ${isVideo ? "video-call" : "audio-call"}`}>
//       <p>{callStatus}</p>
//       <button onClick={handleEndCall}>Terminer l'appel</button>
//       {isVideo && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//     </div>
//   );
// }
async function answerCall(callId) {
  try {
    const callDoc = doc(db, "calls", callId);
    const callData = (await getDoc(callDoc)).data();

    peerConnection = new RTCPeerConnection(servers);

    // Configurer le flux local
    localStream = await navigator.mediaDevices.getUserMedia({
      video: callData.callType === "video",
      audio: true,
    });
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    const localVideo = document.getElementById("localVideo");
    if (localVideo && callData.callType === "video") {
      localVideo.srcObject = localStream;
    }

    // Configurer le flux distant
    remoteStream = new MediaStream();
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo && callData.callType === "video") {
      remoteVideo.srcObject = remoteStream;
    }

    // Gestion des candidats ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        setDoc(
          doc(collection(callDoc, "receiverCandidates")),
          event.candidate.toJSON()
        );
      }
    };

    // Ajouter l'offre
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(callData.offer)
    );

    // Créer une réponse
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    // Mettre à jour Firestore avec la réponse
    await setDoc(callDoc, { answer, status: "accepted" }, { merge: true });
  } catch (error) {
    console.error("Erreur lors de la réponse à l'appel :", error);
  }
}

// import { useState, useEffect } from "react";
// import { endCall, playSound, stopSound } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import "./callerinterface.css";

// export function CallerInterface({ callId, isVideo, onEndCall }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");

//   useEffect(() => {
//     if (!callId) {
//       console.error("callId est null ou undefined.");
//       setCallStatus("Erreur : Identifiant d'appel manquant.");
//       return;
//     }

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       } else if (callData?.status === "ended") {
//         setCallStatus("Appel terminé");
//         handleEndCall();
//       }
//     });

//     playSound("ringtone");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     if (onEndCall) onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${
//         isVideo === true ? "video-call" : "audio-call"
//       }`}
//     >
//       {/* Titre et statut de l'appel */}
//       <h2>{callStatus}</h2>

//       {/* Bouton pour terminer l'appel */}
//       <button className="end-call-button" onClick={handleEndCall}>
//         Terminer l'appel
//       </button>

//       {/* Interface spécifique au type d'appel */}
//       {isVideo == true ? (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       ) : (
//         <div className="audio-interface">
//           <p>Appel audio en cours...</p>
//           <div className="caller-profile">
//             <img
//               src="/path-to-caller-profile.jpg"
//               alt="Profil de l'appelant"
//               className="profile-picture"
//             />
//             <p>{}</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { endCall, playSound, stopSound } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import "./callerinterface.css";

// export function CallerInterface({ callId, isVideo, onEndCall }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");

//   useEffect(() => {
//     console.log("callId:", callId);
//     console.log("db:", db);

//     if (!callId) {
//       console.error("callId est null ou undefined.");
//       setCallStatus("Erreur : Identifiant d'appel manquant.");
//       return;
//     }
//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();
//       console.log("Données d'appel:", callData);
//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       } else if (callData?.status === "ended") {
//         setCallStatus("Appel terminé");
//         handleEndCall();
//       }
//     });

//     playSound("ringtone");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     if (onEndCall) onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${isVideo ? "video-call" : "audio-call"}`}
//     >
//       <h2>{callStatus}</h2>
//       <button className="end-call-button" onClick={handleEndCall}>
//         Terminer l'appel
//       </button>
//       {isVideo && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//     </div>
//   );
// }
// const startCall = async (type) => {
  //   try {
  //     if (!user || !user.id) {
  //       console.error("Aucun utilisateur cible défini pour l'appel.");
  //       return;
  //     }

  //     const callDocRef = doc(collection(db, "calls"));
  //     const callData = {
  //       id: callDocRef.id,
  //       callerId: currentUser.id,
  //       receiverId: user.id,
  //       type,
  //       status: "calling",
  //       createdAt: serverTimestamp(),
  //     };

  //     await setDoc(callDocRef, callData);

  //     setCallId(callDocRef.id);
  //     setIsInitiatingCall(true);
  //     setCallType(type);
  //   } catch (error) {
  //     console.error("Erreur lors de l'initialisation de l'appel :", error);
  //   }
  // };

  // const handleStartCall = async (isVideo) => {
  //   try {
  //     // Vérifier si les utilisateurs sont valides
  //     if (!currentUser || !user || !chatId) {
  //       console.error("Utilisateur ou conversation non valide.");
  //       return;
  //     }
  //    const  callTypes = isVideo ? "video" : "audio";
  //     const callId = await initiateCall({
  //     callerId:currentUser.id,
  //     receiverId:user.id,
  //       callType,
  //     })
  //     // Générer un ID d'appel unique
  //     // const newCallId = uuidv4();
  //     setCallId(newCallId); // Stocker l'ID pour suivi
  //     setCallType(callTypes);
  //     setIsInitiatingCall(true); // Marquer que nous initialisons l'appel
  //     // Sauvegarder l'appel dans Firestore
  //     const callRef = doc(db, "calls", newCallId);
  //     await setDoc(callRef, callData);

  //     // Jouer une sonnerie pour l'appelant

  //     console.log("Appel lancé avec succès :", callData);

  //     // Optionnel : interface utilisateur pour signaler l'appel en cours
  //   } catch (error) {
  //     console.error("Erreur lors de l'initialisation de l'appel :", error);
  //     setIsInitiatingCall(false);
  //   }
  // };

  // const handleStartCall = async (isVideo) => {
  //   console.log("currentUser:", currentUser);
  //   console.log("user:", user);

  //   if (!currentUser || !user) {
  //     console.error("Erreur : Les utilisateurs sont manquants !");
  //     return;
  //   }

  //   const newCallId = `${currentUser.id}-${user.id}-${Date.now()}`;
  //   const callData = {
  //     callerId: currentUser.id,
  //     receiverId: user.id,
  //     type: isVideo ? "video" : "audio",
  //     status: "calling",
  //     createdAt: serverTimestamp(),
  //   };

  //   console.log("callData:", callData);

  //   try {
  //     await setDoc(doc(db, "calls", newCallId), callData);
  //     console.log("Appel initié avec succès :", newCallId);

  //     // Si tu appelles initiateCall ensuite
  //     initiateCall({
  //       callId: newCallId,
  //       type: isVideo ? "video" : "audio",
  //       receiverId: user.id,
  //       callerId: currentUser.id,
  //     });
  //   } catch (err) {
  //     console.error("Erreur lors de l'initiation de l'appel :", err);
  //   }
  // };

  // const handleStartCall = async (isVideo) => {
  //   console.log("currentUser:", currentUser);
  //   console.log("user:", user);

  //   if (!currentUser || !user) return;

  //   const newCallId = uuidv4();
  //   const callData = {
  //     callerId: currentUser?.id,
  //     receiverId: user?.id,
  //     type: isVideo ? "video" : "audio",
  //     status: "calling",
  //     createdAt: serverTimestamp(),
  //   };
  //   console.log("callData:", callData); // Vérifie les données avant de les transmettre

  //   try {
  //     await setDoc(doc(db, "calls", newCallId), callData);
  //     console.log("Appel initié avec succès :", newCallId);
  //     setCallId(newCallId);
  //     setCallType(isVideo ? "video" : "audio");
  //     setIsInitiatingCall(true);
  //     setIsReceivingCall(false);

  //     // Appeler `initiateCall` après avoir mis à jour Firestore
  //     initiateCall({
  //       callId: newCallId,
  //       type: isVideo ? "video" : "audio",
  //       receiverId: user.id,
  //       callerId: currentUser.id,
  //     });
  //   } catch (err) {
  //     console.error("Erreur lors du lancement de l'appel :", err);
  //   }
  // };

  // const handleStartCall = async (isVideo) => {
  //   if (!currentUser || !user) return;

  //   const newCallId = uuidv4();
  //   const callData = {
  //     callerId: currentUser.id,
  //     receiverId: user.id,
  //     type: isVideo ? "video" : "audio",
  //     status: "calling",
  //     createdAt: serverTimestamp(),
  //   };

  //   await setDoc(doc(db, "calls", newCallId), callData);
  //   setCallId(newCallId);
  //   setCallType(isVideo ? "video" : "audio");
  //   setIsInitiatingCall(true);
  //   setIsReceivingCall(false);
  // };

  // const handleStartCall = async (isVideo) => {
  //   if (!currentUser || !user) return;

  //   const newCallId = uuidv4();
  //   const callDoc = doc(db, "calls", newCallId);

  //   try {
  //     await setDoc(callDoc, {
  //       callId: newCallId,
  //       callerId: currentUser.id,
  //       receiverId: user.id,
  //       type: isVideo ? "video" : "audio",
  //       status: "calling",
  //       createdAt: new Date(),
  //       accepted: false,
  //       rejected: false,
  //     });

  //     setCallId(newCallId);
  //     setCallType(isVideo ? "video" : "audio");
  //     setIsInitiatingCall(true);
  //     console.log(`Appel ${isVideo ? "vidéo" : "audio"} initié.`);
  //     // setCallStatus("Appel sortant");
  //   } catch (error) {
  //     console.error("Erreur lors de l'initiation de l'appel :", error);
  //   }
  // }; 

  import { doc, setDoc,getDoc,  collection } from "firebase/firestore";
import { useCallStore } from "../zustand/callStore";
import { db } from "../firebaseConfig";
import { createPeerConnection } from "../utils/webrtc";
import { getToken } from "firebase/messaging";
import { messaging } from "../firebaseConfig";

export async function requestNotificationPermission() {
  try {
    const token = await getToken(messaging, { vapidKey: "YOUR_VAPID_KEY" });
    if (token) {
      console.log("FCM Token:", token);
      // Sauvegardez le token dans Firestore
    }
  } catch (err) {
    console.error("Erreur lors de la récupération du token FCM :", err);
  }
}

export async function startCall(callId, caller, receiver, isVideo = false) {
  const updateCallStatus = useCallStore.getState().updateCallStatus;

  try {
    // Initialisation
    const peerConnection = createPeerConnection();
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));

    useCallStore.getState().setLocalStream(localStream);

    // Enregistrement dans Firestore
    await setDoc(doc(db, "calls", callId), {
      status: "ringing",
      caller,
      receiver,
      startedAt: Date.now(),
    });

    updateCallStatus({ isCalling: true, isInCall: false });

    // Notification au récepteur
    const receiverDoc = await getDoc(doc(db, "users", receiver.id));
    const receiverFCMToken = receiverDoc.data()?.fcmToken;

    if (receiverFCMToken) {
      await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "key=YOUR_SERVER_KEY",
        },
        body: JSON.stringify({
          to: receiverFCMToken,
          notification: {
            title: "Appel entrant",
            body: `Vous recevez un appel de ${caller.name}`,
          },
          data: { callId },
        }),
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'appel :", error);
    useCallStore.getState().setError(error);
  }
}

// Fonction pour terminer un appel localement
// function endCall() {
//   if (peerConnection) {
//     peerConnection.close();
//     peerConnection = null;
//   }

//   stopSound();

//   console.log("L'appel a été terminé localement.");
// }



// // import {
// //   doc,
// //   getDoc,
// //   setDoc,
// //   collection,
// //   onSnapshot,
// // } from "firebase/firestore";
// // import {
// //   startCall,
// //   playSound,
// //   stopSound,
// //   peerConnection,
// //   endCall,
// // } from "../startcall/StartCall";
// // import { db } from "../../../../lib/firebase";

// // // Fonction pour répondre à un appel
// // export async function answerCall(callId, isVideo = false) {
// //   try {
// //     const callDoc = doc(db, "calls", callId);
// //     const callData = (await getDoc(callDoc)).data();

// //     if (!callData?.offer) {
// //       console.warn("Aucune offre trouvée pour cet appel.");
// //       return;
// //     }

// //     // Initialiser l'appel avec le type (audio/vidéo)
// //     await startCall(callId, isVideo);

// //     // Définir la description distante avec l'offre
// //     await peerConnection.setRemoteDescription(
// //       new RTCSessionDescription(callData.offer)
// //     );

// //     // Créer et définir la réponse locale
// //     const answerDescription = await peerConnection.createAnswer();
// //     await peerConnection.setLocalDescription(answerDescription);

// //     // Mettre à jour Firestore avec la réponse
// //     await setDoc(
// //       callDoc,
// //       { answer: { type: answerDescription.type, sdp: answerDescription.sdp } },
// //       { merge: true }
// //     );

// //     // Écouter les candidats ICE de l'appelant
// //     listenForICECandidates(callId, "callerCandidates");

// //     // Arrêter la sonnerie lorsque l'appel est accepté
// //     stopSound();

// //     // Écouter les mises à jour de statut
// //     onSnapshot(callDoc, (snapshot) => {
// //       const data = snapshot.data();
// //       if (data?.status === "ended") {
// //         console.log("L'appel a été terminé par l'appelant.");
// //         endCall(callId); // Ajout de `callId` pour cohérence
// //       }
// //     });

// //     console.log("Appel accepté.");
// //   } catch (error) {
// //     console.error("Erreur lors de la réponse à l'appel:", error);
// //   }
// // }

// // // Fonction pour rejeter un appel
// // export async function rejectCall(callId) {
// //   try {
// //     const callDoc = doc(db, "calls", callId);
// //     const callData = (await getDoc(callDoc)).data();

// //     if (!callData) {
// //       console.warn("Aucun appel trouvé pour le rejet.");
// //       return;
// //     }

// //     // Mettre à jour Firestore pour indiquer le rejet
// //     await setDoc(
// //       callDoc,
// //       { rejected: true, status: "rejected" },
// //       { merge: true }
// //     );

// //     // Fermer la connexion si elle existe
// //     peerConnection?.close();

// //     // Arrêter la sonnerie et jouer un son de notification
// //     stopSound();
// //     playSound("call_rejected");

// //     console.log("Appel rejeté.");
// //   } catch (error) {
// //     console.error("Erreur lors du rejet de l'appel:", error);
// //   }
// // }

// // // Fonction pour écouter les candidats ICE
// // function listenForICECandidates(callId, candidateType) {
// //   const callDoc = doc(db, "calls", callId);
// //   const candidatesCollection = collection(callDoc, candidateType);

// //   onSnapshot(candidatesCollection, (snapshot) => {
// //     snapshot.docChanges().forEach((change) => {
// //       if (change.type === "added") {
// //         const candidateData = change.doc.data();
// //         if (candidateData) {
// //           const candidate = new RTCIceCandidate(candidateData);
// //           peerConnection
// //             .addIceCandidate(candidate)
// //             .catch((error) =>
// //               console.error("Erreur lors de l'ajout du candidat ICE:", error)
// //             );
// //         }
// //       }
// //     });
// //   });
// // }

// import { useCallStore } from "../zustand/callStore";
// import { startCall, endCall } from "../startcall/StartCall";

// export async function answerCall(callId, isVideo = false) {
//   try {
//     const callDoc = doc(db, "calls", callId);
//     const callData = (await getDoc(callDoc)).data();

//     if (!callData?.offer) {
//       console.warn("Aucune offre trouvée.");
//       return;
//     }

//     await startCall(callId, isVideo);

//     const answerDescription = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answerDescription);

//     await setDoc(
//       callDoc,
//       { answer: { type: answerDescription.type, sdp: answerDescription.sdp } },
//       { merge: true }
//     );

//     useCallStore.getState().updateCallStatus({ isRinging: false, isInCall: true });
//   } catch (error) {
//     console.error("Erreur lors de la réponse:", error);
//     useCallStore.getState().setError(error);
//   }
// }
 import { doc, getDoc, setDoc } from "firebase/firestore";
// import { useCallStore } from "../zustand/callStore";
// import { db } from "../firebaseConfig";
// import { createPeerConnection } from "../utils/webrtc";

// export async function respondCall(callId, isVideo = false) {
//   const updateCallStatus = useCallStore.getState().updateCallStatus;

//   try {
//     const callDoc = doc(db, "calls", callId);
//     const callData = (await getDoc(callDoc)).data();

//     if (!callData?.offer) {
//       console.warn("Aucune offre trouvée.");
//       return;
//     }

//     const peerConnection = createPeerConnection();
//     const localStream = await navigator.mediaDevices.getUserMedia({
//       video: isVideo,
//       audio: true,
//     });

//     localStream.getTracks().forEach((track) =>
//       peerConnection.addTrack(track, localStream)
//     );

//     useCallStore.getState().setLocalStream(localStream);

//     peerConnection.setRemoteDescription(callData.offer);
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);

//     await setDoc(
//       callDoc,
//       { answer: { type: answer.type, sdp: answer.sdp } },
//       { merge: true }
//     );

//     updateCallStatus({ isInCall: true, isRinging: false });
//   } catch (error) {
//     console.error("Erreur lors de la réponse :", error);
//     useCallStore.getState().setError(error);
//   }
// }

// callStore.js
// import create from "zustand";
// import { persist } from "zustand/middleware";

// export const useCallStore = create(
//   persist(
//     (set) => ({
//       callState: {
//         isCalling: false,
//         isRinging: false,
//         isInCall: false,
//         isVideoCall: false,
//         callId: null,
//         localStream: null,
//         remoteStream: null,
//         error: null,
//       },
//       initializeCall: (callId, isVideo) =>
//         set(() => ({
//           callState: {
//             isCalling: true,
//             isVideoCall: isVideo,
//             callId,
//           },
//         })),
//       updateCallStatus: (status) =>
//         set((state) => ({
//           callState: { ...state.callState, ...status },
//         })),
//       resetCallState: () =>
//         set(() => ({
//           callState: {
//             isCalling: false,
//             isRinging: false,
//             isInCall: false,
//             isVideoCall: false,
//             callId: null,
//             localStream: null,
//             remoteStream: null,
//             error: null,
//           },
//         })),
//       setLocalStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, localStream: stream },
//         })),
//       setRemoteStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, remoteStream: stream },
//         })),
//       setError: (error) =>
//         set((state) => ({
//           callState: { ...state.callState, error },
//         })),
//     }),
//     { name: "call-store" }
//   )
// );

// import create from "zustand";
// import { persist } from "zustand/middleware";

// export const useCallStore = create(
//   persist(
//     (set) => ({
//       callState: {
//         isCalling: false,
//         isRinging: false,
//         isInCall: false,
//         isVideoCall: false,
//         callId: null,
//         localStream: null,
//         remoteStream: null,
//         error: null,
//       },
//       initializeCall: (callId, isVideo) =>
//         set(() => ({
//           callState: {
//             isCalling: true,
//             isVideoCall: isVideo,
//             callId,
//           },
//         })),
//       updateCallStatus: (status) =>
//         set((state) => ({
//           callState: { ...state.callState, ...status },
//         })),
//       resetCallState: () =>
//         set(() => ({
//           callState: {
//             isCalling: false,
//             isRinging: false,
//             isInCall: false,
//             isVideoCall: false,
//             callId: null,
//             localStream: null,
//             remoteStream: null,
//             error: null,
//           },
//         })),
//       setLocalStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, localStream: stream },
//         })),
//       setRemoteStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, remoteStream: stream },
//         })),
//       setError: (error) =>
//         set((state) => ({
//           callState: { ...state.callState, error },
//         })),
//     }),
//     { name: "call-store" }
//   )
// );
// import create from "zustand";
// import { persist } from "zustand/middleware";

// export const useCallStore = create(
//   persist(
//     (set) => ({
//       callState: {
//         isCalling: false,
//         isRinging: false,
//         isInCall: false,
//         isVideoCall: false,
//         callId: null,
//         localStream: null,
//         remoteStream: null,
//         error: null,
//         callerId: null,
//         receiverId: null,
//       },
//       initializeCall: (callId, isVideo, callerId, receiverId) =>
//         set(() => ({
//           callState: {
//             isCalling: true,
//             isVideoCall: isVideo,
//             callId,
//             callerId,
//             receiverId,
//           },
//         })),
//       updateCallStatus: (status) =>
//         set((state) => ({
//           callState: { ...state.callState, ...status },
//         })),
//       resetCallState: () =>
//         set(() => ({
//           callState: {
//             isCalling: false,
//             isRinging: false,
//             isInCall: false,
//             isVideoCall: false,
//             callId: null,
//             localStream: null,
//             remoteStream: null,
//             error: null,
//             callerId: null,
//             receiverId: null,
//           },
//         })),
//       setLocalStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, localStream: stream },
//         })),
//       setRemoteStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, remoteStream: stream },
//         })),
//       setError: (error) =>
//         set((state) => ({
//           callState: { ...state.callState, error },
//         })),
//     }),
//     { name: "call-store" }
//   )
// );

// import create from "zustand";
// import { persist } from "zustand/middleware";

// export const useCallStore = create(
//   persist(
//     (set) => ({
//       callState: {
//         isCalling: false,
//         isRinging: false,
//         isInCall: false,
//         isVideoCall: false,
//         callId: null,
//         localStream: null,
//         remoteStream: null,
//         error: null,
//         callerId: null,
//         receiverId: null,
//         currentSound: null,
//       },
//       initializeCall: (callId, isVideo, callerId, receiverId) =>
//         set(() => ({
//           callState: {
//             isCalling: true,
//             isVideoCall: isVideo,
//             callId,
//             callerId,
//             receiverId,
//           },
//         })),
//       updateCallStatus: (status) =>
//         set((state) => ({
//           callState: { ...state.callState, ...status },
//         })),
//       resetCallState: () =>
//         set(() => ({
//           callState: {
//             isCalling: false,
//             isRinging: false,
//             isInCall: false,
//             isVideoCall: false,
//             callId: null,
//             localStream: null,
//             remoteStream: null,
//             error: null,
//             callerId: null,
//             receiverId: null,
//             currentSound: null,
//           },
//         })),
//       setLocalStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, localStream: stream },
//         })),
//       setRemoteStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, remoteStream: stream },
//         })),
//       setError: (error) =>
//         set((state) => ({
//           callState: { ...state.callState, error },
//         })),
//       playSound: (type) =>
//         set((state) => {
//           const sounds = {
//             apemis: new Audio("./apemis.mp3"),
//             apfinis: new Audio("./apfinis.mp3"),
//             ringtone: new Audio("./ringtone.mp3"),
//           };

//           const currentSound = sounds[type];
//           if (state.callState.currentSound) {
//             state.callState.currentSound.pause();
//             state.callState.currentSound.currentTime = 0;
//           }

//           if (currentSound) {
//             currentSound
//               .play()
//               .catch((err) =>
//                 console.error(`Erreur lors de la lecture du son ${type} :`, err)
//               );
//           }

//           return {
//             callState: { ...state.callState, currentSound },
//           };
//         }),
//       stopSound: () =>
//         set((state) => {
//           const { currentSound } = state.callState;
//           if (currentSound) {
//             try {
//               currentSound.pause();
//               currentSound.currentTime = 0;
//             } catch (error) {
//               console.error("Erreur lors de l'arrêt du son :", error);
//             }
//           }
//           return {
//             callState: { ...state.callState, currentSound: null },
//           };
//         }),

//       // stopSound: () =>
//       //   set((state) => {
//       //     const { currentSound } = state.callState;
//       //     if (currentSound) {
//       //       currentSound.pause();
//       //       currentSound.currentTime = 0;
//       //     }
//       //     return {
//       //       callState: { ...state.callState, currentSound: null },
//       //     };
//       //   }),
//     }),
//     { name: "call-store" }
//   )
// );

// import create from "zustand";
// import { persist } from "zustand/middleware";

// export const useCallStore = create(
//   persist(
//     (set) => ({
//       callState: {
//         isCalling: false,
//         isRinging: false,
//         isInCall: false,
//         isVideoCall: false,
//         callId: null,
//         localStream: null,
//         remoteStream: null,
//         error: null,
//         callerId: null,
//         receiverId: null,
//         currentSound: null,
//         timeoutId: null, // Ajout pour gérer le temps limite
//       },
//       initializeCall: (callId, isVideo, callerId, receiverId) =>
//         set(() => ({
//           callState: {
//             isCalling: true,
//             isVideoCall: isVideo,
//             callId,
//             callerId,
//             receiverId,
//           },
//         })),
//       updateCallStatus: (status) =>
//         set((state) => ({
//           callState: { ...state.callState, ...status },
//         })),
//       resetCallState: () =>
//         set(() => ({
//           callState: {
//             isCalling: false,
//             isRinging: false,
//             isInCall: false,
//             isVideoCall: false,
//             callId: null,
//             localStream: null,
//             remoteStream: null,
//             error: null,
//             callerId: null,
//             receiverId: null,
//             currentSound: null,
//             timeoutId: null,
//           },
//         })),
//       setLocalStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, localStream: stream },
//         })),
//       setRemoteStream: (stream) =>
//         set((state) => ({
//           callState: { ...state.callState, remoteStream: stream },
//         })),
//       setError: (error) =>
//         set((state) => ({
//           callState: { ...state.callState, error },
//         })),
//       playSound: (type, loop = false) =>
//         set((state) => {
//           const sounds = {
//             apemis: new Audio("./apemis.mp3"),
//             apfinis: new Audio("./apfinis.mp3"),
//             ringtone: new Audio("./ringtone.mp3"),
//           };

//           const currentSound = sounds[type];
//           if (state.callState.currentSound) {
//             state.callState.currentSound.pause();
//             state.callState.currentSound.currentTime = 0;
//           }

//           if (currentSound) {
//             currentSound.loop = loop;
//             currentSound
//               .play()
//               .catch((err) =>
//                 console.error(`Erreur lors de la lecture du son ${type} :`, err)
//               );
//           }

//           return {
//             callState: { ...state.callState, currentSound },
//           };
//         }),
//       stopSound: () =>
//         set((state) => {
//           const { currentSound } = state.callState;
//           if (currentSound) {
//             try {
//               currentSound.pause();
//               currentSound.currentTime = 0;
//             } catch (error) {
//               console.error("Erreur lors de l'arrêt du son :", error);
//             }
//           }
//           return {
//             callState: { ...state.callState, currentSound: null },
//           };
//         }),
//       setCallTimeout: (timeoutId) =>
//         set((state) => ({
//           callState: { ...state.callState, timeoutId },
//         })),
//       clearCallTimeout: () =>
//         set((state) => {
//           const { timeoutId } = state.callState;
//           if (timeoutId) {
//             clearTimeout(timeoutId);
//           }
//           return {
//             callState: { ...state.callState, timeoutId: null },
//           };
//         }),
//     }),
//     { name: "call-store" }
//   )
// );

// import create from "zustand";
// import { persist } from "zustand/middleware";
// import { devtools } from "zustand/middleware";
// import firebase from "firebase/app"; // Assurez-vous d'avoir Firebase configuré dans votre projet

// // Import des sons
// import apemisSound from "./apemis.mp3";
// import apfinisSound from ".//apfinis.mp3";
// import ringtoneSound from "./ringtone.mp3";

// export const useCallStore = create(
//   devtools(
//     persist(
//       (set) => ({
//         // État initial de l'appel
//         callState: {
//           isCalling: false,
//           isRinging: false,
//           isInCall: false,
//           isVideoCall: false,
//           callId: null,
//           localStream: null,
//           remoteStream: null,
//           error: null,
//           callerId: null,
//           receiverId: null,
//           currentSound: null,
//           timeoutId: null,
//         },

//        checkReceiverAvailability: async (receiverId) => {
//         const receiverDoc = await firebase.firestore().collection("users").doc(receiverId).get();
//         if (receiverDoc.exists && receiverDoc.data().isOnline) {
//           return true;
//         }
//         return false;
//       },

//        prepareMediaStream: async (isVideo) => {
//         try {
//           const constraints = {
//             audio: true,
//             video: isVideo,
//           };
//           const stream = await navigator.mediaDevices.getUserMedia(constraints);
//           return stream;
//         } catch (error) {
//           console.error("Erreur lors de l'accès au média :", error);
//           throw new Error("Impossible d'accéder à la caméra ou au microphone.");
//         }
//       },

//         // Initialiser un appel
//         initializeCall: async (callId, isVideo, callerId, receiverId) => {
//           set((state) => {
//             if (!callId || !callerId || !receiverId) {
//               console.error("Paramètres de l'appel manquants !");
//               return {
//                 callState: {
//                   ...state.callState,
//                   error: "Paramètres manquants pour l'appel.",
//                 },
//               };
//             }
//             return {
//               callState: { ...state.callState, isCalling: true, error: null },
//             };
//           });

//           try {
//             // Vérification du destinataire
//             const isReceiverAvailable = await checkReceiverAvailability(
//               receiverId
//             );
//             if (!isReceiverAvailable) {
//               throw new Error("Le destinataire est indisponible.");
//             }

//             // Préparation des flux média
//             const localStream = await prepareMediaStream(isVideo);
//             set((state) => ({
//               callState: { ...state.callState, localStream },
//             }));

//             // Mise à jour de l'état
//             set((state) => ({
//               callState: {
//                 ...state.callState,
//                 isCalling: true,
//                 isVideoCall: isVideo,
//                 callId,
//                 callerId,
//                 receiverId,
//               },
//             }));

//             // Lecture du son d'appel
//             set((state) => {
//               state.playSound("apemis", true);
//               return state;
//             });

//             console.log("Appel initialisé avec succès !");
//           } catch (error) {
//             console.error(
//               "Erreur lors de l'initialisation de l'appel :",
//               error.message
//             );
//             set((state) => ({
//               callState: {
//                 ...state.callState,
//                 isCalling: false,
//                 error: error.message,
//               },
//             }));
//           }
//         },
//         prepareMediaStream: async (isVideo) => {
//         try {
//           const constraints = {
//             audio: true,
//             video: isVideo,
//           };
//           const stream = await navigator.mediaDevices.getUserMedia(constraints);
//           return stream;
//         } catch (error) {
//           console.error("Erreur lors de l'accès au média :", error);
//           throw new Error("Impossible d'accéder à la caméra ou au microphone.");
//         }
//       };

//         // Mettre à jour l'état de l'appel
//         updateCallStatus: (status) =>
//           set((state) => ({
//             callState: { ...state.callState, ...status },
//           })),

//         // Réinitialiser l'état de l'appel
//         resetCallState: () =>
//           set((state) => {
//             const { currentSound } = state.callState;
//             if (currentSound) {
//               currentSound.pause();
//               currentSound.currentTime = 0;
//             }
//             return {
//               callState: {
//                 isCalling: false,
//                 isRinging: false,
//                 isInCall: false,
//                 isVideoCall: false,
//                 callId: null,
//                 localStream: null,
//                 remoteStream: null,
//                 error: null,
//                 callerId: null,
//                 receiverId: null,
//                 currentSound: null,
//                 timeoutId: null,
//               },
//             };
//           }),

//         // Définir le flux local
//         setLocalStream: (stream) =>
//           set((state) => ({
//             callState: { ...state.callState, localStream: stream },
//           })),

//         // Définir le flux distant
//         setRemoteStream: (stream) =>
//           set((state) => ({
//             callState: { ...state.callState, remoteStream: stream },
//           })),

//         // Lire un son
//         playSound: (type, loop = false) =>
//           set((state) => {
//             try {
//               const sounds = {
//                 apemis: new Audio(apemisSound),
//                 apfinis: new Audio(apfinisSound),
//                 ringtone: new Audio(ringtoneSound),
//               };

//               const currentSound = sounds[type];
//               if (state.callState.currentSound) {
//                 state.callState.currentSound.pause();
//                 state.callState.currentSound.currentTime = 0;
//               }

//               if (currentSound) {
//                 currentSound.loop = loop;
//                 currentSound
//                   .play()
//                   .then(() => console.log(`${type} sound playing`))
//                   .catch((err) =>
//                     console.error(`Error playing ${type} sound:`, err.message)
//                   );
//               }

//               return {
//                 callState: { ...state.callState, currentSound },
//               };
//             } catch (error) {
//               console.error("Erreur lors de la lecture du son :", error);
//             }
//           }),

//         // Arrêter le son en cours
//         stopSound: () =>
//           set((state) => {
//             const { currentSound } = state.callState;
//             if (currentSound) {
//               try {
//                 currentSound.pause();
//                 currentSound.currentTime = 0;
//               } catch (error) {
//                 console.error("Erreur lors de l'arrêt du son :", error);
//               }
//             }
//             return {
//               callState: { ...state.callState, currentSound: null },
//             };
//           }),
//       }),
//       {
//         name: "call-store", // Nom pour la persistance
//         partialize: (state) => ({
//           isCalling: state.callState.isCalling,
//           isRinging: state.callState.isRinging,
//           isInCall: state.callState.isInCall,
//           isVideoCall: state.callState.isVideoCall,
//           callId: state.callState.callId,
//           callerId: state.callState.callerId,
//           receiverId: state.callState.receiverId,
//         }),
//       }
//     )
//   )
// );

// // import create from "zustand";
// // import { persist } from "zustand/middleware";
// // import { devtools } from "zustand/middleware";

// // export const useCallStore = create(
// //   devtools(
// //     persist(
// //       (set) => ({
// //         // Initial call state
// //         callState: {
// //           isCalling: false,
// //           isRinging: false,
// //           isInCall: false,
// //           isVideoCall: false,
// //           callId: null,
// //           localStream: null,
// //           remoteStream: null,
// //           error: null,
// //           callerId: null,
// //           receiverId: null,
// //           currentSound: null,
// //           timeoutId: null,
// //         },
// //         // Initialize a new call
// //         initializeCall: (callId, isVideo, callerId, receiverId) =>
// //           set((state) => ({
// //             callState: {
// //               ...state.callState,
// //               isCalling: true,
// //               isVideoCall: isVideo,
// //               callId,
// //               callerId,
// //               receiverId,
// //             },
// //           })),
// //         // Update the call status
// //         updateCallStatus: (status) =>
// //           set((state) => ({
// //             callState: { ...state.callState, ...status },
// //           })),
// //         // Reset the call state
// //         resetCallState: () =>
// //           set((state) => {
// //             const { currentSound } = state.callState;
// //             if (currentSound) {
// //               currentSound.pause();
// //               currentSound.currentTime = 0;
// //             }
// //             return {
// //               callState: {
// //                 isCalling: false,
// //                 isRinging: false,
// //                 isInCall: false,
// //                 isVideoCall: false,
// //                 callId: null,
// //                 localStream: null,
// //                 remoteStream: null,
// //                 error: null,
// //                 callerId: null,
// //                 receiverId: null,
// //                 currentSound: null,
// //                 timeoutId: null,
// //               },
// //             };
// //           }),
// //         // Set the local stream
// //         setLocalStream: (stream) =>
// //           set((state) => ({
// //             callState: { ...state.callState, localStream: stream },
// //           })),
// //         // Set the remote stream
// //         setRemoteStream: (stream) =>
// //           set((state) => ({
// //             callState: { ...state.callState, remoteStream: stream },
// //           })),
// //         // Set an error
// //         setError: (error) =>
// //           set((state) => ({
// //             callState: { ...state.callState, error },
// //           })),
// //         // Play a sound
// //         playSound: (type, loop = false) =>
// //           set((state) => {
// //             const sounds = {
// //               apemis: new Audio("./apemis.mp3"),
// //               apfinis: new Audio("./apfinis.mp3"),
// //               ringtone: new Audio("./ringtone.mp3"),
// //             };

// //             const currentSound = sounds[type];
// //             if (state.callState.currentSound) {
// //               state.callState.currentSound.pause();
// //               state.callState.currentSound.currentTime = 0;
// //             }

// //             if (currentSound) {
// //               currentSound.loop = loop;
// //               currentSound
// //                 .play()
// //                 .then(() => console.log(`${type} sound playing`))
// //                 .catch((err) =>
// //                   console.error(`Error playing ${type} sound:`, err.message)
// //                 );
// //             }

// //             return {
// //               callState: { ...state.callState, currentSound },
// //             };
// //           }),
// //         // Stop any currently playing sound
// //         stopSound: () =>
// //           set((state) => {
// //             const { currentSound } = state.callState;
// //             if (currentSound) {
// //               try {
// //                 currentSound.pause();
// //                 currentSound.currentTime = 0;
// //               } catch (error) {
// //                 console.error("Error stopping sound:", error);
// //               }
// //             }
// //             return {
// //               callState: { ...state.callState, currentSound: null },
// //             };
// //           }),
// //         // Set a timeout ID for the call
// //         setCallTimeout: (timeoutId) =>
// //           set((state) => ({
// //             callState: { ...state.callState, timeoutId },
// //           })),
// //         // Clear the call timeout
// //         clearCallTimeout: () =>
// //           set((state) => {
// //             const { timeoutId } = state.callState;
// //             if (timeoutId) {
// //               clearTimeout(timeoutId);
// //             }
// //             return {
// //               callState: { ...state.callState, timeoutId: null },
// //             };
// //           }),
// //       }),
// //       {
// //         name: "call-store", // Name for persistence
// //         partialize: (state) => ({
// //           // Persist only selected parts of the state
// //           isCalling: state.callState.isCalling,
// //           isRinging: state.callState.isRinging,
// //           isInCall: state.callState.isInCall,
// //           isVideoCall: state.callState.isVideoCall,
// //           callId: state.callState.callId,
// //           callerId: state.callState.callerId,
// //           receiverId: state.callState.receiverId,
// //         }),
// //       }
// //     )
// //   )
// // );

// // import create from "zustand";
// // import { persist } from "zustand/middleware";

// // export const useCallStore = create(
// //   persist(
// //     (set) => ({
// //       callState: {
// //         isCalling: false,
// //         isRinging: false,
// //         isInCall: false,
// //         isVideoCall: false,
// //         callId: null,
// //         localStream: null,
// //         remoteStream: null,
// //         error: null,
// //         callerId: null,
// //         receiverId: null,
// //         currentSound: null,
// //         timeoutId: null,
// //       },
// //       initializeCall: (callId, isVideo, callerId, receiverId) =>
// //         set(() => ({
// //           callState: {
// //             isCalling: true,
// //             isVideoCall: isVideo,
// //             callId,
// //             callerId,
// //             receiverId,
// //           },
// //         })),
// //       updateCallStatus: (status) =>
// //         set((state) => ({
// //           callState: { ...state.callState, ...status },
// //         })),
// //       resetCallState: () =>
// //         set(() => ({
// //           callState: {
// //             isCalling: false,
// //             isRinging: false,
// //             isInCall: false,
// //             isVideoCall: false,
// //             callId: null,
// //             localStream: null,
// //             remoteStream: null,
// //             error: null,
// //             callerId: null,
// //             receiverId: null,
// //             currentSound: null,
// //             timeoutId: null,
// //           },
// //         })),
// //       setLocalStream: (stream) =>
// //         set((state) => ({
// //           callState: { ...state.callState, localStream: stream },
// //         })),
// //       setRemoteStream: (stream) =>
// //         set((state) => ({
// //           callState: { ...state.callState, remoteStream: stream },
// //         })),
// //       setError: (error) =>
// //         set((state) => ({
// //           callState: { ...state.callState, error },
// //         })),
// //       playSound: (type, loop = false) =>
// //         set((state) => {
// //           const sounds = {
// //             apemis: new Audio("./apemis.mp3"),
// //             apfinis: new Audio("./apfinis.mp3"),
// //             ringtone: new Audio("./ringtone.mp3"),
// //           };

// //           const currentSound = sounds[type];
// //           if (state.callState.currentSound) {
// //             state.callState.currentSound.pause();
// //             state.callState.currentSound.currentTime = 0;
// //           }

// //           if (currentSound) {
// //             currentSound.loop = loop;
// //             currentSound
// //               .play()
// //               .catch((err) =>
// //                 console.error(`Erreur lors de la lecture du son ${type} :`, err)
// //               );
// //           }

// //           return {
// //             callState: { ...state.callState, currentSound },
// //           };
// //         }),
// //       stopSound: () =>
// //         set((state) => {
// //           const { currentSound } = state.callState;
// //           if (currentSound) {
// //             try {
// //               currentSound.pause();
// //               currentSound.currentTime = 0;
// //             } catch (error) {
// //               console.error("Erreur lors de l'arrêt du son :", error);
// //             }
// //           }
// //           return {
// //             callState: { ...state.callState, currentSound: null },
// //           };
// //         }),
// //       setCallTimeout: (timeoutId) =>
// //         set((state) => ({
// //           callState: { ...state.callState, timeoutId },
// //         })),
// //       clearCallTimeout: () =>
// //         set((state) => {
// //           const { timeoutId } = state.callState;
// //           if (timeoutId) {
// //             clearTimeout(timeoutId);
// //           }
// //           return {
// //             callState: { ...state.callState, timeoutId: null },
// //           };
// //         }),
// //     }),
// //     { name: "call-store" }
// //   )
// // );
// // import { useState, useEffect } from "react";
// // import { doc, setDoc, deleteDoc, collection, onSnapshot, getDoc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import { useCallStore } from "../../../../lib/useCall";

// // const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// // export function useCallData() {
// //   const {
// //     updateCallStatus,
// //     setLocalStream,
// //     setRemoteStream,
// //     resetCallState,
// //     playSound,
// //     stopSound,
// //     setCallTimeout,
// //   } = useCallStore.getState();

// //   const [peerConnection, setPeerConnection] = useState(null);

// //   useEffect(() => {
// //     return () => {
// //       cleanupCall();
// //     };
// //   }, []);

// //   const startCall = async (callId, isVideo = false, receiverId) => {
// //     try {
// //       let newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(newPeerConnection);

// //       const localStream = await navigator.mediaDevices.getUserMedia({
// //         video: isVideo,
// //         audio: true,
// //       });

// //       localStream.getTracks().forEach((track) => newPeerConnection.addTrack(track, localStream));
// //       setLocalStream(localStream);

// //       newPeerConnection.ontrack = (event) => {
// //         const remoteStream = new MediaStream();
// //         event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
// //         setRemoteStream(remoteStream);
// //       };

// //       newPeerConnection.onicecandidate = (event) => {
// //         if (event.candidate) {
// //           const candidateRef = doc(collection(doc(db, "calls", callId), "callerCandidates"));
// //           setDoc(candidateRef, event.candidate.toJSON());
// //         }
// //       };

// //       await setDoc(doc(db, "calls", callId), {
// //         callerId: useCallStore.getState().callState.callerId,
// //         receiverId,
// //         type: isVideo ? "video" : "audio",
// //         status: "calling",
// //         createdAt: new Date(),
// //       });

// //       playSound("apemis", true); // Outgoing ringtone
// //       updateCallStatus({ isCalling: true });

// //       const timeoutId = setTimeout(() => {
// //         cleanupCall(newPeerConnection);
// //         updateCallStatus({ isCalling: false, isInCall: false });
// //         playSound("apfinis"); // End call sound
// //       }, 30000); // 30 seconds

// //       setCallTimeout(timeoutId);
// //     } catch (error) {
// //       console.error("Error starting the call:", error);
// //       resetCallState();
// //     }
// //   };

// //   const answerCall = async (callId) => {
// //     try {
// //       const callDoc = doc(db, "calls", callId);
// //       const callData = (await getDoc(callDoc)).data();

// //       if (!callData?.offer) {
// //         console.warn("Aucune offre trouvée pour cet appel.");
// //         playSound("error");
// //         updateCallStatus("error");
// //         return;
// //       }

// //       playSound("call_connecting");

// //       await startCall(callId, false);

// //       await peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));

// //       const answerDescription = await peerConnection.createAnswer();
// //       await peerConnection.setLocalDescription(answerDescription);

// //       await setDoc(callDoc, {
// //         answer: { type: answerDescription.type, sdp: answerDescription.sdp },
// //       }, { merge: true });

// //       listenForICECandidates(callId, "callerCandidates");

// //       updateCallStatus("accepted");
// //       setLocalStream(peerConnection.localStream);
// //       setRemoteStream(peerConnection.remoteStream);
// //       stopSound();

// //       onSnapshot(callDoc, (snapshot) => {
// //         const data = snapshot.data();
// //         if (data?.status === "ended") {
// //           endCall(callId);
// //           playSound("call_ended");
// //           updateCallStatus("ended");
// //         }
// //       });

// //       console.log("Appel accepté.");
// //     } catch (error) {
// //       console.error("Erreur lors de la réponse à l'appel:", error);
// //       playSound("error");
// //       updateCallStatus("error");
// //     }
// //   };

// //   const rejectCall = async (callId) => {
// //     try {
// //       const callDoc = doc(db, "calls", callId);
// //       await setDoc(callDoc, { rejected: true, status: "rejected" }, { merge: true });

// //       playSound("call_rejected");

// //       cleanupCall();
// //       resetCallState();
// //       stopSound();
// //       console.log("Appel rejeté.");

// //       updateCallStatus("rejected");
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel:", error);
// //       playSound("error");
// //       updateCallStatus("error");
// //     }
// //   };

// //   const endCall = async (callId) => {
// //     try {
// //       cleanupCall();
// //       await deleteDoc(doc(db, "calls", callId));
// //       stopSound();
// //     } catch (error) {
// //       console.error("Error ending the call:", error);
// //     }
// //   };

// //   const cleanupCall = () => {
// //     const { localStream, remoteStream } = useCallStore.getState();

// //     if (peerConnection) {
// //       peerConnection.close();
// //       setPeerConnection(null);
// //     }

// //     localStream?.getTracks().forEach((track) => track.stop());
// //     remoteStream?.getTracks().forEach((track) => track.stop());

// //     stopSound();
// //     resetCallState();
// //   };

// //   const listenForICECandidates = (callId, candidateType) => {
// //     const callDoc = doc(db, "calls", callId);
// //     const candidatesCollection = collection(callDoc, candidateType);

// //     onSnapshot(candidatesCollection, (snapshot) => {
// //       snapshot.docChanges().forEach((change) => {
// //         if (change.type === "added") {
// //           const candidateData = change.doc.data();
// //           peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
// //         }
// //       });
// //     });
// //   };

// //   return {
// //     startCall,
// //     answerCall,
// //     rejectCall,
// //     endCall,
// //     listenForICECandidates,
// //   };
// // }

// export function CallerInterface({ callId, callType, onEndCall }) {
//   const { playSound, stopSound, resetCallState, callStatus: storeCallStatus, updateCallStatus } = useCallStore();

//   const [callStatus, setCallStatus] = useState(storeCallStatus || "En attente de réponse...");

//   useEffect(() => {
//     if (!callId) {
//       console.error("callId est null ou undefined.");
//       setCallStatus("Erreur : Identifiant d'appel manquant.");
//       return;
//     }

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound(); // Arrêter la sonnerie
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       } else if (callData?.status === "ended") {
//         setCallStatus("Appel terminé");
//         handleEndCall();
//       }

//       updateCallStatus(callData?.status || "En attente de réponse...");
//     });

//     playSound("ringtone");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, playSound, stopSound, updateCallStatus]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     resetCallState();
//     if (onEndCall) onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${
//         callType === "video" ? "video-call" : "audio-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>
//       <button className="end-call-button" onClick={handleEndCall}>
//         Terminer l'appel
//       </button>
//       {callType === "video" ? (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       ) : (
//         <div className="audio-interface">
//           <p>Appel audio en cours...</p>
//           <div className="caller-profile">
//             <img
//               src="/path-to-caller-profile.jpg"
//               alt="Profil de l'appelant"
//               className="profile-picture"
//             />
//             <p>Nom de l'appelant</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { endCall } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import { useCallStore } from "../../../../lib/useCall";
// import "./callerinterface.css";

// export function CallerInterface({ callId, callType, onEndCall }) {
//   const [callStatus, setCallStatus] = useState("En attente de réponse...");
//   const { playSound, stopSound, resetCallState } = useCallStore();

//   useEffect(() => {
//     if (!callId) {
//       console.error("callId est null ou undefined.");
//       setCallStatus("Erreur : Identifiant d'appel manquant.");
//       return;
//     }

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound(); // Arrêter la sonnerie
//       } else if (callData?.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       } else if (callData?.status === "ended") {
//         setCallStatus("Appel terminé");
//         handleEndCall();
//       }
//     });

//     playSound("ringtone");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, playSound, stopSound]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     resetCallState();
//     if (onEndCall) onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${
//         callType === "video" ? "video-call" : "audio-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>
//       <button className="end-call-button" onClick={handleEndCall}>
//         Terminer l'appel
//       </button>
//       {callType === "video" ? (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       ) : (
//         <div className="audio-interface">
//           <p>Appel audio en cours...</p>
//           <div className="caller-profile">
//             <img
//               src="/path-to-caller-profile.jpg"
//               alt="Profil de l'appelant"
//               className="profile-picture"
//             />
//             <p>Nom de l'appelant</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // import { useState, useEffect } from "react";
// // import { endCall} from "../startcall/StartCall";
// // import { onSnapshot, doc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import { useCallStore } from "../../../../lib/useCall";
// // import "./callerinterface.css";

// // export function CallerInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("En attente de réponse...");
// //   const { playSound, stopSound, resetCallState } = useCallStore();

// //   useEffect(() => {
// //     if (!callId) {
// //       console.error("callId est null ou undefined.");
// //       setCallStatus("Erreur : Identifiant d'appel manquant.");
// //       return;
// //     }

// //     const callDoc = doc(db, "calls", callId);

// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();

// //       if (callData?.accepted) {
// //         setCallStatus("Appel accepté");
// //         stopSound(); // Arrêter la sonnerie
// //       } else if (callData?.rejected) {
// //         setCallStatus("Appel rejeté");
// //         handleEndCall();
// //       } else if (callData?.status === "ended") {
// //         setCallStatus("Appel terminé");
// //         handleEndCall();
// //       }
// //     });

// //     playSound("ringtone");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId, playSound, stopSound]);

// //   const handleEndCall = () => {
// //     endCall(callId);
// //     setCallStatus("Appel terminé");
// //     resetCallState();
// //     if (onEndCall) onEndCall();
// //   };

// //   return (
// //     <div
// //       className={`caller-interface ${
// //         callType === "video" ? "video-call" : "audio-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>
// //       <button className="end-call-button" onClick={handleEndCall}>
// //         Terminer l'appel
// //       </button>
// //       {callType === "video" ? (
// //         <div className="video-container">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       ) : (
// //         <div className="audio-interface">
// //           <p>Appel audio en cours...</p>
// //           <div className="caller-profile">
// //             <img
// //               src="/path-to-caller-profile.jpg"
// //               alt="Profil de l'appelant"
// //               className="profile-picture"
// //             />
// //             <p>Nom de l'appelant</p>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // // import { useState, useEffect } from "react";
// // // import { endCall, playSound, stopSound } from "../startcall/StartCall";
// // // import { onSnapshot, doc } from "firebase/firestore";
// // // import { db } from "../../../../lib/firebase";
// // // import "./callerinterface.css";

// // // export function CallerInterface({ callId, callType, onEndCall }) {
// // //   const [callStatus, setCallStatus] = useState("En attente de réponse...");

// // //   useEffect(() => {
// // //     if (!callId) {
// // //       console.error("callId est null ou undefined.");
// // //       setCallStatus("Erreur : Identifiant d'appel manquant.");
// // //       return;
// // //     }

// // //     // Récupération du document de l'appel dans Firestore
// // //     const callDoc = doc(db, "calls", callId);

// // //     // Écoute les modifications du document Firestore
// // //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// // //       const callData = snapshot.data();

// // //       if (callData?.accepted) {
// // //         setCallStatus("Appel accepté");
// // //         stopSound();
// // //       } else if (callData?.rejected) {
// // //         setCallStatus("Appel rejeté");
// // //         handleEndCall();
// // //       } else if (callData?.status === "ended") {
// // //         setCallStatus("Appel terminé");
// // //         handleEndCall();
// // //       }
// // //     });

// // //     // Jouer la sonnerie en attendant une réponse
// // //     playSound("ringtone");

// // //     // Nettoyage lors du démontage
// // //     return () => {
// // //       unsubscribe();
// // //       stopSound();
// // //     };
// // //   }, [callId]);

// // //   const handleEndCall = () => {
// // //     endCall(callId);
// // //     setCallStatus("Appel terminé");
// // //     if (onEndCall) onEndCall();
// // //   };
// // //   console.log("calltype is ", callType);

// // //   return (
// // //     <div
// // //       className={`caller-interface ${
// // //         callType === "video" ? "video-call" : "audio-call"
// // //       }`}
// // //     >
// // //       {/* Titre et statut de l'appel */}
// // //       <h2>{callStatus}</h2>

// // //       {/* Bouton pour terminer l'appel */}
// // //       <button className="end-call-button" onClick={handleEndCall}>
// // //         Terminer l'appel
// // //       </button>

// // //       {/* Interface spécifique au type d'appel */}
// // //       {callType === "video" ? (
// // //         <div className="video-container">
// // //           <video id="localVideo" autoPlay playsInline muted></video>
// // //           <video id="remoteVideo" autoPlay playsInline></video>
// // //         </div>
// // //       ) : (
// // //         <div className="audio-interface">
// // //           <p>Appel audio en cours...</p>
// // //           <div className="caller-profile">
// // //             <img
// // //               src="/path-to-caller-profile.jpg"
// // //               alt="Profil de l'appelant"
// // //               className="profile-picture"
// // //             />
// // //             <p>Nom de l'appelant</p>
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }

// // import { useState, useEffect } from "react";
// // import { endCall, playSound, stopSound } from "../startcall/StartCall";
// // import { onSnapshot, doc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import "./callerinterface.css";

// // export function CallerInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("En attente de réponse...");

// //   useEffect(() => {
// //     if (!callId) {
// //       console.error("callId est null ou undefined.");
// //       setCallStatus("Erreur : Identifiant d'appel manquant.");
// //       return;
// //     }

// //     const callDoc = doc(db, "calls", callId);

// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();

// //       if (callData?.accepted) {
// //         setCallStatus("Appel accepté");
// //         stopSound();
// //       } else if (callData?.rejected) {
// //         setCallStatus("Appel rejeté");
// //         handleEndCall();
// //       } else if (callData?.status === "ended") {
// //         setCallStatus("Appel terminé");
// //         handleEndCall();
// //       }
// //     });

// //     playSound("ringtone");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId]);

// //   const handleEndCall = () => {
// //     endCall(callId);
// //     setCallStatus("Appel terminé");
// //     if (onEndCall) onEndCall();
// //   };

// //   console.log("callType", callType);
// //   return (
// //     <div
// //       className={`caller-interface ${
// //         callType === "video" ? "video-call" : "audio-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>
// //       <button className="end-call-button" onClick={handleEndCall}>
// //         Terminer l'appel
// //       </button>
// //       {callType === "video" ? (
// //         <div className="video-container">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       ) : (
// //         <div className="audio-interface">
// //           <p>Appel audio en cours...</p>
// //           <div className="caller-profile">
// //             <img
// //               src="/path-to-caller-profile.jpg"
// //               alt="Profil de l'appelant"
// //               className="profile-picture"
// //             />
// //             <p>Nom de l'appelant</p>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // import { useState, useEffect } from "react";
// // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // import { onSnapshot, doc, updateDoc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import { useCallStore } from "../../../../lib/useCall";
// // import "./respondInterface.css";

// // export function ReceiverInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("Appel entrant...");
// //   const [callerId, setCallerId] = useState(null);
// //   const [isCallOngoing, setIsCallOngoing] = useState(false);
// //   const { playSound, stopSound } = useCallStore();
// //   useEffect(() => {
// //     const callDoc = doc(db, "calls", callId);

// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();
// //       setCallerId(callData?.callerId);

// //       if (callData?.accepted) {
// //         setCallStatus("En cours d'appel");
// //         setIsCallOngoing(true);
// //         stopSound();
// //       } else if (callData?.rejected || callData?.status === "ended") {
// //         setCallStatus("Appel terminé ou rejeté");
// //         handleEndCall();
// //       }
// //     });

// //     playSound("ringtone_incoming");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId]);

// //   const handleAccept = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { accepted: true });
// //       await answerCall(callId);
// //       setCallStatus("En cours d'appel");
// //       setIsCallOngoing(true);
// //     } catch (error) {
// //       console.error("Erreur lors de l'acceptation de l'appel :", error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { rejected: true });
// //       setCallStatus("Appel rejeté");
// //       onEndCall();
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel :", error);
// //     }
// //   };

// //   const handleEndCall = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { status: "ended" });
// //       setCallStatus("Appel terminé");
// //       stopSound();
// //       if (onEndCall) onEndCall();
// //     } catch (error) {
// //       console.error("Erreur lors de la fin de l'appel :", error);
// //     }
// //   };

// //   return (
// //     <div
// //       className={`call-interface ${
// //         callType === "video" ? "video-call" : "audio-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>
// //       {!isCallOngoing && callStatus === "Appel entrant..." && (
// //         <div className="buttons">
// //           <button className="accept-button" onClick={handleAccept}>
// //             Accepter
// //           </button>
// //           <button className="reject-button" onClick={handleReject}>
// //             Rejeter
// //           </button>
// //         </div>
// //       )}
// //       {callType === "video" && isCallOngoing && (
// //         <div className="video-container">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       )}
// //       {isCallOngoing && (
// //         <button className="end-call-button" onClick={handleEndCall}>
// //           Terminer l'appel
// //         </button>
// //       )}
// //     </div>
// //   );
// // }

// import { useState, useEffect } from "react";
// import { onSnapshot, doc, updateDoc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import { useCallStore } from "../../../../lib/useCall";
// import "./respondInterface.css";

// export function ReceiverInterface({ callId, callType, onEndCall }) {
//   const { updateCallStatus, playSound, stopSound, callStatus: storeCallStatus } = useCallStore();
//   const [callStatus, setCallStatus] = useState(storeCallStatus || "Appel entrant...");
//   const [isCallOngoing, setIsCallOngoing] = useState(false);

//   useEffect(() => {
//     if (!callId) return;

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.accepted) {
//         setCallStatus("En cours d'appel");
//         setIsCallOngoing(true);
//         updateCallStatus(callId, "accepted");
//         stopSound();
//       } else if (callData?.rejected || callData?.status === "ended") {
//         setCallStatus("Appel terminé ou rejeté");
//         updateCallStatus(callId, "ended");
//         handleEndCall();
//       }
//     });

//     playSound("ringtone_incoming");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, updateCallStatus]);

//   const handleAccept = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { accepted: true });
//       updateCallStatus(callId, "accepted");
//       setCallStatus("En cours d'appel");
//       setIsCallOngoing(true);
//     } catch (error) {
//       console.error("Erreur lors de l'acceptation de l'appel :", error);
//     }
//   };

//   const handleReject = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { rejected: true });
//       updateCallStatus(callId, "rejected");
//       setCallStatus("Appel rejeté");
//       if (onEndCall) onEndCall();
//     } catch (error) {
//       console.error("Erreur lors du rejet de l'appel :", error);
//     }
//   };

//   const handleEndCall = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { status: "ended" });
//       updateCallStatus(callId, "ended");
//       setCallStatus("Appel terminé");
//       stopSound();
//       if (onEndCall) onEndCall();
//     } catch (error) {
//       console.error("Erreur lors de la fin de l'appel :", error);
//     }
//   };

//   return (
//     <div
//       className={`call-interface ${
//         callType === "video" ? "video-call" : "audio-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>
//       {!isCallOngoing && callStatus === "Appel entrant..." && (
//         <div className="buttons">
//           <button className="accept-button" onClick={handleAccept}>
//             Accepter
//           </button>
//           <button className="reject-button" onClick={handleReject}>
//             Rejeter
//           </button>
//         </div>
//       )}
//       {callType === "video" && isCallOngoing && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//       {isCallOngoing && (
//         <button className="end-call-button" onClick={handleEndCall}>
//           Terminer l'appel
//         </button>
//       )}
//     </div>
//   );
// }


// import { useState, useEffect } from "react";
// import { onSnapshot, doc, updateDoc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import { useCallStore } from "../../../../lib/useCall";
// import "./respondInterface.css";

// export function ReceiverInterface({ callId, callType, onEndCall }) {
//   const { updateCallStatus } = useCallStore();
//   const [callStatus, setCallStatus] = useState("Appel entrant...");
//   const [isCallOngoing, setIsCallOngoing] = useState(false);
//   const { playSound, stopSound } = useCallStore();

//   useEffect(() => {
//     if (!callId) return;

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.accepted) {
//         setCallStatus("En cours d'appel");
//         setIsCallOngoing(true);
//         updateCallStatus(callId, "accepted");
//         stopSound();
//       } else if (callData?.rejected || callData?.status === "ended") {
//         setCallStatus("Appel terminé ou rejeté");
//         updateCallStatus(callId, "ended");
//         handleEndCall();
//       }
//     });

//     playSound("ringtone_incoming");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, updateCallStatus]);

//   const handleAccept = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { accepted: true });
//       updateCallStatus(callId, "accepted");
//       setCallStatus("En cours d'appel");
//       setIsCallOngoing(true);
//     } catch (error) {
//       console.error("Erreur lors de l'acceptation de l'appel :", error);
//     }
//   };

//   const handleReject = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { rejected: true });
//       updateCallStatus(callId, "rejected");
//       setCallStatus("Appel rejeté");
//       if (onEndCall) onEndCall();
//     } catch (error) {
//       console.error("Erreur lors du rejet de l'appel :", error);
//     }
//   };

//   const handleEndCall = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { status: "ended" });
//       updateCallStatus(callId, "ended");
//       setCallStatus("Appel terminé");
//       stopSound();
//       if (onEndCall) onEndCall();
//     } catch (error) {
//       console.error("Erreur lors de la fin de l'appel :", error);
//     }
//   };

//   return (
//     <div
//       className={`call-interface ${
//         callType === "video" ? "video-call" : "audio-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>
//       {!isCallOngoing && callStatus === "Appel entrant..." && (
//         <div className="buttons">
//           <button className="accept-button" onClick={handleAccept}>
//             Accepter
//           </button>
//           <button className="reject-button" onClick={handleReject}>
//             Rejeter
//           </button>
//         </div>
//       )}
//       {callType === "video" && isCallOngoing && (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       )}
//       {isCallOngoing && (
//         <button className="end-call-button" onClick={handleEndCall}>
//           Terminer l'appel
//         </button>
//       )}
//     </div>
//   );
// }

// // import { useState, useEffect } from "react";
// // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // import { playSound, stopSound } from "../startcall/StartCall";
// // import { onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import "./respondInterface.css";
// // export function ReceiverInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("Appel entrant...");
// //   const [callerId, setCallerId] = useState(null);
// //   const [isCallOngoing, setIsCallOngoing] = useState(false);

// //   useEffect(() => {
// //     const callDoc = doc(db, "calls", callId);

// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();
// //       setCallerId(callData?.callerId);

// //       if (callData?.accepted) {
// //         setCallStatus("En cours d'appel");
// //         setIsCallOngoing(true);
// //         stopSound();
// //       } else if (callData?.rejected || callData?.status === "ended") {
// //         setCallStatus("Appel terminé ou rejeté");
// //         handleEndCall();
// //       }
// //     });

// //     playSound("ringtone_incoming");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId]);

// //   const handleAccept = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { accepted: true });
// //       await answerCall(callId);
// //       setCallStatus("En cours d'appel");
// //       setIsCallOngoing(true);
// //     } catch (error) {
// //       console.error("Erreur lors de l'acceptation de l'appel :", error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       await rejectCall(callId);
// //       setCallStatus("Appel rejeté");
// //       onEndCall(); // Ferme l'interface
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel :", error);
// //     }
// //   };

// //   const handleEndCall = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { status: "ended" });
// //       setCallStatus("Appel terminé");
// //       stopSound();
// //       if (onEndCall) onEndCall(); // Ferme l'interface
// //     } catch (error) {
// //       console.error("Erreur lors de la fin de l'appel :", error);
// //     }
// //   };

// //   return (
// //     <div
// //       className={`call-interface ${
// //         callType === "video" ? "video-call" : "audio-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>

// //       {/* Boutons pour l'appel entrant */}
// //       {!isCallOngoing && callStatus === "Appel entrant..." && (
// //         <div className="buttons">
// //           <button className="accept-button" onClick={handleAccept}>
// //             Accepter
// //           </button>
// //           <button className="reject-button" onClick={handleReject}>
// //             Rejeter
// //           </button>
// //         </div>
// //       )}

// //       {/* Interface vidéo */}
// //       {callType === "video" && isCallOngoing && (
// //         <div className="video-container">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       )}

// //       {/* Bouton de fin d'appel pour les deux types d'appels */}
// //       {isCallOngoing && (
// //         <button className="end-call-button" onClick={handleEndCall}>
// //           Terminer l'appel
// //         </button>
// //       )}
// //     </div>
// //   );
// // }
// // // //
// // // import { useState, useEffect } from "react";
// // // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // // import { playSound, stopSound } from "../startcall/StartCall";
// // // import { onSnapshot, doc, setDoc } from "firebase/firestore";
// // // import { db } from "../../../../lib/firebase";
// // // import "./respondInterface.css";

// // // export function ReceiverInterface({ callId, callType, onEndCall }) {
// // //   const [callStatus, setCallStatus] = useState("Appel entrant...");
// // //   const [callerId, setCallerId] = useState(null);

// // //   useEffect(() => {
// // //     const callDoc = doc(db, "calls", callId);
// // // //
// // //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// // //       const callData = snapshot.data();
// // //       setCallerId(callData?.callerId);

// // //       if (callData?.accepted) {
// // //         setCallStatus("En cours d'appel");
// // //         stopSound();
// // //       } else if (callData?.rejected || callData?.status === "ended") {
// // //         setCallStatus("Appel terminé ou rejeté");
// // //         handleEndCall();
// // //       }
// // //     });

// // //     playSound("ringtone_incoming");

// // //     return () => {
// // //       unsubscribe();
// // //       stopSound();
// // //     };
// // //   }, [callId]);

// // //   const handleAccept = async () => {
// // //     try {
// // //       await setDoc(
// // //         doc(db, "calls", callId),
// // //         { accepted: true },
// // //         { merge: true }

// // //       );
// // //       await answerCall(callId);
// // //       setCallStatus("En cours d'appel");
// // //       // if (onEndCall) onEndCall();
// // //     } catch (error) {
// // //       console.error("Erreur lors de l'acceptation de l'appel:", error);
// // //     }
// // //   };

// // //   const handleReject = async () => {
// // //     try {
// // //       await rejectCall(callId);
// // //       setCallStatus("Appel rejeté");
// // //       onEndCall();
// // //     } catch (error) {
// // //       console.error("Erreur lors du rejet de l'appel:", error);
// // //     }
// // //   };

// // //   const handleEndCall = () => {
// // //     setCallStatus("Appel terminé");
// // //     stopSound();
// // //     if (onEndCall) onEndCall();
// // //   };

// // //   return (
// // //     <div
// // //       className={`call-interface ${
// // //         callType === "video" ? "video-call" : "audio-call"
// // //       }`}
// // //     >
// // //       <h2>{callStatus}</h2>
// // //       {callStatus === "Appel entrant..." && (
// // //         <div className="buttons">
// // //           <button className="accept-button" onClick={handleAccept}>
// // //             Accepter
// // //           </button>
// // //           <button className="reject-button" onClick={handleReject}>
// // //             Rejeter
// // //           </button>
// // //         </div>
// // //       )}
// // //       {callType === "video" && (
// // //         <div className="video-container">
// // //           <video id="localVideo" autoPlay playsInline muted></video>
// // //           <video id="remoteVideo" autoPlay playsInline></video>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }
// // import { useState, useEffect } from "react";
// // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // import { playSound, stopSound } from "../startcall/StartCall";
// // import { onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import "./respondInterface.css";

// // export function ReceiverInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("Appel entrant...");
// //   const [callerId, setCallerId] = useState(null);
// //   const [isCallOngoing, setIsCallOngoing] = useState(false);

// //   useEffect(() => {
// //     const callDoc = doc(db, "calls", callId);

// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();
// //       setCallerId(callData?.callerId);

// //       if (callData?.accepted) {
// //         setCallStatus("En cours d'appel");
// //         setIsCallOngoing(true);
// //         stopSound();
// //       } else if (callData?.rejected || callData?.status === "ended") {
// //         setCallStatus("Appel terminé ou rejeté");
// //         handleEndCall();
// //       }
// //     });

// //     playSound("ringtone_incoming");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId]);

// //   const handleAccept = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { accepted: true });
// //       await answerCall(callId);
// //       setCallStatus("En cours d'appel");
// //       setIsCallOngoing(true);
// //     } catch (error) {
// //       console.error("Erreur lors de l'acceptation de l'appel :", error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       await rejectCall(callId);
// //       setCallStatus("Appel rejeté");
// //       onEndCall(); // Ferme l'interface
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel :", error);
// //     }
// //   };

// //   const handleEndCall = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { status: "ended" });
// //       setCallStatus("Appel terminé");
// //       stopSound();
// //       if (onEndCall) onEndCall(); // Ferme l'interface
// //     } catch (error) {
// //       console.error("Erreur lors de la fin de l'appel :", error);
// //     }
// //   };

// //   return (
// //     <div
// //       className={`call-interface ${
// //         callType === "video" ? "video-call" : "audio-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>

// //       {/* Boutons pour l'appel entrant */}
// //       {!isCallOngoing && callStatus === "Appel entrant..." && (
// //         <div className="buttons">
// //           <button className="accept-button" onClick={handleAccept}>
// //             Accepter
// //           </button>
// //           <button className="reject-button" onClick={handleReject}>
// //             Rejeter
// //           </button>
// //         </div>
// //       )}

// //       {/* Interface vidéo */}
// //       {callType === "video" && isCallOngoing && (
// //         <div className="video-container">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       )}

// //       {/* Bouton de fin d'appel pour les deux types d'appels */}
// //       {isCallOngoing && (
// //         <button className="end-call-button" onClick={handleEndCall}>
// //           Terminer l'appel
// //         </button>
// //       )}
// //     </div>
// //   );
// // }
// // export default ReceiverInterface;
// // //
// // import { useState, useEffect } from "react";
// // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // import { playSound, stopSound } from "../startcall/StartCall";
// // import { onSnapshot, doc, setDoc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import "./respondInterface.css";

// // export function ReceiverInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("Appel entrant...");
// //   const [callerId, setCallerId] = useState(null);

// //   useEffect(() => {
// //     const callDoc = doc(db, "calls", callId);
// // //
// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();
// //       setCallerId(callData?.callerId);

// //       if (callData?.accepted) {
// //         setCallStatus("En cours d'appel");
// //         stopSound();
// //       } else if (callData?.rejected || callData?.status === "ended") {
// //         setCallStatus("Appel terminé ou rejeté");
// //         handleEndCall();
// //       }
// //     });

// //     playSound("ringtone_incoming");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId]);

// //   const handleAccept = async () => {
// //     try {
// //       await setDoc(
// //         doc(db, "calls", callId),
// //         { accepted: true },
// //         { merge: true }

// //       );
// //       await answerCall(callId);
// //       setCallStatus("En cours d'appel");
// //       // if (onEndCall) onEndCall();
// //     } catch (error) {
// //       console.error("Erreur lors de l'acceptation de l'appel:", error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       await rejectCall(callId);
// //       setCallStatus("Appel rejeté");
// //       onEndCall();
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel:", error);
// //     }
// //   };

// //   const handleEndCall = () => {
// //     setCallStatus("Appel terminé");
// //     stopSound();
// //     if (onEndCall) onEndCall();
// //   };

// //   return (
// //     <div
// //       className={`call-interface ${
// //         callType === "video" ? "video-call" : "audio-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>
// //       {callStatus === "Appel entrant..." && (
// //         <div className="buttons">
// //           <button className="accept-button" onClick={handleAccept}>
// //             Accepter
// //           </button>
// //           <button className="reject-button" onClick={handleReject}>
// //             Rejeter
// //           </button>
// //         </div>
// //       )}
// //       {callType === "video" && (
// //         <div className="video-container">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // import { useState, useEffect } from "react";
// // import { answerCall, rejectCall } from "../respondcall/RespondCall";
// // import { playSound, stopSound } from "../startcall/StartCall";
// // import { onSnapshot, doc, updateDoc } from "firebase/firestore";
// // import { db } from "../../../../lib/firebase";
// // import "./respondInterface.css";

// // export function ReceiverInterface({ callId, callType, onEndCall }) {
// //   const [callStatus, setCallStatus] = useState("Appel entrant...");
// //   const [callerId, setCallerId] = useState(null);
// //   const [isCallOngoing, setIsCallOngoing] = useState(false);

// //   useEffect(() => {
// //     const callDoc = doc(db, "calls", callId);

// //     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
// //       const callData = snapshot.data();
// //       setCallerId(callData?.callerId);

// //       if (callData?.accepted) {
// //         setCallStatus("En cours d'appel");
// //         setIsCallOngoing(true);
// //         stopSound();
// //       } else if (callData?.rejected || callData?.status === "ended") {
// //         setCallStatus("Appel terminé ou rejeté");
// //         handleEndCall();
// //       }
// //     });

// //     playSound("ringtone_incoming");

// //     return () => {
// //       unsubscribe();
// //       stopSound();
// //     };
// //   }, [callId]);

// //   const handleAccept = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { accepted: true });
// //       await answerCall(callId);
// //       setCallStatus("En cours d'appel");
// //       setIsCallOngoing(true);
// //     } catch (error) {
// //       console.error("Erreur lors de l'acceptation de l'appel :", error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { rejected: true });
// //       setCallStatus("Appel rejeté");
// //       onEndCall();
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel :", error);
// //     }
// //   };

// //   const handleEndCall = async () => {
// //     try {
// //       await updateDoc(doc(db, "calls", callId), { status: "ended" });
// //       setCallStatus("Appel terminé");
// //       stopSound();
// //       if (onEndCall) onEndCall();
// //     } catch (error) {
// //       console.error("Erreur lors de la fin de l'appel :", error);
// //     }
// //   };

// //   return (
// //     <div
// //       className={`call-interface ${
// //         callType === "video" ? "video-call" : "audio-call"
// //       }`}
// //     >
// //       <h2>{callStatus}</h2>
// //       {!isCallOngoing && callStatus === "Appel entrant..." && (
// //         <div className="buttons">
// //           <button className="accept-button" onClick={handleAccept}>
// //             Accepter
// //           </button>
// //           <button className="reject-button" onClick={handleReject}>
// //             Rejeter
// //           </button>
// //         </div>
// //       )}
// //       {callType === "video" && isCallOngoing && (
// //         <div className="video-container">
// //           <video id="localVideo" autoPlay playsInline muted></video>
// //           <video id="remoteVideo" autoPlay playsInline></video>
// //         </div>
// //       )}
// //       {isCallOngoing && (
// //         <button className="end-call-button" onClick={handleEndCall}>
// //           Terminer l'appel
// //         </button>
// //       )}
// //     </div>
// //   );
// // }

/* .call-interface {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  margin: 20px auto;
}

h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 10px;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.accept-button,
.reject-button,
.end-call-button {
  padding: 10px 20px;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.accept-button {
  background-color: #4caf50;
  color: #fff;
}

.accept-button:hover {
  background-color: #45a049;
}

.reject-button {
  background-color: #f44336;
  color: #fff;
}

.reject-button:hover {
  background-color: #e53935;
}

.end-call-button {
  background-color: #2196f3;
  color: #fff;
  margin-top: 20px;
}

.end-call-button:hover {
  background-color: #1e88e5;
}

.video-container {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  width: 100%;
}

video {
  width: 100%;
  max-width: 240px;
  border-radius: 12px;
  background: #000;
}

.audio-call {
  padding: 30px 20px;
}

.error-message {
  color: #d32f2f;
  background: #fdecea;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
}

@media (max-width: 600px) {
  .call-interface {
    padding: 15px;
    max-width: 90%;
  }

  .buttons button {
    font-size: 0.9rem;
    padding: 8px 16px;
  }

  video {
    max-width: 100%;
  }
}





/* .call-interface {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: #f3f4f6;
  color: #333;
  font-family: Arial, sans-serif;
}

.call-interface h2 {
  font-size: 1.5em;
  margin-bottom: 20px;
  color: #444;
}

.buttons {
  display: flex;
  gap: 20px;
}

.buttons button {
  padding: 10px 20px;
  font-size: 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.buttons button:hover {
  opacity: 0.9;
}

.buttons button:active {
  transform: scale(0.98);
}

.buttons button:first-child {
  background-color: #4caf50; 
  color: white;
}

.buttons button:first-child:hover {
  background-color: #45a049;
}

.buttons button:last-child {
  background-color: #e53935; 
  color: white;
}

.buttons button:last-child:hover {
  background-color: #d32f2f;
}

.video-call {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.video-call video {
  width: 45%;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.audio-call {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.audio-call-info {
  padding: 20px;
  background-color: #f1f8e9;
  border: 1px solid #c8e6c9;
  border-radius: 10px;
  color: #388e3c;
  font-size: 1.2em;
}

.audio-call-info p {
  margin: 0;
} */ */
const handleStartCall = async (type) => {
    setIsInitiatingCall(true);
    setCallType(type);
    const callData = {
      callerId: currentUser.id,
      receiverId: user.id,
      status: "calling",
      type,
      timestamp: serverTimestamp(),
    };
    const newCallRef = await addDoc(collection(db, "calls"), callData);

  initializeCall("call123", false, "callerId123", "receiverId456")
    .then(() => console.log("Appel démarré"))
    .catch((error) => {
      console.error("Erreur :", error);
      resetCallState();
    });
};
    setCallId(newCallRef.id);
    setOutgoingCall(callData);
  };

  // const handleStartCall = async ({
  //   callId,
  //   isVideoCall = false,
  //   callerId,
  //   callerName,
  //   receiverId,
  //   receiverName,
  //   type = "audio", // "audio" ou "video"
  //   timestamp = serverTimestamp(),
  // }) => {
    

  //   try {
  //     // Étape 1 : Créer une entrée d'appel dans Firestore
  //     const callData = {
  //       callId: callId || null,
  //       isVideoCall,
  //       callerId,
  //       callerName,
  //       receiverId,
  //       receiverName,
  //       status: "calling",
  //       type,
  //       timestamp,
  //     };

  //     const newCallRef = await addDoc(collection(db, "calls"), callData);
  //     const generatedCallId = newCallRef.id; // Récupérer l'ID généré

  //     // Mettre à jour les données locales avec l'ID d'appel
  //     setCallData({
  //       ...callData,
  //       callId: generatedCallId,
  //     });

  //     // Étape 2 : Initialiser l'appel
  //     await initializeCall(generatedCallId, isVideoCall, callerId, receiverId);

  //     // Étape 3 : Jouer la sonnerie d'appel
  //     playSound("apemis", true); // Boucle la sonnerie

  //     console.log(
  //       "Appel initialisé avec succès ! ID d'appel :",
  //       generatedCallId
  //     );
  //   } catch (error) {
  //     console.error("Erreur lors de l'initialisation de l'appel :", error);

  //     // Réinitialiser l'état et arrêter les sons en cas d'échec
  //     resetCallState();
  //   }
  // };

  // const handleStartCall = () => {
  //   initializeCall("call123", false, "callerId123", "receiverId456")
  //     .then(() => console.log("Appel démarré"))
  //     .catch((error) => {
  //       console.error("Erreur :", error);
  //       resetCallState();
  //     });
  // };

  // const handleStartCall = async ({
  //   callId,
  //   isVideoCall,
  //   callerId,
  //   callerName,
  //   receiverId,
  //   receiverName,
  //   timestamp,
  // }) => {
  //   const {
  //     initializeCall,
  //     playSound,
  //     stopSound,
  //     resetCallState,
  //     updateCallStatus,
  //   } = useCallStore.getState();

  //   const { setCallData } = useCallData.getState();

  //   try {
  //     // Préparer l'appel
  //     await initializeCall(callId, isVideoCall, callerId, receiverId);

  //     // Configurer les données d'appel dans useCallData
  //     setCallData({
  //       callId,
  //       isVideoCall,
  //       callerId,
  //       callerName,
  //       receiverId,
  //       receiverName,
  //       timestamp,
  //       status: "calling",
  //     });

  //     // Jouer une sonnerie pour le début de l'appel
  //     // playSound("apemis", true); // Son de départ

  //     console.log("Appel initialisé avec succès !");
  //   } catch (error) {
  //     console.error("Erreur lors de l'initialisation de l'appel :", error);

  //     // Réinitialiser l'état en cas d'échec
  //     resetCallState();

  //     // Arrêter tout son éventuel
  //     // stopSound();
  //   }
  // };

  // const handleStartCall = async (type) => {
  //   try {
  //     if (!user || !user.id) {
  //       console.error("Aucun utilisateur cible défini pour l'appel.");
  //       return;
  //     }

  //     const callDocRef = doc(collection(db, "calls"));
  //     const callData = {
  //       id: callDocRef.id,
  //       callerId: currentUser.id,
  //       receiverId: user.id,
  //       type,
  //       status: "calling",
  //       createdAt: serverTimestamp(),
  //     };

  //     await setDoc(callDocRef, callData);

  //     setCallId(callDocRef.id);
  //     setIsInitiatingCall(true);
  //     setCallType(type);
  //     setOutgoingCall(callData);
  //   } catch (error) {
  //     console.error("Erreur lors de l'initialisation de l'appel :", error);
  //   }
  // };


// import create from "zustand";
// import { persist } from "zustand/middleware";
// import { devtools } from "zustand/middleware";
// import { doc, getDoc, collection } from "firebase/firestore";
// import { db } from "./firebase";

// // Import des sons
// // import apemisSound from "./apemis.mp3";
// // import apfinisSound from ".//apfinis.mp3";
// // import ringtoneSound from "./ringtone.mp3";

// export const useCallStore = create(
//   devtools(
//     persist(
//       (set) => ({
//         // État initial de l'appel
//         callState: {
//           isCalling: false,
//           isRinging: false,
//           isInCall: false,
//           isVideoCall: false,
//           callId: null,
//           localStream: null,
//           remoteStream: null,
//           error: null,
//           callerId: null,
//           receiverId: null,
//           currentSound: null,
//           timeoutId: null,
//         },

//         // Vérifier la disponibilité du destinataire

//         checkReceiverAvailability: async (receiverId) => {
//           // Référence au document de l'utilisateur
//           const receiverDocRef = doc(collection(db, "users"), receiverId); // db est votre instance Firestore

//           // Récupérer les données du document
//           const receiverDoc = await getDoc(receiverDocRef);

//           // Vérifier si le document existe et si l'utilisateur est en ligne
//           if (receiverDoc.exists() && receiverDoc.data().isOnline) {
//             return true;
//           }
//           return false;
//         },

//         // Préparer le flux média
//         prepareMediaStream: async (isVideo) => {
//           try {
//             const constraints = {
//               audio: true,
//               video: isVideo,
//             };
//             const stream = await navigator.mediaDevices.getUserMedia(
//               constraints
//             );
//             return stream;
//           } catch (error) {
//             console.error("Erreur lors de l'accès au média :", error);
//             throw new Error(
//               "Impossible d'accéder à la caméra ou au microphone."
//             );
//           }
//         },

//         // Initialiser un appel
//         initializeCall: async (callId, isVideo, callerId, receiverId) => {
//           set((state) => {
//             if (!callId || !callerId || !receiverId) {
//               console.error("Paramètres de l'appel manquants !");
//               return {
//                 callState: {
//                   ...state.callState,
//                   error: "Paramètres manquants pour l'appel.",
//                 },
//               };
//             }
//             return {
//               callState: { ...state.callState, isCalling: true, error: null },
//             };
//           });

//           try {
//             // Vérification du destinataire
//             const isReceiverAvailable = await checkReceiverAvailability(
//               receiverId
//             );
//             if (!isReceiverAvailable) {
//               throw new Error("Le destinataire est indisponible.");
//             }

//             // Préparation des flux média
//             const localStream = await prepareMediaStream(isVideo);
//             set((state) => ({
//               callState: { ...state.callState, localStream },
//             }));

//             // Mise à jour de l'état
//             set((state) => ({
//               callState: {
//                 ...state.callState,
//                 isCalling: true,
//                 isVideoCall: isVideo,
//                 callId,
//                 callerId,
//                 receiverId,
//               },
//             }));

//             // Lecture du son d'appel
//             state.playSound("apemis", true);

//             console.log("Appel initialisé avec succès !");
//           } catch (error) {
//             console.error(
//               "Erreur lors de l'initialisation de l'appel :",
//               error.message
//             );
//             set((state) => ({
//               callState: {
//                 ...state.callState,
//                 isCalling: false,
//                 error: error.message,
//               },
//             }));
//           }
//         },

//         // Mettre à jour l'état de l'appel
//         updateCallStatus: (status) =>
//           set((state) => ({
//             callState: { ...state.callState, ...status },
//           })),

//         // Réinitialiser l'état de l'appel
//         resetCallState: () =>
//           set((state) => {
//             const { currentSound } = state.callState;
//             if (currentSound) {
//               currentSound.pause();
//               currentSound.currentTime = 0;
//             }
//             return {
//               callState: {
//                 isCalling: false,
//                 isRinging: false,
//                 isInCall: false,
//                 isVideoCall: false,
//                 callId: null,
//                 localStream: null,
//                 remoteStream: null,
//                 error: null,
//                 callerId: null,
//                 receiverId: null,
//                 currentSound: null,
//                 timeoutId: null,
//               },
//             };
//           }),

//         // Définir le flux local
//         setLocalStream: (stream) =>
//           set((state) => ({
//             callState: { ...state.callState, localStream: stream },
//           })),

//         // Définir le flux distant
//         setRemoteStream: (stream) =>
//           set((state) => ({
//             callState: { ...state.callState, remoteStream: stream },
//           })),

//         // Lire un son
//         playSound: (type, loop = false) =>
//           set((state) => {
//             try {
//               const sounds = {
//                 apemis: new Audio("apemis"),
//                 apfinis: new Audio("apfinis"),
//                 ringtone: new Audio("ringtone"),
//               };

//               const currentSound = sounds[type];
//               if (state.callState.currentSound) {
//                 state.callState.currentSound.pause();
//                 state.callState.currentSound.currentTime = 0;
//               }

//               if (currentSound) {
//                 currentSound.loop = loop;
//                 currentSound
//                   .play()
//                   .then(() => console.log(`${type} sound playing`))
//                   .catch((err) =>
//                     console.error(`Error playing ${type} sound:`, err.message)
//                   );
//               }

//               return {
//                 callState: { ...state.callState, currentSound },
//               };
//             } catch (error) {
//               console.error("Erreur lors de la lecture du son :", error);
//             }
//           }),

//         // Arrêter le son en cours
//         stopSound: () =>
//           set((state) => {
//             const { currentSound } = state.callState;
//             if (currentSound) {
//               try {
//                 currentSound.pause();
//                 currentSound.currentTime = 0;
//               } catch (error) {
//                 console.error("Erreur lors de l'arrêt du son :", error);
//               }
//             }
//             return {
//               callState: { ...state.callState, currentSound: null },
//             };
//           }),
//       }),
//       {
//         name: "call-store", // Nom pour la persistance
//         partialize: (state) => ({
//           isCalling: state.callState.isCalling,
//           isRinging: state.callState.isRinging,
//           isInCall: state.callState.isInCall,
//           isVideoCall: state.callState.isVideoCall,
//           callId: state.callState.callId,
//           callerId: state.callState.callerId,
//           receiverId: state.callState.receiverId,
//         }),
//       }
//     )
//   )
// );

// import { useState, useEffect } from "react";
// import {
//   doc,
//   setDoc,
//   deleteDoc,
//   collection,
//   onSnapshot,
//   getDoc,
// } from "firebase/firestore";
// import { db } from "./firebase";
// import { useCallStore } from "./useCall";

// const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// export function useCallData() {
//   const {
//     updateCallStatus,
//     setLocalStream,
//     setRemoteStream,
//     resetCallState,
//     playSound,
//     stopSound,
//     setCallTimeout,
//   } = useCallStore.getState();

//   const [peerConnection, setPeerConnection] = useState(null);

//   useEffect(() => {
//     return () => {
//       cleanupCall();
//     };
//   }, []);

//   // Fonction pour démarrer un appel
//   const startCall = async (callId, isVideo = false, receiverId) => {
//     try {
//       const newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
//       setPeerConnection(newPeerConnection);

//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: isVideo,
//         audio: true,
//       });

//       // Ajouter les pistes locales au PeerConnection
//       localStream.getTracks().forEach((track) => {
//         newPeerConnection.addTrack(track, localStream);
//       });
//       setLocalStream(localStream);

//       // Gestion des flux distants
//       newPeerConnection.ontrack = (event) => {
//         const remoteStream = new MediaStream();
//         event.streams[0]
//           .getTracks()
//           .forEach((track) => remoteStream.addTrack(track));
//         setRemoteStream(remoteStream);
//       };

//       // Gestion des candidats ICE
//       newPeerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           const candidateRef = doc(
//             collection(doc(db, "calls", callId), "callerCandidates")
//           );
//           setDoc(candidateRef, event.candidate.toJSON());
//         }
//       };

//       // Créer une offre et la stocker dans Firestore
//       const offerDescription = await newPeerConnection.createOffer();
//       await newPeerConnection.setLocalDescription(offerDescription);

//       await setDoc(doc(db, "calls", callId), {
//         callerId: useCallStore.getState().callState.callerId,
//         receiverId,
//         type: isVideo ? "video" : "audio",
//         offer: {
//           type: offerDescription.type,
//           sdp: offerDescription.sdp,
//         },
//         status: "calling",
//         createdAt: new Date(),
//       });

//       playSound("apemis", true); // Sonnerie sortante
//       updateCallStatus({ isCalling: true });

//       // Timeout en cas de non-réponse
//       const timeoutId = setTimeout(() => {
//         cleanupCall(newPeerConnection);
//         updateCallStatus({ isCalling: false, isInCall: false });
//         playSound("apfinis"); // Fin de l'appel
//       }, 30000); // 30 secondes

//       setCallTimeout(timeoutId);
//     } catch (error) {
//       console.error("Erreur lors du démarrage de l'appel :", error);
//       resetCallState();
//     }
//   };

//   // Fonction pour répondre à un appel
//   const answerCall = async (callId) => {
//     try {
//       const callDoc = doc(db, "calls", callId);
//       const callData = (await getDoc(callDoc)).data();

//       if (!callData?.offer) {
//         console.warn("Aucune offre trouvée pour cet appel.");
//         playSound("error");
//         updateCallStatus("error");
//         return;
//       }

//       const newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
//       setPeerConnection(newPeerConnection);

//       // Gestion des flux distants
//       newPeerConnection.ontrack = (event) => {
//         const remoteStream = new MediaStream();
//         event.streams[0]
//           .getTracks()
//           .forEach((track) => remoteStream.addTrack(track));
//         setRemoteStream(remoteStream);
//       };

//       // Gestion des candidats ICE
//       newPeerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           const candidateRef = doc(
//             collection(doc(db, "calls", callId), "receiverCandidates")
//           );
//           setDoc(candidateRef, event.candidate.toJSON());
//         }
//       };

//       // Appliquer l'offre reçue et créer une réponse
//       await newPeerConnection.setRemoteDescription(
//         new RTCSessionDescription(callData.offer)
//       );

//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: callData.type === "video",
//         audio: true,
//       });

//       localStream.getTracks().forEach((track) => {
//         newPeerConnection.addTrack(track, localStream);
//       });
//       setLocalStream(localStream);

//       const answerDescription = await newPeerConnection.createAnswer();
//       await newPeerConnection.setLocalDescription(answerDescription);

//       await setDoc(
//         callDoc,
//         {
//           answer: {
//             type: answerDescription.type,
//             sdp: answerDescription.sdp,
//           },
//           status: "connected",
//         },
//         { merge: true }
//       );

//       updateCallStatus({ isInCall: true });
//       stopSound(); // Arrêter la sonnerie

//       // Écouter les événements de fin d'appel
//       onSnapshot(callDoc, (snapshot) => {
//         const data = snapshot.data();
//         if (data?.status === "ended") {
//           endCall(callId);
//         }
//       });
//     } catch (error) {
//       console.error("Erreur lors de la réponse à l'appel :", error);
//       resetCallState();
//     }
//   };

//   // Fonction pour rejeter un appel
//   const rejectCall = async (callId) => {
//     try {
//       const callDoc = doc(db, "calls", callId);
//       await setDoc(
//         callDoc,
//         { rejected: true, status: "rejected" },
//         { merge: true }
//       );

//       playSound("call_rejected");
//       cleanupCall();
//       resetCallState();
//     } catch (error) {
//       console.error("Erreur lors du rejet de l'appel :", error);
//     }
//   };

//   // Fonction pour terminer un appel
//   const endCall = async (callId) => {
//     try {
//       cleanupCall();
//       await deleteDoc(doc(db, "calls", callId));
//     } catch (error) {
//       console.error("Erreur lors de la fin de l'appel :", error);
//     }
//   };

//   // Nettoyer les ressources
//   const cleanupCall = () => {
//     const { localStream, remoteStream } = useCallStore.getState();

//     if (peerConnection) {
//       peerConnection.close();
//       setPeerConnection(null);
//     }

//     localStream?.getTracks().forEach((track) => track.stop());
//     remoteStream?.getTracks().forEach((track) => track.stop());

//     stopSound();
//     resetCallState();
//   };

//   // Écouter les candidats ICE
//   const listenForICECandidates = (callId, candidateType) => {
//     const callDoc = doc(db, "calls", callId);
//     const candidatesCollection = collection(callDoc, candidateType);

//     onSnapshot(candidatesCollection, (snapshot) => {
//       snapshot.docChanges().forEach((change) => {
//         if (change.type === "added") {
//           const candidateData = change.doc.data();
//           peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
//         }
//       });
//     });
//   };

//   return {
//     startCall,
//     answerCall,
//     rejectCall,
//     endCall,
//   };
// }

// import { useState, useEffect } from "react";
// import {
//   doc,
//   setDoc,
//   deleteDoc,
//   collection,
//   onSnapshot,
//   getDoc,
// } from "firebase/firestore";
// import { db } from "./firebase";
// import { useCallStore } from "./useCall";

// const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// export function useCallData() {
//   const {
//     updateCallStatus,
//     setLocalStream,
//     setRemoteStream,
//     resetCallState,
//     playSound,
//     stopSound,
//     setCallTimeout,
//   } = useCallStore.getState();

//   const [peerConnection, setPeerConnection] = useState(null);

//   useEffect(() => {
//     return () => {
//       cleanupCall();
//     };
//   });

//   const startCall = async (callId, isVideo = false, receiverId) => {
//     try {
//       let newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
//       setPeerConnection(newPeerConnection);

//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: isVideo,
//         audio: true,
//       });

//       localStream
//         .getTracks()
//         .forEach((track) => newPeerConnection.addTrack(track, localStream));
//       setLocalStream(localStream);

//       newPeerConnection.ontrack = (event) => {
//         const remoteStream = new MediaStream();
//         event.streams[0]
//           .getTracks()
//           .forEach((track) => remoteStream.addTrack(track));
//         setRemoteStream(remoteStream);
//       };

//       newPeerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           const candidateRef = doc(
//             collection(doc(db, "calls", callId), "callerCandidates")
//           );
//           setDoc(candidateRef, event.candidate.toJSON());
//         }
//       };

//       await setDoc(doc(db, "calls", callId), {
//         callerId: useCallStore.getState().callState.callerId,
//         receiverId,
//         type: isVideo ? "video" : "audio",
//         status: "calling",
//         createdAt: new Date(),
//       });

//       playSound("apemis", true); // Outgoing ringtone
//       updateCallStatus({ isCalling: true });

//       const timeoutId = setTimeout(() => {
//         cleanupCall(newPeerConnection);
//         updateCallStatus({ isCalling: false, isInCall: false });
//         playSound("apfinis"); // End call sound
//       }, 30000); // 30 seconds

//       setCallTimeout(timeoutId);
//     } catch (error) {
//       console.error("Error starting the call:", error);
//       resetCallState();
//     }
//   };

//   const answerCall = async (callId) => {
//     try {
//       const callDoc = doc(db, "calls", callId);
//       const callData = (await getDoc(callDoc)).data();

//       if (!callData?.offer) {
//         console.warn("Aucune offre trouvée pour cet appel.");
//         playSound("error");
//         updateCallStatus("error");
//         return;
//       }

//       playSound("call_connecting");

//       await startCall(callId, false);

//       await peerConnection.setRemoteDescription(
//         new RTCSessionDescription(callData.offer)
//       );

//       const answerDescription = await peerConnection.createAnswer();
//       await peerConnection.setLocalDescription(answerDescription);

//       await setDoc(
//         callDoc,
//         {
//           answer: { type: answerDescription.type, sdp: answerDescription.sdp },
//         },
//         { merge: true }
//       );

//       listenForICECandidates(callId, "callerCandidates");

//       updateCallStatus("accepted");
//       setLocalStream(peerConnection.localStream);
//       setRemoteStream(peerConnection.remoteStream);
//       stopSound();

//       onSnapshot(callDoc, (snapshot) => {
//         const data = snapshot.data();
//         if (data?.status === "ended") {
//           endCall(callId);
//           playSound("call_ended");
//           updateCallStatus("ended");
//         }
//       });

//       console.log("Appel accepté.");
//     } catch (error) {
//       console.error("Erreur lors de la réponse à l'appel:", error);
//       playSound("error");
//       updateCallStatus("error");
//     }
//   };

//   const rejectCall = async (callId) => {
//     try {
//       const callDoc = doc(db, "calls", callId);
//       await setDoc(
//         callDoc,
//         { rejected: true, status: "rejected" },
//         { merge: true }
//       );

//       playSound("call_rejected");

//       cleanupCall();
//       resetCallState();
//       stopSound();
//       console.log("Appel rejeté.");

//       updateCallStatus("rejected");
//     } catch (error) {
//       console.error("Erreur lors du rejet de l'appel:", error);
//       playSound("error");
//       updateCallStatus("error");
//     }
//   };

//   const endCall = async (callId) => {
//     try {
//       cleanupCall();
//       await deleteDoc(doc(db, "calls", callId));
//       stopSound();
//     } catch (error) {
//       console.error("Error ending the call:", error);
//     }
//   };

//   const cleanupCall = () => {
//     const { localStream, remoteStream } = useCallStore.getState();

//     if (peerConnection) {
//       peerConnection.close();
//       setPeerConnection(null);
//     }

//     localStream?.getTracks().forEach((track) => track.stop());
//     remoteStream?.getTracks().forEach((track) => track.stop());

//     stopSound();
//     resetCallState();
//   };

//   const listenForICECandidates = (callId, candidateType) => {
//     const callDoc = doc(db, "calls", callId);
//     const candidatesCollection = collection(callDoc, candidateType);

//     onSnapshot(candidatesCollection, (snapshot) => {
//       snapshot.docChanges().forEach((change) => {
//         if (change.type === "added") {
//           const candidateData = change.doc.data();
//           peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
//         }
//       });
//     });
//   };

//   return {
//     startCall,
//     answerCall,
//     rejectCall,
//     endCall,
//     listenForICECandidates,
//   };
// }

  // const handleStartCall = async (type) => {
  //   if (!user || !currentUser || !chatId) {
  //     console.error("Missing required data for initiating a call");
  //     return;
  //   }

  //   try {
  //     // État d'initialisation de l'appel
  //     setIsInitiatingCall(true);
  //     setCallType(type); // "audio" ou "video"

  //     // Création d'un identifiant unique pour l'appel
  //     const newCallId = uuidv4();

  //     // Données de l'appel
  //     const callData = {
  //       callId: newCallId,
  //       chatId: chatId,
  //       callerId: currentUser.id,
  //       receiverId: user.id,
  //       type,
  //       status: "calling", // Statut initial
  //       createdAt: serverTimestamp(),
  //       accepted: false,
  //       rejected: false,
  //     };

  //     // Ajout des données d'appel à Firestore
  //     const callRef = doc(db, "calls", newCallId);
  //     await setDoc(callRef, callData);

  //     // Configuration de l'état local
  //     setCallId(newCallId);
  //     setOutgoingCall(callData);

  //     // Optionnel : Jouer une sonnerie de démarrage

  //     console.log("Call initiated successfully:", callData);
  //   } catch (error) {
  //     console.error("Error initiating call:", error);
  //   } finally {
  //     setIsInitiatingCall(false);
  //   }
  // };

  // const handleEndCall = () => {
  //   resetCallState();
  //   setIsInitiatingCall(false);
  //   setIsReceivingCall(false);
  //   setCallId(null);
  //   setCallType(null);
  //   setCallerId(null);
  //   endCall(); // Assurez-vous de terminer l'appel ici
  // };

  // const handleEndCall = async () => {
  //   if (!callId) return;

  //   try {
  //     const callDoc = doc(db, "calls", callId);
  //     await updateDoc(callDoc, { status: "ended" }).then(() => {
  //       setCallId(null);
  //       setCallType(null);
  //       setIsInitiatingCall(false);
  //       setIsReceivingCall(false);
  //       resetCallState();
  //     });

  //     // setCallStatus(null);
  //   } catch (error) {
  //     console.error("Erreur lors de la fin de l'appel :", error);
  //   }
  // };
    // const acceptCall = async () => {
  //   if (!callId) return;

  //   const callDoc = doc(db, "calls", callId);
  //   try {
  //     await updateDoc(callDoc, { status: "ongoing", accepted: true });
  //   } catch (error) {
  //     console.error("Erreur lors de l'acceptation de l'appel :", error);
  //   }
  // };

// import { useState, useEffect } from "react";
// import { endCall } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import { useCallStore } from "../../../../lib/useCall";
// import "./callerinterface.css";

// export function CallerInterface({ callId, callType, onEndCall }) {
//   const {
//     playSound,
//     stopSound,
//     resetCallState,
//     callStatus: storeCallStatus,
//     updateCallStatus,
//   } = useCallStore();

//   const [callStatus, setCallStatus] = useState(
//     storeCallStatus || "En attente de réponse..."
//   );

//   useEffect(() => {
//     if (!callId) {
//       console.error("callId est null ou undefined.");
//       setCallStatus("Erreur : Identifiant d'appel manquant.");
//       return;
//     }

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (!callData) {
//         console.error("Données d'appel manquantes.");
//         setCallStatus("Erreur : Données d'appel manquantes.");
//         return;
//       }

//       if (callData.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound();
//       } else if (callData.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       } else if (callData.status === "ended") {
//         setCallStatus("Appel terminé");
//         handleEndCall();
//       }

//       updateCallStatus(callData.status || "En attente de réponse...");
//     });

//     playSound("ringtone");

//     return () => {
//       unsubscribe();
//       stopSound();
//     };
//   }, [callId, playSound, stopSound, updateCallStatus]);

//   const handleEndCall = () => {
//     endCall(callId);
//     setCallStatus("Appel terminé");
//     resetCallState();
//     if (onEndCall) onEndCall();
//   };

//   return (
//     <div
//       className={`caller-interface ${
//         callType === "video" ? "video-call" : "audio-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>
//       <button className="end-call-button" onClick={handleEndCall}>
//         Terminer l'appel
//       </button>
//       {callType === "video" ? (
//         <div className="video-container">
//           <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video>
//         </div>
//       ) : (
//         <div className="audio-interface">
//           <p>Appel audio en cours...</p>
//           <div className="caller-profile">
//             <img
//               src="/path-to-caller-profile.jpg"
//               alt="Profil de l'appelant"
//               className="profile-picture"
//             />
//             <p>Nom de l'appelant</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { endCall } from "../startcall/StartCall";
// import { onSnapshot, doc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import { useCallStore } from "../../../../lib/useCall";
// import "./callerinterface.css";

// export function CallerInterface({ callId, callType, onEndCall }) {
//   const {
//     playSound,
//     stopSound,
//     resetCallState,
//     // callStatus: storeCallStatus,
//     updateCallStatus,
//     // callState,
//   } = useCallStore();

//   // const { callActive } = callState;

//   const [callStatus, setCallStatus] = useState("En attente de réponse...");

//   useEffect(() => {
//     if (!callId) {
//       console.error("callId est null ou undefined.");
//       setCallStatus("Erreur : Identifiant d'appel manquant.");
//       return;
//     }

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();
//       console.log("caldata", callData);

//       if (!callData) {
//         console.error("Données d'appel manquantes.");
//         setCallStatus("Erreur : Données d'appel manquantes.");
//         return;
//       }

//       // Mise à jour du statut d'appel en fonction des données Firestore
//       if (callData.accepted) {
//         setCallStatus("Appel accepté");
//         stopSound(); // Arrêter la sonnerie une fois l'appel accepté
//       } else if (callData.rejected) {
//         setCallStatus("Appel rejeté");
//         handleEndCall();
//       } else if (callData.status === "ended") {
//         handleEndCall();
//       } else {
//         setCallStatus("En attente de réponse...");
//       }

//       // Mise à jour de l'état de l'appel dans le store
//       // updateCallStatus(callData.status || "En attente de réponse...");
//     });

//     // Démarrage de la sonnerie lorsque l'appel est en attente
//     playSound("apemis", true);

//     // Clean-up
//     return () => {
//       unsubscribe();
//       stopSound(); // Arrêter la sonnerie à la fin du composant
//     };
//   }, [callId, playSound, stopSound]);

//   const handleEndCall = () => {
//     endCall(callId); // Terminer l'appel côté serveur
//     setCallStatus("Appel terminé");
//     updateCallStatus(callId, "ended");
//     resetCallState(); // Réinitialiser l'état de l'appel dans le store
//     if (onEndCall) onEndCall(); // Callback pour informer du retour dans l'état principal
//   };

//   // if (!callActive) return null;

//   return (
//     <div
//       className={`caller-interface ${
//         callType === "video" ? "video-call" : "audio-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>
//       <button className="end-call-button" onClick={handleEndCall}>
//         Terminer l'appel
//       </button>
//       {callType === "video" ? (
//         <div className="video-container">
//           <video
//             id="localVideo"
//             autoPlay
//             muted
//             style={{ display: isInCall && isVideo? "block" : "none" }}
//           ></video>
//           <video
//             id="remoteVideo"
//             autoPlay
//             style={{ display: isInCall && isVideo ? "block" : "none" }}
//           ></video>

//           {/* <video id="localVideo" autoPlay playsInline muted></video>
//           <video id="remoteVideo" autoPlay playsInline></video> */}
//         </div>
//       ) : (
//         <div className="audio-interface">
//           <p>Appel audio en cours...</p>
//           <div className="caller-profile">
//             <img
//               src="/path-to-caller-profile.jpg"
//               alt="Profil de l'appelant"
//               className="profile-picture"
//             />
//             <p>Nom de l'appelant</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import {
//   doc,
//   setDoc,
//   deleteDoc,
//   collection,
//   onSnapshot,
//   getDoc,
// } from "firebase/firestore";
// import { db } from "./firebase";
// import { useCallStore } from "./useCall";

// const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// export function useCallData() {
//   const {
//     updateCallStatus,
//     setLocalStream,
//     setRemoteStream,
//     resetCallState,
//     playSound,
//     stopSound,
//     callState,
//   } = useCallStore();

//   const [peerConnection, setPeerConnection] = useState(null);

//   // Nettoyage des ressources
//   useEffect(() => {
//     return () => cleanupCall();
//   });

//   const startCall = async (callId, isVideo = false, receiverId) => {
//     try {
//       if (!callId || !receiverId) {
//         throw new Error("callId et receiverId sont requis.");
//       }

//       const pc = new RTCPeerConnection(ICE_SERVERS);
//       setPeerConnection(pc);

//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: isVideo,
//         audio: true,
//       });
//       localStream
//         .getTracks()
//         .forEach((track) => pc.addTrack(track, localStream));
//       setLocalStream(localStream);

//       pc.ontrack = (event) => {
//         const remoteStream = new MediaStream();
//         event.streams[0]
//           .getTracks()
//           .forEach((track) => remoteStream.addTrack(track));
//         setRemoteStream(remoteStream);
//       };

//       pc.onicecandidate = (event) => {
//         if (event.candidate) {
//           const candidateRef = doc(
//             collection(doc(db, "calls", callId), "callerCandidates")
//           );
//           setDoc(candidateRef, event.candidate.toJSON());
//         }
//       };

//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);

//       await setDoc(doc(db, "calls", callId), {
//         callerId: callState.callerId,
//         receiverId,
//         offer: {
//           type: offer.type,
//           sdp: offer.sdp,
//         },
//         type: isVideo ? "video" : "audio",
//         status: "calling",
//         createdAt: new Date(),
//       });

//       playSound("apemis", true);
//       updateCallStatus({ isCalling: true });

//       monitorCallState(callId);
//     } catch (error) {
//       console.error("Erreur lors de l'initiation de l'appel :", error);
//       resetCallState();
//     }
//   };

//   const answerCall = async (callId) => {
//     try {
//       const callDoc = doc(db, "calls", callId);
//       const callData = (await getDoc(callDoc)).data();

//       const pc = new RTCPeerConnection(ICE_SERVERS);
//       setPeerConnection(pc);

//       await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       await setDoc(
//         callDoc,
//         {
//           answer: {
//             type: answer.type,
//             sdp: answer.sdp,
//           },
//           status: "in_call",
//         },
//         { merge: true }
//       );

//       playSound("ringtone", true);
//       updateCallStatus({ isInCall: true });

//       pc.ontrack = (event) => {
//         const remoteStream = new MediaStream();
//         event.streams[0]
//           .getTracks()
//           .forEach((track) => remoteStream.addTrack(track));
//         setRemoteStream(remoteStream);
//       };

//       monitorCallState(callId);
//     } catch (error) {
//       console.error("Erreur lors de la réponse :", error);
//       resetCallState();
//     }
//   };

//   const endCall = async (callId) => {
//     try {
//       if (!callId) {
//         throw new Error("callId est requis pour terminer l'appel.");
//       }

//       await setDoc(
//         doc(db, "calls", callId),
//         { status: "ended" },
//         { merge: true }
//       );
//       cleanupCall();
//       updateCallStatus({ isInCall: false, isCalling: false });
//       stopSound();
//       playSound("apfinis", false);
//     } catch (error) {
//       console.error("Erreur lors de la fin de l'appel :", error);
//     }
//   };

//   const monitorCallState = (callId) => {
//     const callDoc = doc(db, "calls", callId);

//     onSnapshot(callDoc, (snapshot) => {
//       const data = snapshot.data();
//       if (!data) return;

//       if (data.status === "ended") {
//         endCall(callId);
//       } else if (data.rejected) {
//         playSound("apfinis", false);
//         cleanupCall();
//         updateCallStatus({ isInCall: false, isCalling: false });
//       }
//     });
//   };

//   const cleanupCall = () => {
//     if (peerConnection) {
//       peerConnection.close();
//       setPeerConnection(null);
//     }

//     const { localStream, remoteStream } = useCallStore.getState();

//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//     }
//     if (remoteStream) {
//       remoteStream.getTracks().forEach((track) => track.stop());
//     }

//     stopSound();
//     resetCallState();
//   };

//   return { startCall, answerCall, endCall, cleanupCall };
// }

// // import { useState, useEffect } from "react";
// // import {
// //   doc,
// //   setDoc,
// //   deleteDoc,
// //   collection,
// //   onSnapshot,
// //   getDoc,
// // } from "firebase/firestore";
// // import { db } from "./firebase";
// // import { useCallStore } from "./useCall";

// // const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// // export function useCallData() {
// //   const {
// //     updateCallStatus,
// //     setLocalStream,
// //     setRemoteStream,
// //     resetCallState,
// //     playSound,
// //     stopSound,
// //     callState,
// //   } = useCallStore();

// //   const [peerConnection, setPeerConnection] = useState(null);

// //   // Nettoyage à la fin de la session
// //   useEffect(() => {
// //     return () => cleanupCall();
// //   }, []);

// //   // Fonction pour démarrer un appel
// //   const startCall = async (callId, isVideo = false, receiverId) => {
// //     try {
// //       if (!callId || !receiverId) {
// //         throw new Error("callId et receiverId sont requis.");
// //       }

// //       // Configuration WebRTC
// //       const pc = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(pc);

// //       // Récupération du flux local
// //       const localStream = await navigator.mediaDevices.getUserMedia({
// //         video: isVideo,
// //         audio: true,
// //       });
// //       localStream
// //         .getTracks()
// //         .forEach((track) => pc.addTrack(track, localStream));
// //       setLocalStream(localStream);

// //       pc.ontrack = (event) => {
// //         const remoteStream = new MediaStream();
// //         event.streams[0]
// //           .getTracks()
// //           .forEach((track) => remoteStream.addTrack(track));
// //         setRemoteStream(remoteStream);
// //       };

// //       pc.onicecandidate = (event) => {
// //         if (event.candidate) {
// //           const candidateRef = doc(
// //             collection(doc(db, "calls", callId), "callerCandidates")
// //           );
// //           setDoc(candidateRef, event.candidate.toJSON());
// //         }
// //       };

// //       // Création de l'offre
// //       const offer = await pc.createOffer();
// //       await pc.setLocalDescription(offer);

// //       // Mise à jour dans Firestore
// //       await setDoc(doc(db, "calls", callId), {
// //         callerId: callState.callerId,
// //         receiverId,
// //         offer: {
// //           type: offer.type,
// //           sdp: offer.sdp,
// //         },
// //         type: isVideo ? "video" : "audio",
// //         status: "calling",
// //         createdAt: new Date(),
// //       });

// //       playSound("apemis", true);
// //       updateCallStatus({ isCalling: true });

// //       monitorCallState(callId); // Suivi des états en temps réel
// //     } catch (error) {
// //       console.error("Erreur lors de l'initiation de l'appel :", error);
// //       resetCallState();
// //     }
// //   };

// //   // Fonction pour répondre à un appel
// //   const answerCall = async (callId) => {
// //     try {
// //       if (!callId) throw new Error("callId requis.");

// //       const callDoc = doc(db, "calls", callId);
// //       const callData = (await getDoc(callDoc)).data();

// //       if (!callData?.offer) {
// //         throw new Error("Aucune offre trouvée pour cet appel.");
// //       }

// //       const pc = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(pc);

// //       pc.ontrack = (event) => {
// //         const remoteStream = new MediaStream();
// //         event.streams[0]
// //           .getTracks()
// //           .forEach((track) => remoteStream.addTrack(track));
// //         setRemoteStream(remoteStream);
// //       };

// //       pc.onicecandidate = (event) => {
// //         if (event.candidate) {
// //           const candidateRef = doc(
// //             collection(doc(db, "calls", callId), "calleeCandidates")
// //           );
// //           setDoc(candidateRef, event.candidate.toJSON());
// //         }
// //       };

// //       await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

// //       const answer = await pc.createAnswer();
// //       await pc.setLocalDescription(answer);

// //       await setDoc(
// //         callDoc,
// //         { answer: { type: answer.type, sdp: answer.sdp }, status: "in-call" },
// //         { merge: true }
// //       );

// //       updateCallStatus({ isInCall: true });
// //       stopSound();

// //       monitorCallState(callId); // Suivi des états en temps réel
// //     } catch (error) {
// //       console.error("Erreur lors de la réponse à l'appel :", error);
// //     }
// //   };

// //   // Fonction pour terminer un appel
// //   const endCall = async (callId) => {
// //     try {
// //       const callDoc = doc(db, "calls", callId);
// //       await setDoc(callDoc, { status: "ended" }, { merge: true });
// //       cleanupCall();
// //       updateCallStatus({ isCalling: false, isInCall: false });
// //     } catch (error) {
// //       console.error("Erreur lors de la fin de l'appel :", error);
// //     }
// //   };

// //   // Fonction pour rejeter un appel
// //   const rejectCall = async (callId) => {
// //     try {
// //       if (!callId) throw new Error("callId est requis.");

// //       const callDoc = doc(db, "calls", callId);
// //       await setDoc(callDoc, { status: "rejected" }, { merge: true });

// //       cleanupCall();
// //       resetCallState();
// //       playSound("apfinis");
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel :", error);
// //     }
// //   };

// //   // Écouter les changements dans Firestore
// //   const monitorCallState = (callId) => {
// //     const callDoc = doc(db, "calls", callId);

// //     onSnapshot(callDoc, (snapshot) => {
// //       const data = snapshot.data();
// //       if (data?.status === "ended" || data?.status === "rejected") {
// //         cleanupCall();
// //         resetCallState();
// //       }
// //     });
// //   };

// //   // Nettoyage des ressources
// //   const cleanupCall = () => {
// //     if (peerConnection) peerConnection.close();
// //     setPeerConnection(null);

// //     if (callState.localStream) {
// //       callState.localStream.getTracks().forEach((track) => track.stop());
// //     }

// //     if (callState.remoteStream) {
// //       callState.remoteStream.getTracks().forEach((track) => track.stop());
// //     }

// //     resetCallState();
// //   };

// //   return { startCall, answerCall, endCall, rejectCall };
// // }

// // import { useState, useEffect } from "react";
// // import {
// //   doc,
// //   setDoc,
// //   deleteDoc,
// //   collection,
// //   onSnapshot,
// //   getDoc,
// // } from "firebase/firestore";
// // import { db } from "./firebase";
// // import { useCallStore } from "./useCall";

// // const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// // export function useCallData() {
// //   const {
// //     updateCallStatus,
// //     setLocalStream,
// //     setRemoteStream,
// //     resetCallState,
// //     playSound,
// //     stopSound,
// //     setCallTimeout,
// //     callState,
// //   } = useCallStore((state) => ({
// //     updateCallStatus: state.updateCallStatus,
// //     setLocalStream: state.setLocalStream,
// //     setRemoteStream: state.setRemoteStream,
// //     resetCallState: state.resetCallState,
// //     playSound: state.playSound,
// //     stopSound: state.stopSound,
// //     setCallTimeout: state.setCallTimeout,
// //     callState: state.callState,
// //   }));

// //   const [peerConnection, setPeerConnection] = useState(null);

// //   // Clean up resources on unmount
// //   useEffect(() => {
// //     return () => {
// //       cleanupCall();
// //     };
// //   }, []);

// //   const startCall = async (callId, isVideo = false, receiverId) => {
// //     try {
// //       if (!callId || !receiverId) {
// //         console.error("Invalid callId or receiverId.");
// //         return;
// //       }

// //       const newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(newPeerConnection);

// //       const localStream = await navigator.mediaDevices.getUserMedia({
// //         video: isVideo,
// //         audio: true,
// //       });

// //       localStream
// //         .getTracks()
// //         .forEach((track) => newPeerConnection.addTrack(track, localStream));
// //       setLocalStream(localStream);

// //       newPeerConnection.ontrack = (event) => {
// //         const remoteStream = new MediaStream();
// //         event.streams[0]
// //           .getTracks()
// //           .forEach((track) => remoteStream.addTrack(track));
// //         setRemoteStream(remoteStream);
// //       };

// //       newPeerConnection.onicecandidate = (event) => {
// //         if (event.candidate) {
// //           const candidateRef = doc(
// //             collection(doc(db, "calls", callId), "callerCandidates")
// //           );
// //           setDoc(candidateRef, event.candidate.toJSON());
// //         }
// //       };

// //       await setDoc(doc(db, "calls", callId), {
// //         callerId: callState.callerId,
// //         receiverId,
// //         type: isVideo ? "video" : "audio",
// //         status: "calling",
// //         createdAt: new Date(),
// //       });

// //       playSound("apemis", true);

// //       updateCallStatus({ isCalling: true });

// //       const timeoutId = setTimeout(() => {
// //         cleanupCall(newPeerConnection);
// //         updateCallStatus({ isCalling: false, isInCall: false });
// //         playSound("apfinis");
// //       }, 30000); // 30 seconds

// //       setCallTimeout(timeoutId);
// //     } catch (error) {
// //       console.error("Error starting the call:", error);
// //       resetCallState();
// //     }
// //   };

// //   const answerCall = async (callId) => {
// //     try {
// //       if (!callId) {
// //         console.error("Call ID is undefined.");
// //         return;
// //       }

// //       const callDoc = doc(db, "calls", callId);
// //       const callData = (await getDoc(callDoc)).data();

// //       if (!callData?.offer) {
// //         console.warn("No offer found for this call.");
// //         playSound("error");
// //         updateCallStatus("error");
// //         return;
// //       }

// //       playSound("call_connecting");

// //       const newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(newPeerConnection);

// //       await newPeerConnection.setRemoteDescription(
// //         new RTCSessionDescription(callData.offer)
// //       );

// //       const answerDescription = await newPeerConnection.createAnswer();
// //       await newPeerConnection.setLocalDescription(answerDescription);

// //       await setDoc(
// //         callDoc,
// //         {
// //           answer: {
// //             type: answerDescription.type,
// //             sdp: answerDescription.sdp,
// //           },
// //         },
// //         { merge: true }
// //       );

// //       listenForICECandidates(callId, "callerCandidates");

// //       updateCallStatus({ isInCall: true });
// //       stopSound();

// //       onSnapshot(callDoc, (snapshot) => {
// //         const data = snapshot.data();
// //         if (data?.status === "ended") {
// //           endCall(callId);
// //         }
// //       });

// //       console.log("Call answered.");
// //     } catch (error) {
// //       console.error("Error answering the call:", error);
// //       playSound("error");
// //       updateCallStatus("error");
// //     }
// //   };

// //   const rejectCall = async (callId) => {
// //     try {
// //       if (!callId) {
// //         console.error("Call ID is undefined.");
// //         return;
// //       }

// //       const callDoc = doc(db, "calls", callId);
// //       await setDoc(
// //         callDoc,
// //         { rejected: true, status: "rejected" },
// //         { merge: true }
// //       );

// //       playSound("call_rejected");
// //       cleanupCall();
// //       resetCallState();
// //       updateCallStatus("rejected");
// //     } catch (error) {
// //       console.error("Error rejecting the call:", error);
// //     }
// //   };

// //   const endCall = async (callId) => {
// //     try {
// //       if (!callId) {
// //         console.error("Cannot end call: callId is undefined.");
// //         return;
// //       }

// //       const callDoc = doc(db, "calls", callId);
// //       const docSnap = await getDoc(callDoc);
// //       if (!docSnap.exists()) {
// //         console.warn(`Call document ${callId} does not exist.`);
// //         return;
// //       }

// //       cleanupCall();
// //       await deleteDoc(callDoc);
// //       updateCallStatus("ended");
// //     } catch (error) {
// //       console.error("Error ending the call:", error);
// //     }
// //   };

// //   const cleanupCall = () => {
// //     if (peerConnection) {
// //       peerConnection.close();
// //       setPeerConnection(null);
// //     }

// //     const { localStream, remoteStream } = useCallStore.getState();

// //     localStream?.getTracks().forEach((track) => track.stop());
// //     remoteStream?.getTracks().forEach((track) => track.stop());

// //     stopSound();
// //     resetCallState();
// //   };

// //   const listenForICECandidates = (callId, candidateType) => {
// //     const callDoc = doc(db, "calls", callId);
// //     const candidatesCollection = collection(callDoc, candidateType);

// //     onSnapshot(candidatesCollection, (snapshot) => {
// //       snapshot.docChanges().forEach((change) => {
// //         if (change.type === "added") {
// //           const candidateData = change.doc.data();
// //           if (peerConnection) {
// //             peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
// //           } else {
// //             console.warn("PeerConnection is not initialized.");
// //           }
// //         }
// //       });
// //     });
// //   };

// //   return {
// //     startCall,
// //     answerCall,
// //     rejectCall,
// //     endCall,
// //     listenForICECandidates,
// //   };
// // }

// // import { useState, useEffect } from "react";
// // import { doc, setDoc, collection, onSnapshot } from "firebase/firestore";
// // import { useCallStore } from "./useCallStore";
// // import { db } from "./firebase";

// // const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// // export const useCallData = () => {
// //   const {
// //     callState,
// //     updateCallStatus,
// //     playSound,
// //     stopSound,
// //     resetCallState,
// //   } = useCallStore();

// //   const [peerConnection, setPeerConnection] = useState(null);

// //   useEffect(() => {
// //     return () => cleanupCall();
// //   }, []);

// //   const startCall = async ({ callId, isVideo, receiverId }) => {
// //     try {
// //       const pc = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(pc);

// //       const localStream = await navigator.mediaDevices.getUserMedia({
// //         video: isVideo,
// //         audio: true,
// //       });
// //       localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

// //       pc.ontrack = (event) => {
// //         const remoteStream = new MediaStream();
// //         event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
// //         updateCallStatus({ remoteStream });
// //       };

// //       pc.onicecandidate = (event) => {
// //         if (event.candidate) {
// //           const candidateRef = doc(collection(db, "calls", callId), "callerCandidates");
// //           setDoc(candidateRef, event.candidate.toJSON());
// //         }
// //       };

// //       const offer = await pc.createOffer();
// //       await pc.setLocalDescription(offer);

// //       await setDoc(doc(db, "calls", callId), {
// //         callerId: callState.callerId,
// //         receiverId,
// //         offer,
// //         type: isVideo ? "video" : "audio",
// //         status: "calling",
// //         createdAt: new Date(),
// //       });

// //       playSound("ringing", true);
// //       updateCallStatus({ isCalling: true });
// //     } catch (error) {
// //       console.error("Erreur lors de l'appel :", error);
// //       resetCallState();
// //     }
// //   };

// //   const answerCall = async (callId) => {
// //     try {
// //       const callDoc = doc(db, "calls", callId);
// //       const callData = (await getDoc(callDoc)).data();

// //       const pc = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(pc);

// //       await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
// //       const answer = await pc.createAnswer();
// //       await pc.setLocalDescription(answer);

// //       await setDoc(callDoc, { answer }, { merge: true });
// //       playSound("call_connecting");
// //       updateCallStatus({ isInCall: true });
// //     } catch (error) {
// //       console.error("Erreur de réponse :", error);
// //       resetCallState();
// //     }
// //   };

// //   const cleanupCall = () => {
// //     if (peerConnection) {
// //       peerConnection.close();
// //       setPeerConnection(null);
// //     }
// //     resetCallState();
// //   };

// //   return { startCall, answerCall, cleanupCall };
// // };

// // import { useState, useEffect } from "react";
// // import {
// //   doc,
// //   setDoc,
// //   deleteDoc,
// //   collection,
// //   onSnapshot,
// //   getDoc,
// // } from "firebase/firestore";
// // import { db } from "./firebase";
// // import { useCallStore } from "./useCall";

// // const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// // export function useCallData() {
// //   const {
// //     updateCallStatus,
// //     setLocalStream,
// //     setRemoteStream,
// //     resetCallState,
// //     playSound,
// //     stopSound,
// //     setCallTimeout,
// //     callState,
// //   } = useCallStore((state) => ({
// //     updateCallStatus: state.updateCallStatus,
// //     setLocalStream: state.setLocalStream,
// //     setRemoteStream: state.setRemoteStream,
// //     resetCallState: state.resetCallState,
// //     playSound: state.playSound,
// //     stopSound: state.stopSound,
// //     setCallTimeout: state.setCallTimeout,
// //     callState: state.callState,
// //   }));

// //   const [peerConnection, setPeerConnection] = useState(null);

// //   // Clean up resources on unmount
// //   useEffect(() => {
// //     return () => {
// //       cleanupCall();
// //     };
// //   }, []);

// //   const startCall = async (callId, isVideo = false, receiverId) => {
// //     try {
// //       const newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(newPeerConnection);

// //       const localStream = await navigator.mediaDevices.getUserMedia({
// //         video: isVideo,
// //         audio: true,
// //       });

// //       localStream.getTracks().forEach((track) =>
// //         newPeerConnection.addTrack(track, localStream)
// //       );
// //       setLocalStream(localStream);

// //       newPeerConnection.ontrack = (event) => {
// //         const remoteStream = new MediaStream();
// //         event.streams[0].getTracks().forEach((track) =>
// //           remoteStream.addTrack(track)
// //         );
// //         setRemoteStream(remoteStream);
// //       };

// //       newPeerConnection.onicecandidate = (event) => {
// //         if (event.candidate) {
// //           const candidateRef = doc(
// //             collection(doc(db, "calls", callId), "callerCandidates")
// //           );
// //           setDoc(candidateRef, event.candidate.toJSON());
// //         }
// //       };

// //       await setDoc(doc(db, "calls", callId), {
// //         callerId: callState.callerId,
// //         receiverId,
// //         type: isVideo ? "video" : "audio",
// //         status: "calling",
// //         createdAt: new Date(),
// //       });

// //       playSound("apemis", true);

// //       updateCallStatus({ isCalling: true });

// //       const timeoutId = setTimeout(() => {
// //         cleanupCall(newPeerConnection);
// //         updateCallStatus({ isCalling: false, isInCall: false });
// //         playSound("apfinis");
// //       }, 30000); // 30 seconds

// //       setCallTimeout(timeoutId);
// //     } catch (error) {
// //       console.error("Error starting the call:", error);
// //       resetCallState();
// //     }
// //   };

// //   const answerCall = async (callId) => {
// //     try {
// //       const callDoc = doc(db, "calls", callId);
// //       const callData = (await getDoc(callDoc)).data();

// //       if (!callData?.offer) {
// //         console.warn("Aucune offre trouvée pour cet appel.");
// //         playSound("error");
// //         updateCallStatus("error");
// //         return;
// //       }

// //       playSound("call_connecting");

// //       const newPeerConnection = new RTCPeerConnection(ICE_SERVERS);
// //       setPeerConnection(newPeerConnection);

// //       await newPeerConnection.setRemoteDescription(
// //         new RTCSessionDescription(callData.offer)
// //       );

// //       const answerDescription = await newPeerConnection.createAnswer();
// //       await newPeerConnection.setLocalDescription(answerDescription);

// //       await setDoc(
// //         callDoc,
// //         {
// //           answer: {
// //             type: answerDescription.type,
// //             sdp: answerDescription.sdp,
// //           },
// //         },
// //         { merge: true }
// //       );

// //       listenForICECandidates(callId, "callerCandidates");

// //       updateCallStatus({ isInCall: true });
// //       stopSound();

// //       onSnapshot(callDoc, (snapshot) => {
// //         const data = snapshot.data();
// //         if (data?.status === "ended") {
// //           endCall(callId);
// //         }
// //       });

// //       console.log("Appel accepté.");
// //     } catch (error) {
// //       console.error("Erreur lors de la réponse à l'appel:", error);
// //       playSound("error");
// //       updateCallStatus("error");
// //     }
// //   };

// //   const rejectCall = async (callId) => {
// //     try {
// //       const callDoc = doc(db, "calls", callId);
// //       await setDoc(
// //         callDoc,
// //         { rejected: true, status: "rejected" },
// //         { merge: true }
// //       );

// //       playSound("call_rejected");
// //       cleanupCall();
// //       resetCallState();
// //       updateCallStatus("rejected");
// //     } catch (error) {
// //       console.error("Erreur lors du rejet de l'appel:", error);
// //     }
// //   };

// //   const endCall = async (callId) => {
// //     try {
// //       cleanupCall();
// //       await deleteDoc(doc(db, "calls", callId));
// //       updateCallStatus("ended");
// //     } catch (error) {
// //       console.error("Error ending the call:", error);
// //     }
// //   };

// //   const cleanupCall = () => {
// //     if (peerConnection) {
// //       peerConnection.close();
// //       setPeerConnection(null);
// //     }

// //     const { localStream, remoteStream } = useCallStore.getState();

// //     localStream?.getTracks().forEach((track) => track.stop());
// //     remoteStream?.getTracks().forEach((track) => track.stop());

// //     stopSound();
// //     resetCallState();
// //   };

// //   const listenForICECandidates = (callId, candidateType) => {
// //     const callDoc = doc(db, "calls", callId);
// //     const candidatesCollection = collection(callDoc, candidateType);

// //     onSnapshot(candidatesCollection, (snapshot) => {
// //       snapshot.docChanges().forEach((change) => {
// //         if (change.type === "added") {
// //           const candidateData = change.doc.data();
// //           peerConnection?.addIceCandidate(new RTCIceCandidate(candidateData));
// //         }
// //       });
// //     });
// //   };

// //   return {
// //     startCall,
// //     answerCall,
// //     rejectCall,
// //     endCall,
// //     listenForICECandidates,
// //   };
// // }

// import create from "zustand";
// import { persist, devtools } from "zustand/middleware";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "./firebase";

// const initialCallState = {
//   isCalling: false,
//   isRinging: false,
//   isInCall: false,
//   isVideoCall: false,
//   callId: null,
//   localStream: null,
//   remoteStream: null,
//   error: null,
//   callerId: null,
//   receiverId: null,
//   currentSound: null,
//   callActive: false,
// };

// export const useCallStore = create(
//   devtools(
//     persist(
//       (set, get) => ({
//         callState: { ...initialCallState },

//         // Vérification de disponibilité
//         checkReceiverAvailability: async (receiverId) => {
//           try {
//             const receiverDoc = await getDoc(doc(db, "users", receiverId));
//             return receiverDoc.exists() && receiverDoc.data().isOnline;
//           } catch (error) {
//             console.error("Erreur de vérification :", error);
//             return false;
//           }
//         },

//         // Initialisation d'un appel
//         initializeCall: async ({ callId, isVideo, callerId, receiverId }) => {
//           try {
//             const isAvailable = await get().checkReceiverAvailability(
//               receiverId
//             );
//             if (!isAvailable)
//               throw new Error("Le destinataire est indisponible.");

//             const localStream = await get().prepareMediaStream(isVideo);
//             set({
//               callState: {
//                 ...initialCallState,
//                 isCalling: true,
//                 localStream,
//                 isVideoCall: isVideo,
//                 callId,
//                 callerId,
//                 receiverId,
//               },
//             });
//           } catch (error) {
//             console.error("Erreur d'initialisation d'appel :", error);
//             set({ callState: { ...initialCallState, error: error.message } });
//           }
//         },

//         prepareMediaStream: async (isVideo) => {
//           try {
//             const stream = await navigator.mediaDevices.getUserMedia({
//               audio: true,
//               video: isVideo,
//             });
//             return stream;
//           } catch (error) {
//             throw new Error("Impossible d'accéder au média.");
//           }
//         },

//         updateCallStatus: (status) => {
//           set((state) => ({
//             callState: { ...state.callState, ...status },
//           }));
//           if (status.status === "ended") get().resetCallState();
//         },

//         resetCallState: () => {
//           const { localStream, remoteStream } = get().callState;
//           if (localStream)
//             localStream.getTracks().forEach((track) => track.stop());
//           if (remoteStream)
//             remoteStream.getTracks().forEach((track) => track.stop());

//           set({ callState: { ...initialCallState } });
//         },

//         playSound: (type, loop = false) => {
//           const sounds = {
//             ringing: new Audio("ringtone.mp3"),
//             ended: new Audio("end_call.mp3"),
//           };
//           const currentSound = sounds[type];
//           if (currentSound) {
//             currentSound.loop = loop;
//             currentSound.play();
//             set((state) => ({
//               callState: { ...state.callState, currentSound },
//             }));
//           }
//         },

//         stopSound: () => {
//           const { currentSound } = get().callState;
//           if (currentSound) {
//             currentSound.pause();
//             currentSound.currentTime = 0;
//           }
//           set((state) => ({
//             callState: { ...state.callState, currentSound: null },
//           }));
//         },
//       }),
//       { name: "call-store" }
//     )
//   )
// );

// import create from "zustand";
// import { persist, devtools } from "zustand/middleware";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "./firebase";

// const initialCallState = {
//   isCalling: false,
//   isRinging: false,
//   isInCall: false,
//   isVideoCall: false,
//   callId: null,
//   localStream: null,
//   remoteStream: null,
//   error: null,
//   callerId: null,
//   receiverId: null,
//   currentSound: null,
//   callActive: false,
//   isIncomingCall: false, // Ajout de l'état pour gérer l'appel entrant
//   isOutgoingCall: false, // Ajout de l'état pour gérer l'appel sortant
// };

// export const useCallStore = create(
//   devtools(
//     persist(
//       (set, get) => ({
//         callState: { ...initialCallState },

//         // Vérification de la disponibilité du destinataire
//         checkReceiverAvailability: async (receiverId) => {
//           try {
//             const receiverDoc = await getDoc(doc(db, "users", receiverId));
//             return receiverDoc.exists() && receiverDoc.data().isOnline;
//           } catch (error) {
//             console.error("Erreur de vérification :", error);
//             return false;
//           }
//         },

//         // Initialisation d'un appel sortant
//         initializeCall: async ({ callId, isVideo, callerId, receiverId }) => {
//           try {
//             const isAvailable = await get().checkReceiverAvailability(receiverId);
//             if (!isAvailable)
//               throw new Error("Le destinataire est indisponible.");

//             const localStream = await get().prepareMediaStream(isVideo);
//             set({
//               callState: {
//                 ...initialCallState,
//                 isCalling: true,
//                 isOutgoingCall: true, // Marquer l'appel comme sortant
//                 localStream,
//                 isVideoCall: isVideo,
//                 callId,
//                 callerId,
//                 receiverId,
//               },
//             });
//           } catch (error) {
//             console.error("Erreur d'initialisation d'appel :", error);
//             set({ callState: { ...initialCallState, error: error.message } });
//           }
//         },

//         // Préparer le flux média (audio/vidéo)
//         prepareMediaStream: async (isVideo) => {
//           try {
//             const stream = await navigator.mediaDevices.getUserMedia({
//               audio: true,
//               video: isVideo,
//             });
//             return stream;
//           } catch (error) {
//             throw new Error("Impossible d'accéder au média.");
//           }
//         },

//         // Mettre à jour le statut de l'appel (entrant, sortant, en cours, terminé)
//         updateCallStatus: (status) => {
//           set((state) => ({
//             callState: { ...state.callState, ...status },
//           }));
//           if (status.status === "ended") get().resetCallState();
//         },

//         // Réinitialiser l'état de l'appel
//         resetCallState: () => {
//           const { localStream, remoteStream } = get().callState;
//           if (localStream)
//             localStream.getTracks().forEach((track) => track.stop());
//           if (remoteStream)
//             remoteStream.getTracks().forEach((track) => track.stop());

//           set({ callState: { ...initialCallState } });
//         },

//         // Accepter un appel entrant
//         acceptIncomingCall: () => {
//           const { callerId, receiverId, isVideoCall } = get().callState;
//           set({
//             callState: {
//               ...initialCallState,
//               isInCall: true,
//               isIncomingCall: false,
//               isOutgoingCall: true,
//               callerId,
//               receiverId,
//               isVideoCall,
//             },
//           });
//         },

//         // Rejeter un appel entrant
//         rejectIncomingCall: () => {
//           set({
//             callState: {
//               ...initialCallState,
//               isIncomingCall: false,
//             },
//           });
//         },

//         // Couper un appel (appel en cours)
//         endCall: () => {
//           get().resetCallState();
//         },

//         // Jouer un son (ex : sonnerie)
//         playSound: (type, loop = false) => {
//           const sounds = {
//             ringing: new Audio("ringtone.mp3"),
//             ended: new Audio("end_call.mp3"),
//           };
//           const currentSound = sounds[type];
//           if (currentSound) {
//             currentSound.loop = loop;
//             currentSound.play();
//             set((state) => ({
//               callState: { ...state.callState, currentSound },
//             }));
//           }
//         },

//         // Arrêter le son
//         stopSound: () => {
//           const { currentSound } = get().callState;
//           if (currentSound) {
//             currentSound.pause();
//             currentSound.currentTime = 0;
//           }
//           set((state) => ({
//             callState: { ...state.callState, currentSound: null },
//           }));
//         },
//       }),
//       { name: "call-store" }
//     )
//   )
// );

// import create from "zustand";
// import { persist } from "zustand/middleware";
// import { devtools } from "zustand/middleware";
// import { doc, getDoc} from "firebase/firestore";
// import { db } from "./firebase";

// export const useCallStore = create(
//   devtools(
//     persist(
//       (set, get) => ({
//         // État initial de l'appel
//         callState: {
//           isCalling: false,
//           isRinging: false,
//           isInCall: false,
//           isVideoCall: false,
//           callId: null,
//           localStream: null,
//           remoteStream: null,
//           error: null,
//           callerId: null,
//           receiverId: null,
//           currentSound: null,
//           timeoutId: null,
//           callActive: null,
//         },

//         // Vérification de la disponibilité du destinataire
//         checkReceiverAvailability: async (receiverId) => {
//           try {
//             const receiverDocRef = doc(db, "users", receiverId);
//             const receiverDoc = await getDoc(receiverDocRef);
//             return receiverDoc.exists() && receiverDoc.data().isOnline;
//           } catch (error) {
//             console.error("Erreur lors de la vérification :", error);
//             return false;
//           }
//         },
//         setOutgoingCall: (callDetails) => {
//           set((state) => ({
//             callState: {
//               ...state.callState,
//               ...callDetails, // Mettre à jour les détails de l'appel
//             },
//           }));
//         },

//         // Préparer le flux média
//         // prepareMediaStream: async (isVideo) => {
//         //   try {
//         //     const stream = await navigator.mediaDevices.getUserMedia({
//         //       audio: true,
//         //       video: isVideo,
//         //     });
//         //     return stream;
//         //   } catch (error) {
//         //     console.error("Erreur lors de l'accès au média :", error);
//         //     throw new Error(
//         //       "Impossible d'accéder à la caméra ou au microphone."
//         //     );
//         //   }
//         // },
//         prepareMediaStream: async (isVideo) => {
//           try {
//             const constraints = {
//               audio: true,
//               video: isVideo,
//             };
//             const stream = await navigator.mediaDevices.getUserMedia(
//               constraints
//             );

//             // Affiche le flux local (utile pour le débogage)
//             if (isVideo) {
//               const videoElement = document.createElement("video");
//               videoElement.srcObject = stream;
//               videoElement.autoplay = true;
//               videoElement.muted = true; // Empêche les échos
//               document.body.appendChild(videoElement);
//             }

//             return stream;
//           } catch (error) {
//             console.error("Erreur lors de l'accès au média :", error);
//             throw new Error(
//               "Impossible d'accéder à la caméra ou au microphone. Veuillez vérifier les autorisations."
//             );
//           }
//         },

//         // Initialiser un appel
//         initializeCall: async (callId, isVideo, callerId, receiverId) => {
//           try {
//             const isAvailable = await get().checkReceiverAvailability(
//               receiverId
//             );
//             if (!isAvailable) {
//               throw new Error("Le destinataire est indisponible.");
//             }

//             const localStream = await get().prepareMediaStream(isVideo);
//             set((state) => ({
//               callState: {
//                 ...state.callState,
//                 isCalling: true,
//                 localStream,
//                 isVideoCall: isVideo,
//                 callId,
//                 callerId,
//                 receiverId,
//                 error: null,
//               },
//             }));
//           } catch (error) {
//             console.error(
//               "Erreur lors de l'initialisation de l'appel :",
//               error
//             );
//             set((state) => ({
//               callState: {
//                 ...state.callState,
//                 isCalling: false,
//                 error: error.message,
//               },
//             }));
//           }
//         },
//         updateCallStatus: (callId, status) => {
//           console.log(
//             `Mise à jour du statut pour l'appel ${callId}: ${status}`
//           );
//           status === "accepted";
//           set((state) => ({
//             callState: {
//               ...state.callState,
//               callId,
//               status,
//               callActive: status === "accepted",
//             },
//           }));
//           if (status === "ended") {
//             get().resetCallState();
//           }
//         },

//         // Réinitialiser l'état de l'appel
//         resetCallState: () => {
//           const { localStream, remoteStream } = get().callState;
//           if (localStream) localStream.getTracks().forEach((track) => track.stop());
//           if (remoteStream) remoteStream.getTracks().forEach((track) => track.stop());

//           set({
//             callState: {
//               ...initialCallState,
//             },
//           });
//         },

//         // resetCallState: () => {
//         //   const { currentSound, localStream, remoteStream } = get().callState;
//         //   if (currentSound) {
//         //     currentSound.pause();
//         //     currentSound.currentTime = 0;
//         //   }
//         //   if (localStream)
//         //     localStream.getTracks().forEach((track) => track.stop());
//         //   if (remoteStream)
//         //     remoteStream.getTracks().forEach((track) => track.stop());

//         //   set({
//         //     callState: {
//         //       isCalling: false,
//         //       isRinging: false,
//         //       isInCall: false,
//         //       isVideoCall: false,
//         //       callId: null,
//         //       localStream: null,
//         //       remoteStream: null,
//         //       error: null,
//         //       callerId: null,
//         //       receiverId: null,
//         //       currentSound: null,
//         //       timeoutId: null,
//         //       callActive: false,
//         //     },
//         //   });
//         // },

//         // Lire un son
//         playSound: (type, loop = false) => {
//           try {
//             const sounds = {
//               apemis: new Audio("apemis.mp3"),
//               apfinis: new Audio("apfinis.mp3"),
//               ringtone: new Audio("ringtone.mp3"),
//             };
//             const currentSound = sounds[type];
//             if (get().callState.currentSound) {
//               get().callState.currentSound.pause();
//               get().callState.currentSound.currentTime = 0;
//             }
//             if (currentSound) {
//               currentSound.loop = loop;
//               currentSound.play();
//             }
//             set((state) => ({
//               callState: { ...state.callState, currentSound },
//             }));
//           } catch (error) {
//             console.error("Erreur lors de la lecture du son :", error);
//           }
//         },

//         // Arrêter le son
//         stopSound: () => {
//           const { currentSound } = get().callState;
//           if (currentSound) {
//             currentSound.pause();
//             currentSound.currentTime = 0;
//           }
//           set((state) => ({
//             callState: { ...state.callState, currentSound: null },
//           }));
//         },
//       }),
//       {
//         name: "call-store",
//         partialize: (state) => ({
//           isCalling: state.callState.isCalling,
//           isRinging: state.callState.isRinging,
//           isInCall: state.callState.isInCall,
//           callId: state.callState.callId,
//         }),
//       }
//     )
//   )
// );

// import { useState, useEffect, useRef } from "react";
// import { onSnapshot, doc, updateDoc } from "firebase/firestore";
// import { db } from "../../../../lib/firebase";
// import { useCallStore } from "../../../../lib/useCall";
// import "./respondInterface.css";

// export function ReceiverInterface({ callId, callType, onEndCall }) {
//   const {
//     updateCallStatus,
//     playSound,
//     stopSound,
//     callStatus: storeCallStatus,
//   } = useCallStore();
//   const [callStatus, setCallStatus] = useState(
//     storeCallStatus || "Appel entrant..."
//   );
//   const [isCallOngoing, setIsCallOngoing] = useState(false);
//   const [error, setError] = useState(null);

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   useEffect(() => {
//     if (!callId) return;

//     const callDoc = doc(db, "calls", callId);

//     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//       const callData = snapshot.data();

//       if (callData?.accepted) {
//         setCallStatus("En cours d'appel");
//         setIsCallOngoing(true);
//         updateCallStatus(callId, "accepted");
//         stopSound();
//       } else if (callData?.rejected || callData?.status === "ended") {
//         setCallStatus("Appel terminé ou rejeté");
//         updateCallStatus(callId, "ended");
//         handleEndCall();
//       }
//     });

//     playSound("ringtone_incoming");

//     return () => {
//       unsubscribe();
//       stopSound();
//       setIsCallOngoing(false);
//     };
//   }, [callId, updateCallStatus, playSound, stopSound]);

//   const handleAccept = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { accepted: true });
//       updateCallStatus(callId, "accepted");
//       setCallStatus("En cours d'appel");
//       setIsCallOngoing(true);
//     } catch (error) {
//       console.error("Erreur lors de l'acceptation de l'appel :", error);
//       setError("Impossible d'accepter l'appel. Veuillez réessayer.");
//     }
//   };

//   const handleReject = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { rejected: true });
//       updateCallStatus(callId, "rejected");
//       setCallStatus("Appel rejeté");
//       if (onEndCall) onEndCall();
//     } catch (error) {
//       console.error("Erreur lors du rejet de l'appel :", error);
//       setError("Impossible de rejeter l'appel.");
//     }
//   };

//   const handleEndCall = async () => {
//     try {
//       await updateDoc(doc(db, "calls", callId), { status: "ended" });
//       updateCallStatus(callId, "ended");
//       setCallStatus("Appel terminé");
//       stopSound();
//       if (onEndCall) onEndCall();
//     } catch (error) {
//       console.error("Erreur lors de la fin de l'appel :", error);
//       setError("Impossible de terminer l'appel.");
//     }
//   };

//   return (
//     <div
//       className={`call-interface ${
//         callType === "video" ? "video-call" : "audio-call"
//       }`}
//     >
//       <h2>{callStatus}</h2>
//       {error && <div className="error-message">{error}</div>}
//       {!isCallOngoing && callStatus === "Appel entrant..." && (
//         <div className="buttons">
//           <button className="accept-button" onClick={handleAccept}>
//             Accepter
//           </button>
//           <button className="reject-button" onClick={handleReject}>
//             Rejeter
//           </button>
//         </div>
//       )}
//       {callType === "video" && isCallOngoing && (
//         <div className="video-container">
//           <video
//             id="localVideo"
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//           ></video>
//           <video
//             id="remoteVideo"
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//           ></video>
//         </div>
//       )}
//       {isCallOngoing && (
//         <button className="end-call-button" onClick={handleEndCall}>
//           Terminer l'appel
//         </button>
//       )}
//     </div>
//   );
// }
// import create from "zustand";
// import { persist, devtools } from "zustand/middleware";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "./firebase";

// const initialCallState = {
//   isCalling: false,
//   isRinging: false,
//   isInCall: false,
//   isVideoCall: false,
//   callId: null,
//   localStream: null,
//   remoteStream: null,
//   error: null,
//   callerId: null,
//   receiverId: null,
//   currentSound: null,
//   callActive: false,
//   isIncomingCall: false,
//   isOutgoingCall: false,
// };

// export const useCallStore = create(
//   devtools(
//     persist(
//       (set, get) => ({
//         callState: { ...initialCallState },

//         // V�rifier la disponibilit� du destinataire
//         checkReceiverAvailability: async (receiverId) => {
//           try {
//             const receiverDoc = await getDoc(doc(db, "users", receiverId));
//             return receiverDoc.exists() && receiverDoc.data().isOnline;
//           } catch (error) {
//             console.error("Erreur de v�rification :", error);
//             return false;
//           }
//         },

//         // Initialiser un appel
//         initializeCall: async ({ callId, isVideo, callerId, receiverId }) => {
//           try {
//             const isAvailable = await get().checkReceiverAvailability(
//               receiverId
//             );
//             if (!isAvailable) {
//               throw new Error("Le destinataire est indisponible.");
//             }

//             const localStream = await get().prepareMediaStream(isVideo);
//             set({
//               callState: {
//                 ...initialCallState,
//                 isCalling: true,
//                 isOutgoingCall: true,
//                 localStream,
//                 isVideoCall: isVideo,
//                 callId,
//                 callerId,
//                 receiverId,
//               },
//             });
//           } catch (error) {
//             console.error("Erreur d'initialisation d'appel :", error);
//             set({ callState: { ...initialCallState, error: error.message } });
//           }
//         },

//         // Pr�parer le flux m�dia
//         prepareMediaStream: async (isVideo) => {
//           try {
//             const stream = await navigator.mediaDevices.getUserMedia({
//               audio: true,
//               video: isVideo,
//             });
//             return stream;
//           } catch (error) {
//             throw new Error("Impossible d'acc�der au m�dia.");
//           }
//         },

//         // Mettre � jour l'�tat de l'appel
//         updateCallStatus: (status) => {
//           set((state) => ({
//             callState: { ...state.callState, ...status },
//           }));
//         },

//         // R�initialiser l'�tat de l'appel
//         resetCallState: () => {
//           const { localStream, remoteStream } = get().callState;
//           if (localStream) {
//             localStream.getTracks().forEach((track) => track.stop());
//           }
//           if (remoteStream) {
//             remoteStream.getTracks().forEach((track) => track.stop());
//           }

//           set({ callState: { ...initialCallState } });
//         },

//         // Accepter un appel entrant
//         acceptIncomingCall: () => {
//           const { callerId, receiverId, isVideoCall } = get().callState;
//           set({
//             callState: {
//               ...initialCallState,
//               isInCall: true,
//               isIncomingCall: false,
//               callerId,
//               receiverId,
//               isVideoCall,
//             },
//           });
//         },

//         // Rejeter un appel
//         rejectIncomingCall: () => {
//           set({
//             callState: { ...initialCallState },
//           });
//         },

//         // Terminer un appel
//         endCall: () => {
//           get().resetCallState();
//         },

//         // Jouer un son
//         playSound: (type, loop = false) => {
//           const sounds = {
//             ringing: new Audio("ringtone.mp3"),
//             ended: new Audio("end_call.mp3"),
//           };
//           const currentSound = sounds[type];
//           if (currentSound) {
//             currentSound.loop = loop;
//             currentSound.play();
//             set((state) => ({
//               callState: { ...state.callState, currentSound },
//             }));
//           }
//         },

//         // Arr�ter le son
//         stopSound: () => {
//           const { currentSound } = get().callState;
//           if (currentSound) {
//             currentSound.pause();
//             currentSound.currentTime = 0;
//           }
//           set((state) => ({
//             callState: { ...state.callState, currentSound: null },
//           }));
//         },
//       }),
//       { name: "call-store" }
//     )
//   )
// );
// Vérifier la disponibilité du destinataire
        // checkReceiverAvailability: async (receiverId) => {
        //   try {
        //     const receiverDoc = await getDoc(doc(db, "users", receiverId));
        //     return receiverDoc.exists() && receiverDoc.data().isOnline;
        //   } catch (error) {
        //     console.error("Erreur de vérification :", error);
        //     return false;
        //   }
        // },
        // checkReceiverAvailability: async (receiverId) => {
        //   try {
        //     const userDoc = await getDoc(doc(db, "users", receiverId));
        //     if (!userDoc.exists()) {
        //       return false;
        //     }
        //     const userData = userDoc.data();
        //     return userData.isOnline || false; // Assurez-vous que `isOnline` est bien mis à jour dans Firestore
        //   } catch (error) {
        //     console.error(
        //       "Erreur lors de la vérification de la disponibilité :",
        //       error
        //     );
        //     return false;
        //   }
        // },
        // checkReceiverAvailability: async (receiverId) => {
        //   try {
        //     const receiverDoc = await getDoc(doc(db, "users", receiverId));
        //     if (!receiverDoc.exists()) {
        //       console.error(
        //         "Le destinataire n'existe pas dans la base de données :",
        //         receiverId
        //       );
        //       return false;
        //     }
        //     const receiverData = receiverDoc.data();
        //     console.log("Données du destinataire :", receiverData);
        //     return receiverData.isOnline || false; // Vérifie si le destinataire est en ligne
        //   } catch (error) {
        //     console.error(
        //       "Erreur lors de la vérification de disponibilité :",
        //       error
        //     );
        //     return true;
        //   }
        // },
        // checkReceiverAvailability: async (receiverId) => {
        //   try {
        //     const receiverDoc = await getDoc(doc(db, "users", receiverId));
        //     if (!receiverDoc.exists()) {
        //       console.error(
        //         "Le destinataire n'existe pas dans la base de données :",
        //         receiverId
        //       );
        //       return false;
        //     }
        //     const receiverData = receiverDoc.data();
        //     console.log("Données du destinataire :", receiverData);
        //     return receiverData?.status?.state === "online"; // Vérifie si le destinataire est en ligne
        //   } catch (error) {
        //     console.error(
        //       "Erreur lors de la vérification de disponibilité :",
        //       error
        //     );
        //     return false; // Retourne indisponible en cas d'erreur
        //   }
        // },


// // import { useEffect } from "react";
// // import { auth, rdb } from "../lib/firebase";
// // import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
// // import { create } from "zustand";

// // // Zustand store pour gérer le statut de l'utilisateur
// // export const useUserStatusStore = create((set) => ({
// //   online: false,
// //   lastSeen: null,
// //   setUserStatus: (online, lastSeen) => set({ online, lastSeen }),
// // }));

// // export const useUserPresence = () => {
// //   useEffect(() => {
// //     const userStatusStore = useUserStatusStore();

// //     const updatePresence = (user) => {
// //       if (!user) return;

// //       const userStatusRef = ref(rdb, `users/${user.uid}/status`);
// //       const isOnlineStatus = { state: "online", last_changed: serverTimestamp() };
// //       const isOfflineStatus = { state: "offline", last_changed: serverTimestamp() };

// //       // Définir l'utilisateur comme en ligne et configurer l'événement de déconnexion
// //       set(userStatusRef, isOnlineStatus);
// //       onDisconnect(userStatusRef).set(isOfflineStatus);

// //       // Mettre à jour le statut toutes les 30 secondes pour maintenir la connexion active
// //       const heartbeatInterval = setInterval(() => {
// //         set(userStatusRef, isOnlineStatus);
// //       }, 30000);

// //       // Synchroniser le statut de l'utilisateur avec le store Zustand
// //       const unsubscribe = onValue(userStatusRef, (snapshot) => {
// //         const status = snapshot.val();
// //         if (status) {
// //           userStatusStore.setUserStatus(
// //             status.state === "online",
// //             status.last_changed
// //           );
// //         }
// //       });

// //       // Gestion de la déconnexion manuelle lors de la fermeture de la fenêtre
// //       const handleOffline = () => {
// //         clearInterval(heartbeatInterval);
// //         set(userStatusRef, isOfflineStatus);
// //       };

// //       // Attacher l'événement de fermeture de la fenêtre
// //       window.addEventListener("beforeunload", handleOffline);

// //       // Nettoyage des écouteurs et de l'intervalle
// //       return () => {
// //         window.removeEventListener("beforeunload", handleOffline);
// //         unsubscribe();
// //         clearInterval(heartbeatInterval);
// //       };
// //     };

// //     // Écouter l'état d'authentification et appliquer la présence de l'utilisateur
// //     const unsubscribeAuth = auth.onAuthStateChanged(updatePresence);

// //     // Nettoyage lors du démontage du composant
// //     return () => unsubscribeAuth();
// //   }, []);
// // };

// // // import { useEffect } from "react";
// // // import { auth, rdb } from "../lib/firebase";
// // // import {
// // //   ref,
// // //   onValue,
// // //   set,
// // //   onDisconnect,
// // //   serverTimestamp,
// // // } from "firebase/database";
// // // import { create } from "zustand";

// // // // Zustand store pour gérer le statut de l'utilisateur
// // // export const useUserStatusStore = create((set) => ({
// // //   online: false,
// // //   lastSeen: null,
// // //   setUserStatus: (online, lastSeen) => set({ online, lastSeen }),
// // // }));

// // // export const useUserPresence = () => {
// // //   useEffect(() => {
// // //     const userStatusStore = useUserStatusStore();

// // //     // Fonction pour gérer la présence de l'utilisateur
// // //     const handleUserPresence = (user) => {
// // //       if (!user) return;

// // //       const userStatusRef = ref(rdb, `users/${user.uid}/status`);
// // //       const isOnlineStatus = {
// // //         state: "online",
// // //         last_changed: serverTimestamp(),
// // //       };
// // //       const isOfflineStatus = {
// // //         state: "offline",
// // //         last_changed: serverTimestamp(),
// // //       };

// // //       // Marquer en ligne et définir l'événement de déconnexion
// // //       set(userStatusRef, isOnlineStatus);
// // //       onDisconnect(userStatusRef).set(isOfflineStatus);

// // //       // Intervalle de heartbeat (par exemple, toutes les 30 secondes)
// // //       const heartbeatInterval = setInterval(() => {
// // //         set(userStatusRef, {
// // //           state: "online",
// // //           last_changed: serverTimestamp(),
// // //         });
// // //       }, 30000); // 30 secondes

// // //       // Souscrire aux changements dans la Realtime Database
// // //       const unsubscribe = onValue(userStatusRef, (snapshot) => {
// // //         const status = snapshot.val();
// // //         if (status) {
// // //           userStatusStore.setUserStatus(
// // //             status.state === "online",
// // //             status.last_changed
// // //           );
// // //         }
// // //       });

// // //       // Fonction pour marquer hors ligne quand la page se ferme
// // //       const handleOffline = () => {
// // //         clearInterval(heartbeatInterval); // Arrêter le heartbeat
// // //         set(userStatusRef, isOfflineStatus);
// // //       };

// // //       window.addEventListener("beforeunload", handleOffline);

// // //       // Nettoyer les écouteurs et l'intervalle au démontage du composant
// // //       return () => {
// // //         window.removeEventListener("beforeunload", handleOffline);
// // //         unsubscribe();
// // //         clearInterval(heartbeatInterval);
// // //       };
// // //     };

// // //     // Écouter les changements d'état d'authentification
// // //     const unsubscribeAuth = auth.onAuthStateChanged(handleUserPresence);

// // //     // Nettoyer le listener d'authentification au démontage du composant
// // //     return () => unsubscribeAuth();
// // //   }, []);
// // // };

// // // // import { useEffect } from "react";
// // // // import { auth, rdb } from "../lib/firebase";
// // // // import {
// // // //   ref,
// // // //   onValue,
// // // //   set,
// // // //   onDisconnect,
// // // //   serverTimestamp,
// // // // } from "firebase/database";
// // // // import { create } from "zustand";

// // // // /**
// // // //  * Zustand store for managing user status.
// // // //  * Tracks if the user is online and records the last seen timestamp.
// // // //  */
// // // // export const useUserStatusStore = create((set) => ({
// // // //   online: false,
// // // //   lastSeen: null,
// // // //   /**
// // // //    * Updates the user status in the store.
// // // //    * @param {boolean} online - The online status of the user.
// // // //    * @param {number|null} lastSeen - The timestamp of the user's last activity.
// // // //    */
// // // //   setUserStatus: (online, lastSeen) => set({ online, lastSeen }),
// // // // }));

// // // // /**
// // // //  * Custom hook to manage user presence in the Firebase Realtime Database.
// // // //  * Tracks the user's online status and updates the last seen timestamp.
// // // //  */
// // // // export const useUserPresence = () => {
// // // //   useEffect(() => {
// // // //     const userStatusStore = useUserStatusStore();

// // // //     /**
// // // //      * Handles user presence tracking by updating the Realtime Database.
// // // //     //  * Sets user status as online or offline and listens for status changes.
// // // //      *
// // // //      * @param {Object|null} user - The authenticated user object or null if not logged in.
// // // //      */
// // // //     const handleUserPresence = (user) => {
// // // //       if (!user) return;

// // // //       // Reference to the user's status node in the Realtime Database
// // // //       const userStatusRef = ref(rdb, `users/${user.uid}/status`);

// // // //       // Define the statuses for online and offline states
// // // //       const isOnlineStatus = {
// // // //         state: "online",
// // // //         last_changed: serverTimestamp(),
// // // //       };
// // // //       const isOfflineStatus = {
// // // //         state: "offline",
// // // //         last_changed: serverTimestamp(),
// // // //       };

// // // //       // Set the user as online in the Realtime Database
// // // //       set(userStatusRef, isOnlineStatus);

// // // //       // Mark the user as offline if they disconnect
// // // //       onDisconnect(userStatusRef).set(isOfflineStatus);

// // // //       /**
// // // //        * Subscribes to changes in the user's status in the Realtime Database.
// // // //        * Updates the Zustand store based on the current online state and timestamp.
// // // //        */
// // // //       const unsubscribe = onValue(userStatusRef, (snapshot) => {
// // // //         const status = snapshot.val();
// // // //         if (status) {
// // // //           userStatusStore.setUserStatus(
// // // //             status.state === "online",
// // // //             status.last_changed
// // // //           );
// // // //         }
// // // //       });

// // // //       /**
// // // //        * Updates the user's status to offline when the browser/tab is closed.
// // // //        */
// // // //       const handleOffline = () => {
// // // //         set(userStatusRef, isOfflineStatus);
// // // //       };

// // // //       window.addEventListener("beforeunload", handleOffline);

// // // //       // Cleanup listeners on component unmount
// // // //       return () => {
// // // //         window.removeEventListener("beforeunload", handleOffline);
// // // //         unsubscribe(); // Stop listening to Realtime Database updates
// // // //       };
// // // //     };

// // // //     // Subscribe to the user's authentication state
// // // //     const unsubscribeAuth = auth.onAuthStateChanged(handleUserPresence);

// // // //     // Clean up the authentication listener on component unmount
// // // //     return () => unsubscribeAuth();
// // // //   }, []);
// // // // };
// // import { doc, updateDoc } from "firebase/firestore";
// // import { auth, db } from "./firebase"; // Assurez-vous que `firebase` exporte correctement `auth` et `db`

// // // Écoute les changements d'état de connexion de l'utilisateur
// // auth.onAuthStateChanged(async (user) => {
// //   if (user) {
// //     // Référence au document utilisateur dans Firestore
// //     const userRef = doc(db, "users", user.uid);

// //     try {
// //       // Marquer l'utilisateur comme "en ligne" lorsqu'il est connecté
// //       await updateDoc(userRef, { isOnline: true });

// //       console.log(`Utilisateur ${user.uid} est en ligne.`);

// //       // Écoute l'événement "fermeture de fenêtre" ou "rafraîchissement de la page"
// //       window.addEventListener("beforeunload", async () => {
// //         try {
// //           // Marquer l'utilisateur comme "hors ligne"
// //           await updateDoc(userRef, { isOnline: false });
// //           console.log(`Utilisateur ${user.uid} est hors ligne.`);
// //         } catch (error) {
// //           console.error("Erreur lors de la mise hors ligne :", error);
// //         }
// //       });
// //     } catch (error) {
// //       console.error("Erreur lors de la mise en ligne :", error);
// //     }
// //   } else {
// //     console.log("Aucun utilisateur connecté.");
// //   }
// // });
// // functions.firestore.document("users/{userId}").onUpdate((change, context) => {
// //   const after = change.after.data();
// //   if (after.isOnline && Date.now() - after.lastUpdated > 60000) {
// //     return change.after.ref.update({ isOnline: false });
// //   }
// //   return null;
// // });

// import { useEffect } from "react";
// import { ref, onValue, set, serverTimestamp, onDisconnect} from "firebase/database";
// import { useUserStatusStore } from "../../lib/userStatus"; // Assurez-vous que le chemin est correct
// import Chrono from "../chrono/Chrono"; // Assurez-vous que le chemin est correct
// import { auth, rdb } from "../../lib/firebase"; // Assurez-vous que le chemin est correct
// import "./status.css";

// /**
//  * OnlineStatus Component
//  * Affiche le statut en ligne de l'utilisateur (en ligne ou dernière connexion).
//  *
//  * @param {Object} props - Propriétés du composant.
//  * @param {string} props.userId - ID unique de l'utilisateur pour le suivi du statut.
//  * @returns {JSX.Element} Le composant OnlineStatus.
//  */

// const OnlineStatus = ({ userId }) => {
//   const { online, lastSeen, setUserStatus } = useUserStatusStore();

//   useEffect(() => {
//     const handleUserPresence = (user) => {
//       if (!user || !userId) return; // Sortie si l'utilisateur n'est pas connecté ou si userId est manquant

//       const userStatusRef = ref(rdb, `users/${userId}/status`);
//       const isOnlineStatus = {
//         state: "online",
//         last_changed: serverTimestamp(),
//       };
//       const isOfflineStatus = {
//         state: "offline",
//         last_changed: serverTimestamp(),
//       };

//       // Définir l'utilisateur comme en ligne
//       set(userStatusRef, isOnlineStatus);
//       onDisconnect(userStatusRef).set(isOfflineStatus);

//       // Configurer un intervalle pour garder l'utilisateur en ligne toutes les 30 secondes
//       const heartbeatInterval = setInterval(() => {
//         set(userStatusRef, isOnlineStatus);
//       }, 30000);

//       // Écoute des changements de statut en ligne/hors ligne dans la Realtime Database
//       const unsubscribe = onValue(userStatusRef, (snapshot) => {
//         const status = snapshot.val();
//         if (status) {
//           setUserStatus(status.state === "online", status.last_changed);
//         }
//       });

//       // Gérer la déconnexion de l'utilisateur quand la fenêtre se ferme
//       const handleOffline = () => {
//         clearInterval(heartbeatInterval);
//         set(userStatusRef, isOfflineStatus);
//       };

//       window.addEventListener("beforeunload", handleOffline);

//       // Nettoyer les écouteurs et l'intervalle au démontage du composant
//       return () => {
//         window.removeEventListener("beforeunload", handleOffline);
//         unsubscribe();
//         clearInterval(heartbeatInterval);
//       };
//     };

//     // Écouter l'état d'authentification et appliquer la présence utilisateur
//     const unsubscribeAuth = auth.onAuthStateChanged(handleUserPresence);

//     // Nettoyage au démontage du composant
//     return () => unsubscribeAuth();
//   }, [userId, setUserStatus]);

//   return (
//     <div className="status">
//       {online ? (
//         <span className="online">Online</span>
//       ) : (
//         <span className="offline">
//           Last online <Chrono date={lastSeen} />
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;

// import { useEffect } from "react";
// import { ref, onValue, set, serverTimestamp } from "firebase/database";
// import { useUserStatusStore } from "../../lib/userStatus"; // Zustand store
// import Chrono from "../chrono/Chrono"; // Assurez-vous que le chemin est correct
// import { auth, rdb } from "../../lib/firebase"; // Assurez-vous que le chemin est correct
// import "./status.css";

// /**
//  * OnlineStatus Component
//  * Displays the online status of the user (online or last seen).
//  *
//  * @param {Object} props - Component properties.
//  * @param {string} props.userId - The unique ID of the user for tracking status.
//  * @returns {JSX.Element} The OnlineStatus component.
//  */

// const OnlineStatus = ({ userId }) => {
//   const { online, lastSeen, setUserStatus } = useUserStatusStore();

//   useEffect(() => {
//     const handleUserPresence = (user) => {
//       if (!user || !userId) return; // Sortie si l'utilisateur n'est pas connecté ou si userId est manquant

//       const userStatusRef = ref(rdb, `users/${userId}/status`);

//       // Définir les statuts en ligne et hors ligne
//       const isOnlineStatus = {
//         state: "online",
//         last_changed: serverTimestamp(),
//       };
//       const isOfflineStatus = {
//         state: "offline",
//         last_changed: serverTimestamp(),
//       };

//       // Mettre l'utilisateur en ligne dans la Realtime Database
//       set(userStatusRef, isOnlineStatus);

//       // Configurer un intervalle de heartbeat toutes les 30 secondes
//       const heartbeatInterval = setInterval(() => {
//         set(userStatusRef, {
//           state: "online",
//           last_changed: serverTimestamp(),
//         });
//       }, 30000); // 30 secondes

//       // Souscrire aux changements de statut dans la Realtime Database
//       const unsubscribe = onValue(userStatusRef, (snapshot) => {
//         if (snapshot.exists()) {
//           const status = snapshot.val();
//           setUserStatus(status.state === "online", status.last_changed);
//         }
//       });

//       // Définir l'utilisateur comme hors ligne en cas de fermeture de la fenêtre
//       const handleOffline = () => {
//         clearInterval(heartbeatInterval); // Arrêter le heartbeat
//         set(userStatusRef, isOfflineStatus);
//       };

//       window.addEventListener("beforeunload", handleOffline);

//       // Nettoyer les écouteurs et l'intervalle de heartbeat au démontage
//       return () => {
//         window.removeEventListener("beforeunload", handleOffline);
//         unsubscribe();
//         clearInterval(heartbeatInterval);
//       };
//     };

//     // Écouter les changements d'état d'authentification
//     const unsubscribeAuth = auth.onAuthStateChanged(handleUserPresence);

//     // Nettoyer le listener d'authentification au démontage du composant
//     return () => unsubscribeAuth();
//   }, [userId, setUserStatus]);

//   return (
//     <div className="status">
//       {online ? (
//         <span className="online">online</span>
//       ) : (
//         <span className="offline">
//           Last online <Chrono date={lastSeen} />
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;



  // const setupStreams = async (pc, isVideo, localVideoRef, remoteVideoRef) => {
  //   try {
  //     const localStream = await prepareMediaStream(isVideo);

  //     localStream.getTracks().forEach((track) => {
  //       pc.addTrack(track, localStream);
  //     });

  //     // Attache le flux local
  //     if (localVideoRef?.current) {
  //       localVideoRef.current.srcObject = localStream;
  //       await localVideoRef.current.play();
  //     }

  //     pc.ontrack = (event) => {
  //       const remoteStream = new MediaStream();
  //       event.streams[0].getTracks().forEach((track) => {
  //         remoteStream.addTrack(track);
  //       });

  //       setRemoteStream(remoteStream);

  //       // Attache le flux distant
  //       if (remoteVideoRef?.current) {
  //         remoteVideoRef.current.srcObject = remoteStream;
  //         remoteVideoRef.current.play();
  //       }
  //     };

  //     pc.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         console.log("ICE Candidate :", event.candidate);
  //       }
  //     };

  //     updateCallStatus({ localStream });
  //   } catch (error) {
  //     console.error("Erreur lors de la configuration des flux :", error);
  //     resetCallState();
  //   }
  // };

  // const setupStreams = async (pc, isVideo) => {
  //   const { setLocalStream, setRemoteStream } = useCallStore.getState();

  //   try {
  //     const localStream = await navigator.mediaDevices.getUserMedia({
  //       audio: true,
  //       video: isVideo,
  //     });

  //     // Ajouter les pistes locales au peer connection
  //     localStream
  //       .getTracks()
  //       .forEach((track) => pc.addTrack(track, localStream));

  //     // Mettre à jour le flux local dans le store
  //     setLocalStream(localStream);

  //     // Écoute des flux distants
  //     pc.ontrack = (event) => {
  //       const remoteStream = new MediaStream();
  //       event.streams[0]
  //         .getTracks()
  //         .forEach((track) => remoteStream.addTrack(track));

  //       // Mettre à jour le flux distant dans le store
  //       setRemoteStream(remoteStream);
  //     };

  //     pc.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         // Gérer les ICE candidates
  //       }
  //     };
  //   } catch (error) {
  //     console.error("Erreur lors de la configuration des flux :", error);
  //   }
  // };
  // const setupStreams = async (pc, isVideo) => {
  //   try {
  //     const localStream = await prepareMediaStream(isVideo);

  //     localStream.getTracks().forEach((track) => {
  //       pc.addTrack(track, localStream);
  //     });

  //     setLocalStream(localStream);

  //     pc.ontrack = (event) => {
  //       const remoteStream = new MediaStream();
  //       event.streams[0].getTracks().forEach((track) =>
  //         remoteStream.addTrack(track)
  //       );
  //       setRemoteStream(remoteStream);
  //     };

  //     pc.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         console.log("ICE Candidate:", event.candidate);
  //       }
  //     };
  //   } catch (error) {
  //     console.error("Erreur lors de la configuration des flux :", error);
  //   }
  // };


// import create from "zustand";
// import { persist, devtools } from "zustand/middleware";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "./firebase";

// const initialCallState = {
//   isCalling: false,
//   isRinging: false,
//   isInCall: false,
//   isVideoCall: false,
//   callId: null,
//   localStream: null,
//   remoteStream: null,
//   error: null,
//   callerId: null,
//   receiverId: null,
//   currentSound: null,
//   callActive: false,
//   isIncomingCall: false,
//   isOutgoingCall: false,
//   localStream: null,
//   remoteStream: null,
//   localVideoRef: { current: null },
//   remoteVideoRef: { current: null },
// };

// export const useCallStore = create(
//   devtools(
//     persist(
//       (set, get) => ({
//         callState: { ...initialCallState },

//         checkReceiverAvailability: async (receiverId) => {
//           try {
//             const receiverDoc = await getDoc(doc(db, "users", receiverId));
//             if (!receiverDoc.exists()) {
//               console.error(
//                 "Le destinataire n'existe pas dans la base de données :",
//                 receiverId
//               );
//               return false;
//             }
//             const receiverData = receiverDoc.data();
//             console.log("Données du destinataire :", receiverData);
//             return receiverData?.status?.state === "online"; // Vérifie si le destinataire est en ligne
//           } catch (error) {
//             console.error(
//               "Erreur lors de la vérification de disponibilité :",
//               error
//             );
//             return false; // Retourne indisponible en cas d'erreur
//           }
//         },

//         // Mettre à jour l'état de l'appel
//         updateCallStatus: (status) => {
//           set((state) => ({
//             callState: { ...state.callState, ...status },
//           }));
//         },

//         //Réinitialiser l'état de l'appel
//         // resetCallState: () => {
//         //   const { localStream, remoteStream } = get().callState;
//         //   if (localStream) {
//         //     localStream.getTracks().forEach((track) => track.stop());
//         //   }
//         //   if (remoteStream) {
//         //     remoteStream.getTracks().forEach((track) => track.stop());
//         //   }
//         //   set({ callState: { ...initialCallState } });
//         // },
//         resetCallState: () => {
//           const { localStream, remoteStream } = get().callState;

//           if (localStream instanceof MediaStream) {
//             localStream.getTracks().forEach((track) => track.stop());
//           } else {
//             console.error(
//               "localStream n'est pas un MediaStream valide :",
//               localStream
//             );
//           }

//           if (remoteStream instanceof MediaStream) {
//             remoteStream.getTracks().forEach((track) => track.stop());
//           } else {
//             console.error(
//               "remoteStream n'est pas un MediaStream valide :",
//               remoteStream
//             );
//           }

//           set({ callState: { ...initialCallState } });
//         },

//         attachStreams: (localStream, remoteStream, localVideoRef, remoteVideoRef) => {
//           try {
//             if (localStream && localVideoRef?.current) {
//               localVideoRef.current.srcObject = localStream;
//               localVideoRef.current.play().catch((err) =>
//                 console.error("Erreur de lecture du flux local :", err)
//               );
//             }

//             if (remoteStream && remoteVideoRef?.current) {
//               remoteVideoRef.current.srcObject = remoteStream;
//               remoteVideoRef.current.play().catch((err) =>
//                 console.error("Erreur de lecture du flux distant :", err)
//               );
//             }
//           } catch (error) {
//             console.error("Erreur lors de l'attachement des flux :", error);
//           }
//         },
//       }));

//       setLocalStream: (stream) => {
//           set((state) => ({
//             callState: { ...state.callState, localStream: stream },
//           }));
//         },

//         setRemoteStream: (stream) => {
//           set((state) => ({
//             callState: { ...state.callState, remoteStream: stream },
//           }));
//         },

//         // playSound: (sound, loop = false) => {
//         //   // Arrêter le son actuel avant d'en jouer un nouveau
//         //   const { currentSound } = get();
//         //   if (currentSound instanceof Audio) {
//         //     currentSound.pause();
//         //   }

//         //   // Créer une nouvelle instance Audio
//         //   const audio = new Audio(`/${sound}.mp3`);
//         //   audio.loop = loop;

//         //   // Jouer le son
//         //   audio.play().catch((err) => {
//         //     console.error("Erreur lors de la lecture du son :", err);
//         //   });

//         //   // Mettre à jour l'état
//         //   set({ currentSound: audio });
//         // },

//         // stopSound: () => {
//         //   const { currentSound } = get();
//         //   if (currentSound instanceof Audio) {
//         //     currentSound.pause();
//         //     currentSound.currentTime = 0; // Réinitialiser le son
//         //   }
//         // },

//         playSound: (type, loop = false) => {
//           try {
//             const sounds = {
//               apemis: new Audio("apemis.mp3"),
//               apfinis: new Audio("apfinis.mp3"),
//               ringtone: new Audio("ringtone.mp3"),
//             };
//             const currentSound = sounds[type];
//             if (get().callState.currentSound) {
//               get().callState.currentSound.pause();
//               get().callState.currentSound.currentTime = 0;
//             }
//             if (currentSound) {
//               currentSound.loop = loop;
//               currentSound.play();
//             }
//             set((state) => ({
//               callState: { ...state.callState, currentSound },
//             }));
//           } catch (error) {
//             console.error("Erreur lors de la lecture du son :", error);
//           }
//         },

//         // Arrêter le son
//         stopSound: () => {
//           const { currentSound } = get().callState;
//           if (currentSound instanceof Audio) {
//             currentSound.pause();
//             currentSound.currentTime = 0;
//           }
//           set((state) => ({
//             callState: { ...state.callState, currentSound: null },
//           }));
//         },
//       }),
//       { name: "call-store" }
//     )
//   )
// );


// const cleanupCall = () => {
//   if (peerConnection) {
//     peerConnection.close();
//     setPeerConnection(null);
//   }

//   const { localStream, remoteStream } = useCallStore.getState();

//   if (localStream.getTracks) {
//     localStream.getTracks().forEach((track) => track.stop());
//     // {
//     //   if (isVideoCall || track.kind === "audio") {
//     //     track.stop();
//     //   }
//     // });
//   }

//   if (remoteStream) {
//     remoteStream.getTracks().forEach((track) => track.stop());
//     // {
//     //   if (isVideoCall || track.kind === "audio") {
//     //     track.stop();
//     //   }
//     // });
//   }

//   stopSound();
//   resetCallState();
// };
// const cleanupCall = () => {
//   const { localStream, remoteStream } = useCallStore.getState();

//   if (localStream) {
//     console.log("localStream avant arrêt :", localStream);
//     if (localStream.getTracks) {
//       localStream.getTracks().forEach((track) => track.stop());
//     } else {
//       console.error(
//         "localStream n'a pas de méthode getTracks :",
//         localStream
//       );
//     }
//   }

//   if (remoteStream) {
//     console.log("remoteStream avant arrêt :", remoteStream);
//     if (remoteStream.getTracks) {
//       remoteStream.getTracks().forEach((track) => track.stop());
//     } else {
//       console.error(
//         "remoteStream n'a pas de méthode getTracks :",
//         remoteStream
//       );
//     }
//   }

//   stopSound();
//   resetCallState();
// };

// const prepareMediaStream = async (isVideo) => {
//   try {
//     const constraints = { audio: true, video: isVideo };
//     const stream = await navigator.mediaDevices.getUserMedia(constraints);
//     updateCallStatus({ localStream: stream });
//     return stream;
//   } catch (error) {
//     console.error("Erreur lors de l'accès au média :", error);
//     throw error;
//   }
// };

// const setupStream = (pc) => {
//   pc.ontrack = (event) => {
//     const remoteStream = new MediaStream();
//     event.streams[0]
//       .getTracks()
//       .forEach((track) => remoteStream.addTrack(track));
//     updateCallStatus({ remoteStream });
//   };

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       console.log("Candidat ICE :", event.candidate);
//       // Transmettre les candidats ICE via Firestore si nécessaire
//     }
//   };

//   return pc;
// };

// const setupStreams = async (pc, isVideo) => {
// try {
//   const localStream = await prepareMediaStream(isVideo);
//   localStream
//     .getTracks()
//     .forEach((track) => pc.addTrack(track, localStream));
//   updateCallStatus({ localStream });

//   pc.ontrack = (event) => {
//     const remoteStream = new MediaStream();
//     event.streams[0]
//       .getTracks()
//       .forEach((track) => remoteStream.addTrack(track));
//     updateCallStatus({ remoteStream });
//   };

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       // Gérer l'échange d'ICE candidates via Firestore si nécessaire
//     }
//   };
// } catch (error) {
//   console.error("Erreur lors de la configuration des flux :", error);
//   resetCallState();
// }
//     };

// const prepareMediaStream = async (isVideo) => {
//   try {
//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: true,
//       video: isVideo,
//     });
//     return stream;
//   } catch (error) {
//     throw new Error("Impossible d'accéder au média.");
//   }
// };

// const setupStreams = async (pc, isVideo) => {
//   try {
//     const localStream = await prepareMediaStream(isVideo);

//     // Test pour vérifier que le flux est bien obtenu
//     console.log("Flux local :", localStream);

//     const localVideoElement = document.getElementById("localVideo");
//     if (localVideoElement) {
//       localVideoElement.srcObject = localStream;
//       await localVideoElement.play();
//     }

//     localStream
//       .getTracks()
//       .forEach((track) => pc.addTrack(track, localStream));
//     updateCallStatus({ localStream });

//     pc.ontrack = (event) => {
//       const remoteStream = new MediaStream();
//       event.streams[0]
//         .getTracks()
//         .forEach((track) => remoteStream.addTrack(track));
//       console.log("Flux distant :", remoteStream);

//       const remoteVideoElement = document.getElementById("remoteVideo");
//       if (remoteVideoElement) {
//         remoteVideoElement.srcObject = remoteStream;
//         remoteVideoElement.play();
//       }

//       updateCallStatus({ remoteStream });
//     };
//   } catch (error) {
//     console.error("Erreur lors de la configuration des flux :", error);
//     resetCallState();
//   }
// };

// const setupStreams = async (pc, isVideo) => {
//   const { setLocalStream, setRemoteStream } = useCallStore.getState();

//   try {
//     const localStream = await navigator.mediaDevices.getUserMedia({
//       audio: true,
//       video: isVideo,
//     });

//     // Ajouter les pistes locales au peer connection
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

//     // Mettre à jour le flux local dans le store
//     setLocalStream(localStream);

//     // Écoute des flux distants
//     pc.ontrack = (event) => {
//       const remoteStream = new MediaStream();
//       event.streams[0]
//         .getTracks()
//         .forEach((track) => remoteStream.addTrack(track));

//       // Mettre à jour le flux distant dans le store
//       setRemoteStream(remoteStream);
//     };

//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         // Gérer les ICE candidates
//       }
//     };
//   } catch (error) {
//     console.error("Erreur lors de la configuration des flux :", error);
//   }
// };

  // const prepareMediaStream = async (isVideo) => {
  //   try {
  //     const constraints = { audio: true, video: isVideo };
  //     const localStream = await navigator.mediaDevices.getUserMedia(
  //       constraints
  //     );

  //     if (!localStream || !(localStream instanceof MediaStream)) {
  //       throw new Error("Le flux obtenu n'est pas valide.");
  //     }
  //     setLocalStream(localStream);
  //     return localStream;
  //   } catch (error) {
  //     console.error("Erreur d'accès aux médias :", error.message);
  //     throw error;
  //   }
  // };

  // const attachStreams = (localStream, remoteStream) => {
  //   const { localVideoRef, remoteVideoRef } = get().callState;

  //   try {
  //     if (localStream && localVideoRef?.current) {
  //       localVideoRef.current.srcObject = localStream;
  //       localVideoRef.current.play();
  //     }

  //     if (remoteStream && remoteVideoRef?.current) {
  //       remoteVideoRef.current.srcObject = remoteStream;
  //       remoteVideoRef.current.play();
  //     }
  //   } catch (error) {
  //     console.error("Erreur d'attachement des flux :", error);
  //   }
  // };

  // const setupStreams = async (pc, isVideo) => {
  //   try {
  //     const localStream = await prepareMediaStream(isVideo);
  //     localStream
  //       .getTracks()
  //       .forEach((track) => pc.addTrack(track, localStream));

  //     pc.ontrack = (event) => {
  //       const remoteStream = new MediaStream();
  //       event.streams[0]
  //         .getTracks()
  //         .forEach((track) => remoteStream.addTrack(track));

  //       setRemoteStream(remoteStream);

  //       // Attache les flux vidéo/audio local et distant

  //       attachStreams(localStream, remoteStream);
  //     };

  //     pc.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         console.log("Nouvelle ICE candidate :", event.candidate);
  //       }
  //     };
  //   } catch (error) {
  //     console.error("Erreur lors de la configuration des flux :", error);
  //     resetCallState();
  //   }
  // };

  // const prepareMediaStream = async (isVideo) => {
  //   try {
  //     const constraints = { audio: true, video: isVideo };
  //     const localStream = await navigator.mediaDevices.getUserMedia(
  //       constraints
  //     );

  //     if (!(localStream instanceof MediaStream)) {
  //       throw new Error("Le flux obtenu n'est pas un MediaStream valide.");
  //     }

  //     setLocalStream(localStream);
  //     return localStream;
  //   } catch (error) {
  //     console.error("Impossible d'accéder au média :", error);
  //     throw new Error("Accès refusé à l'audio/vidéo.");
  //   }
  // };

  // const setupStreams = async (pc, isVideo) => {
  //   try {
  //     //   const localStream = await navigator.mediaDevices.getUserMedia({
  //     //     audio: true,
  //     //     video: isVideo,
  //     //   });

  //     // setLocalStream(localStream);
  //     const localStream = await prepareMediaStream(isVideo);
  //     localStream
  //       .getTracks()
  //       .forEach((track) => pc.addTrack(track, localStream));

  //     pc.ontrack = (event) => {
  //       const remoteStream = new MediaStream();
  //       event.streams[0]
  //         .getTracks()
  //         .forEach((track) => remoteStream.addTrack(track));

  //       setRemoteStream(remoteStream);
  //       attachStreams(localStream, remoteStream);
  //     };

  //     pc.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         console.log("Nouvelle ICE candidate :", event.candidate);
  //       }
  //     };
  //   } catch (error) {
  //     console.error("Erreur lors de la configuration des flux :", error);
  //     resetCallState();
  //   }
  // };

  // const monitorCallState = (callId) => {
  //   const callDoc = doc(db, "calls", callId);

  //   onSnapshot(callDoc, (snapshot) => {
  //     const data = snapshot.data();
  //     if (!data) return;

  //     if (data.status === "ended") {
  //       if (!callState.isIncall) return;
  //       cleanupCall();
  //       playSound("apfinis", false);
  //     } else if (data.status === "calling" || data.status === "ringing") {
  //       updateCallStatus({
  //         // isCalling: true,
  //         isCalling: data.status === "calling",
  //         isRinging: data.status === "ringing",
  //       });
  //     } else if (data.status === "in_call") {
  //       updateCallStatus({ isInCall: true });
  //     }

  //     if (data.rejected) {
  //       playSound("apfinis", false);
  //       cleanupCall();
  //       updateCallStatus({ isInCall: false, isCalling: false });
  //     }
  //   });
  // };

  /**
   * Démarre un appel
   */

   // Importations nécessaires
import React, { useState, useRef, useEffect } from "react";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Configurez Firebase ici
import { useStore } from "zustand";

const AudioCall = ({ callId, isCaller, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  // Configuration des serveurs STUN/TURN
  const servers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      // Ajoutez TURN si nécessaire
    ],
  };

  useEffect(() => {
    // Prépare le PeerConnection
    peerConnection.current = new RTCPeerConnection(servers);

    // Gestion des flux locaux
    peerConnection.current.ontrack = (event) => {
      const remoteStream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      setRemoteStream(remoteStream);
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        updateCallData(callId, { candidate: event.candidate });
      }
    };

    if (isCaller) {
      startCall();
    } else {
      answerCall();
    }

    return () => {
      endCall();
    };
  }, []);

  const prepareMediaStream = async (isVideo) => {
    try {
      const constraints = { audio: true, video: isVideo };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });
      return stream;
    } catch (error) {
      console.error("Erreur d'accès aux médias :", error.message);
      alert("Erreur d'accès à la caméra ou au micro.");
    }
  };

  const startCall = async () => {
    const localStream = await prepareMediaStream(false);
    attachStream(localStream, "local", localVideoRef);

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    await setDoc(doc(db, "calls", callId), { offer });
  };

  const answerCall = async () => {
    const callDoc = doc(db, "calls", callId);
    const callData = (await getDoc(callDoc)).data();

    if (callData?.offer) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(callData.offer)
      );

      const localStream = await prepareMediaStream(false);
      attachStream(localStream, "local", localVideoRef);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      await setDoc(callDoc, { answer }, { merge: true });
    }

    // Surveiller les ICE candidates
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.candidate) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
  };

  const endCall = async () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    onEndCall();
  };

  const attachStream = (stream, type, ref) => {
    if (ref.current) {
      ref.current.srcObject = stream;
    } else {
      console.warn(`Impossible d'attacher ${type} stream : ref non définie.`);
    }
  };

  return (
    <div className="audio-call">
      <video ref={localVideoRef} autoPlay muted playsInline style={{ display: "none" }} />
      <video ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />
      <button onClick={endCall}>Terminer l'appel</button>
    </div>
  );
};

export default AudioCall;


  // const startCall = async (callId, isVideo, callerId, receiverId) => {
  //   try {
  //     const pc = setupPeerConnection();
  //     await setupStreams(pc, isVideo);

  //     const offer = await pc.createOffer();
  //     await pc.setLocalDescription(offer);

  //     await setDoc(doc(db, "calls", callId), {
  //       callerId,
  //       receiverId,
  //       offer: { type: offer.type, sdp: offer.sdp },
  //       type: isVideo ? "video" : "audio",
  //       status: "calling",
  //       createdAt: new Date(),
  //     });

  //     playSound("apemis", true);
  //     updateCallStatus({ isCalling: true });
  //     monitorCallState(callId);
  //   } catch (error) {
  //     console.error("Erreur lors de l'initiation de l'appel :", error);
  //     resetCallState();
  //   }
  // };

  // /**
  //  * Répond à un appel entrant.
  //  * @param {string} callId - Identifiant unique de l'appel.
  //  */
  // const answerCall = async (callId) => {
  //   try {
  //     const callDoc = doc(db, "calls", callId);
  //     const callData = (await getDoc(callDoc)).data();

  //     // const callData = callDoc.data();

  //     const pc = setupPeerConnection();
  //     await setupStreams(pc, callData.type === "video");

  //     await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
  //     const answer = await pc.createAnswer();
  //     await pc.setLocalDescription(answer);

  //     // await setDoc(
  //     //   callDoc,
  //     //   { answer: { type: answer.type, sdp: answer.sdp }, status: "in_call" },
  //     //   { merge: true }
  //     // );
  //     await updateDoc(doc(db, "calls", callId), {
  //       answer: answer.toJSON(),
  //       status: "in_call",
  //       merge:true,
  //     });
  //     updateCallStatus({ isInCall: true });
  //     playSound("ringtone", true);
  //   } catch (error) {
  //     console.error("Erreur lors de la réponse à l'appel :", error);
  //     resetCallState();
  //   }
  // };
// import { useState, useEffect, useRef } from "react";
// import { doc, setDoc, onSnapshot, getDoc, set } from "firebase/firestore";
// import { db } from "./firebase";
// import { useCallStore } from "./useCall";

// const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// export function useCallData() {
//   const {
//     updateCallStatus,
//     resetCallState,
//     playSound,
//     stopSound,
//     callState,
//     setLocalStream,
//     setRemoteStream,
//     attachStream,
//     // callId,
//   } = useCallStore();

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const [peerConnection, setPeerConnection] = useState(null);

//   useEffect(() => {
//     // Cleanup lors du démontage du composant
//     return () => cleanupCall();
//   }, []);

//   const prepareMediaStream = async (isVideo) => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: isVideo,
//       });
//       console.log("Flux local obtenu :", stream);
//       return stream;
//     } catch (error) {
//       throw new Error("Impossible d'accéder au média.");
//     }
//   };

//   const setupStreams = async (pc, isVideo) => {
//     try {
//       const localStream = await prepareMediaStream(isVideo);

//       // Test pour vérifier que le flux est bien obtenu
//       console.log("Flux local :", localStream);

//       // Connexion du flux local avec le ref vidéo local
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = localStream;
//         await localVideoRef.current.play().catch((error) => {
//           console.error("Erreur lors de la lecture du flux local :", error);
//         });
//       } else {
//         console.error("Référence vidéo locale non trouvée.");
//       }
//       // setLocalStream(localStream);
//       // const localVideoElement = document.getElementById("localVideo");
//       // if (localVideoElement) {
//       //   localVideoElement.srcObject = localStream;
//       //   await localVideoElement.play();
//       // }

//       localStream
//         .getTracks()
//         .forEach((track) => pc.addTrack(track, localStream));
//       updateCallStatus({ localStream });

//       pc.ontrack = (event) => {
//         console.log("Nouvelle piste reçue :", event.streams[0]);
//         const remoteStream = new MediaStream();
//         event.streams[0]
//           .getTracks()
//           .forEach((track) => remoteStream.addTrack(track));
//         remoteVideoRef.current.srcObject = remoteStream;
//         remoteVideoRef.current.play();
//         console.log("Flux distant :", remoteStream);
//         attachStream(localStream, "local", localVideoRef);
//         // setRemoteStream(remoteStream);

//         // const remoteVideoElement = document.getElementById("remoteVideo");
//         // if (remoteVideoElement) {
//         //   remoteVideoElement.srcObject = remoteStream;
//         //   remoteVideoElement.play();
//         // }

//         // Connexion du flux distant avec le ref vidéo distant
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = remoteStream;
//           remoteVideoRef.current.play().catch((error) => {
//             console.error("Erreur lors de la lecture du flux distant :", error);
//           });
//           attachStream(remoteStream, "remote", remoteVideoRef);
//         } else {
//           console.error("Référence vidéo distante non trouvée.");
//         }
//         updateCallStatus({ remoteStream });
//         return remoteStream;

//         set((state) => ({
//           callState: {
//             ...state.callState,
//             localStreaam: localStream,
//             remoteStream: remoteStream || null,
//           },
//         }));
//       };
//     } catch (error) {
//       console.error("Erreur lors de la configuration des flux :", error);
//       resetCallState();
//     }
//   };

// const monitorCallState = (callId) => {
//   const callDoc = doc(db, "calls", callId);

//   onSnapshot(callDoc, (snapshot) => {
//     const data = snapshot.data();
//     if (!data) return;

//     if (data.status === "ended") {
//       if (!callState.isIncall) return;
//       cleanupCall();
//       playSound("apfinis", false);
//     } else if (data.status === "calling" || data.status === "ringing") {
//       updateCallStatus({
//         // isCalling: true,
//         isCalling: data.status === "calling",
//         isRinging: data.status === "ringing",
//       });
//     } else if (data.status === "in_call") {
//       updateCallStatus({ isInCall: true });
//     }

//     if (data.rejected) {
//       playSound("apfinis", false);
//       cleanupCall();
//       updateCallStatus({ isInCall: false, isCalling: false });
//     }
//   });
// };

//   const setupPeerConnection = () => {
//     const pc = new RTCPeerConnection(ICE_SERVERS);
//     setPeerConnection(pc);
//     console.log("trcpeerconnection", pc);

//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Candidat ICE :", event.candidate);
//         // Envoie des candidats ICE à Firebase (ou via un autre serveur de signalisation)
//       } else {
//         console.log("Tous les candidats ICE ont été envoyés.");
//       }
//     };

//     pc.oniceconnectionstatechange = () => {
//       console.log("État ICE :", pc.iceConnectionState);
//       if (pc.iceConnectionState === "failed") {
//         console.error("Échec de la connexion ICE");
//         cleanupCall();
//       }
//     };

//     return pc;
//   };

//   const startCall = async (callId, isVideo = false, callerId, receiverId) => {
//     try {
//       if (!callId || !receiverId) {
//         throw new Error("callId et receiverId sont requis.");
//       }

//       // const pc = new RTCPeerConnection(ICE_SERVERS);
//       // setPeerConnection(pc);

//       const pc = setupPeerConnection();
//       await setupStreams(pc, isVideo);

//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);

//       await setDoc(doc(db, "calls", callId), {
//         callerId,
//         receiverId,
//         offer: { type: offer.type, sdp: offer.sdp },
//         type: isVideo ? "video" : "audio",
//         status: "calling",
//         createdAt: new Date(),
//       });

//       playSound("apemis", true);
//       updateCallStatus({ isCalling: true });
//       monitorCallState(callId);
//     } catch (error) {
//       console.error("Erreur lors de l'initiation de l'appel :", error);
//       resetCallState();
//     }
//   };
//   const initializeCall = async ({ callId, isVideo, callerId, receiverId }) => {
//     try {
//       console.log("Initializing call with:", {
//         callId,
//         isVideo,
//         callerId,
//         receiverId,
//       });

//       const localStream = await prepareMediaStream(isVideo);

//       startCall(callId, isVideo, callerId, receiverId); // Lancer l'appel après initialisation

//       updateCallStatus({
//         callId,
//         isCalling: true,
//         isOutgoingCall: true,
//         isVideoCall: isVideo,
//         callerId,
//         receiverId,
//         localStream,
//       });
//     } catch (error) {
//       console.error("Erreur d'initialisation :", error);
//       resetCallState();
//     }
//   };

//   /**
//    * Répond à un appel
// //    */
// const answerCall = async (callId) => {
//   try {
//     const callDoc = doc(db, "calls", callId);
//     const callData = (await getDoc(callDoc)).data();

//     // const pc = new RTCPeerConnection(ICE_SERVERS);
//     // setPeerConnection(pc);
//     const pc = setupPeerConnection();

//     setupStreams(pc, callData.type === "video");

//     await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);

//     await setDoc(
//       callDoc,
//       {
//         answer: { type: answer.type, sdp: answer.sdp },
//         status: "in_call",
//       },
//       { merge: true }
//     );

//     playSound("ringing", true);
//     updateCallStatus({ isInCall: true });
//   } catch (error) {
//     console.error("Erreur lors de la réponse :", error);
//     resetCallState();
//   }
// };

//   /**
//    * Met fin à un appel
//    */
//   const endCall = async (callId) => {
//     try {
//       await setDoc(
//         doc(db, "calls", callId),
//         { status: "ended" },
//         { merge: true }
//       );
//       stopSound();
//       cleanupCall();
//     } catch (error) {
//       console.error("Erreur lors de la fin de l'appel :", error);
//     }
//   };

//   const cleanupCall = () => {
//     if (peerConnection) {
//       peerConnection.onicecandidate = null;
//       peerConnection.oniceconnectionstatechange = null;
//       peerConnection.close();
//       setPeerConnection(null);
//     }

//     const { localStream, remoteStream } = useCallStore.getState();

//     if (localStream instanceof MediaStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//     }

//     if (remoteStream instanceof MediaStream) {
//       remoteStream.getTracks().forEach((track) => track.stop());
//     }

//     stopSound();
//     resetCallState();
//   };

//   return {
//     initializeCall,
//     answerCall,
//     endCall,
//     cleanupCall,
//   };
// }

// useEffect(() => {
//   if (!callId) return;

//   const callDoc = doc(db, "calls", callId);

//   const unsubscribe = onSnapshot(callDoc, (snapshot) => {
//     const callData = snapshot.data();
//     if (!callData) return;

//     if (callData.accepted) {
//       updateCallStatus({ isInCall: true });
//       stopSound();

//       // Simuler les flux
//       const fakeLocalStream = new MediaStream();
//       const fakeRemoteStream = new MediaStream();
//       setLocalStream(fakeLocalStream);
//       setRemoteStream(fakeRemoteStream);
//       attachStream(fakeLocalStream, "local", localVideoRef);
//       attachStream(fakeRemoteStream, "remote", remoteVideoRef);
//     } else if (callData.rejected || callData.status === "ended") {
//       updateCallStatus({ isInCall: false });
//       resetCallState();
//     }
//   });

//   playSound("ringtone", true);

//   return () => {
//     unsubscribe();
//     stopSound();
//     resetCallState();
//   };
// }, [callId]);

// const prepareMediaStream = async (isVideo) => {
//   try {
//     const constraints = { audio: true, video: isVideo };
//     const localStream = await navigator.mediaDevices.getUserMedia(
//       constraints
//     );

//     setLocalStream(localStream);
//     return localStream;
//   } catch (error) {
//     console.error("Erreur d'accès aux médias :", error.message);
//     throw error;
//   }
// };

// const setupStreams = async (isVideo) => {
//   try {
//     const pc = new RTCPeerConnection(ICE_SERVERS);
//     setPeerConnection(pc);

//     const localStream = await prepareMediaStream(isVideo);
//     localStream
//       .getTracks()
//       .forEach((track) => pc.addTrack(track, localStream));

//     pc.ontrack = (event) => {
//       const remoteStream = new MediaStream();
//       event.streams[0]
//         .getTracks()
//         .forEach((track) => remoteStream.addTrack(track));
//       setRemoteStream(remoteStream);
//       attachStream(localStream, "local", localVideoRef);
//       attachStream(remoteStream, "remote", remoteVideoRef);
//     };

//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Nouvelle ICE candidate :", event.candidate);
//       }
//     };
//   } catch (error) {
//     console.error("Erreur lors de la configuration des flux :", error);
//     resetCallState();
//   }
// };

  const handleIconClick = (fileType) => {
    if (fileType === "camera") {
      setShowTakePhoto(true);
      setIsIconVisible(false);
    } else {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const determineFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    for (const [type, extensions] of Object.entries(extensionToTypeMap)) {
      if (extensions.includes(extension)) return type;
    }
    return null;
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setUploadError(
        "Certains fichiers dépassent la taille maximale autorisée (5 Mo)."
      );
      return;
    }

    const filesWithType = validFiles
      .map((file) => {
        const type = determineFileType(file.name);
        if (!type) {
          setUploadError(
            `Le fichier "${file.name}" a un type non pris en charge.`
          );
          return null;
        }
        return {
          file,
          type,
          preview: URL.createObjectURL(file),
        };
      })
      .filter(Boolean); // Élimine les fichiers invalides.

    setSelectedFiles((prev) => [...prev, ...filesWithType]);
    setUploadError(null);
  };

  const handleClearFiles = useCallback(() => {
    selectedFiles.forEach((fileObj) => URL.revokeObjectURL(fileObj.preview));
    setSelectedFiles([]);
    setUploadError(null);
    setIsIconVisible(true);
  }, [selectedFiles]);

  const handleSendFiles = () => {
    if (!selectedFiles.length) {
      setUploadError("Aucun fichier à envoyer.");
      return;
    }

    onSend({ files: selectedFiles });
    setSelectedFiles([]);
  };

  const renderFilePreviews = () => {
    return (
      <div className="file-preview">
        {selectedFiles.map((fileObj, index) => (
          <div key={`${fileObj.type}-${index}`} className="file-item">
            {fileObj.type === "image" && (
              <img
                src={fileObj.preview}
                alt={`image ${index + 1}`}
                style={{ maxWidth: "100px" }}
              />
            )}
            {fileObj.type === "video" && (
              <video
                src={fileObj.preview}
                controls
                style={{ maxWidth: "100px" }}
              />
            )}
            {fileObj.type === "audio" && (
              <audio src={fileObj.preview} controls />
            )}
            {fileObj.type === "document" && (
              <a
                href={fileObj.preview}
                target="_blank"
                rel="noopener noreferrer"
              >
                Document {index + 1}
              </a>
            )}
            {fileObj.type === "contact" && (
              <p>Contact {index + 1} sélectionné.</p>
            )}
          </div>
        ))}
      </div>
    );
  };

// import { useEffect, useState } from "react";
// import { ref, onValue } from "firebase/database";
// import { rtdb } from "../../lib/firebase";

// const OnlineStatus = ({ userId }) => {
//   const [status, setStatus] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!userId) {
//       setError("User ID is missing.");
//       return;
//     }

//     const userStatusRef = ref(rtdb, `status/${userId}`);

//     const unsubscribe = onValue(
//       userStatusRef,
//       (snapshot) => {
//         if (snapshot.exists()) {
//           setStatus(snapshot.val());
//           setError(null); // Clear any previous error
//         } else {
//           console.warn(`No status found for user ID: ${userId}`);
//           setStatus({ state: "offline", last_changed: null });
//         }
//       },
//       (err) => {
//         console.error("Error fetching status:", err);
//         setError("Permission denied or invalid path.");
//       }
//     );

//     return () => unsubscribe();
//   }, [userId]);

//   if (error) {
//     return <p style={{ color: "red" }}>{error}</p>;
//   }

//   if (!status) {
//     return <p>Loading status...</p>;
//   }

//   return (
//     <div className="online-status">
//       {status.state === "online" ? (
//         <span style={{ color: "green" }}>🟢 Online</span>
//       ) : (
//         <span style={{ color: "gray" }}>
//           ⚪ Last seen:{" "}
//           {status.last_changed
//             ? new Date(status.last_changed).toLocaleString()
//             : "Unknown"}
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;

// import { useEffect, useState } from "react";
// import { ref, onValue } from "firebase/database";
// import { rtdb } from "../../lib/firebase";

// const OnlineStatus = ({ userId }) => {
//   const [status, setStatus] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!userId) {
//       setError("User ID is missing.");
//       return;
//     }

//     const userStatusRef = ref(rtdb, `status/${userId}`);

//     const unsubscribe = onValue(
//       userStatusRef,
//       (snapshot) => {
//         if (snapshot.exists()) {
//           setStatus(snapshot.val());
//           setError(null); // Clear any previous error
//         } else {
//           console.warn(`No status found for user ID: ${userId}`);
//           setStatus({ state: "offline", last_changed: null });
//         }
//       },
//       (err) => {
//         console.error("Error fetching status:", err);
//         setError("Failed to load status.");
//       }
//     );

//     return () => unsubscribe();
//   }, [userId]);

//   if (error) {
//     return <p style={{ color: "red" }}>{error}</p>;
//   }

//   if (!status) {
//     return <p>Loading status...</p>;
//   }

//   return (
//     <div className="online-status">
//       {status.state === "online" ? (
//         <span style={{ color: "green" }}>🟢 Online</span>
//       ) : (
//         <span style={{ color: "gray" }}>
//           ⚪ Last seen:{" "}
//           {status.last_changed
//             ? new Date(status.last_changed).toLocaleString()
//             : "Unknown"}
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;

// import { useEffect, useState } from "react";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "../../lib/firebase";

// const OnlineStatus = ({ userId }) => {
//   const [status, setStatus] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!userId) {
//       setError("User ID is missing.");
//       return;
//     }

//     const userStatusRef = doc(db, "status", userId);

//     const unsubscribe = onSnapshot(
//       userStatusRef,
//       (snapshot) => {
//         if (snapshot.exists()) {
//           setStatus(snapshot.data());
//           setError(null); // Clear any previous error
//         } else {
//           console.warn(`No status found for user ID: ${userId}`);
//           setStatus({ state: "offline", last_changed: null });
//         }
//       },
//       (err) => {
//         console.error("Error fetching status:", err);
//         setError("Failed to load status.");
//       }
//     );

//     return () => unsubscribe();
//   }, [userId]);

//   if (error) {
//     return <p style={{ color: "red" }}>{error}</p>;
//   }

//   if (!status) {
//     return <p>Loading status...</p>;
//   }

//   return (
//     <div className="online-status">
//       {status.state === "online" ? (
//         <span style={{ color: "green" }}>Online</span>
//       ) : (
//         <span style={{ color: "gray" }}>
//           Last seen:{" "}
//           {status.last_changed
//             ? new Date(status.last_changed.toDate()).toLocaleString()
//             : "Unknown"}
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;

// import { useEffect, useState } from "react";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "../../lib/firebase";

// const OnlineStatus = ({ userId }) => {
//   const [status, setStatus] = useState(null);

//   useEffect(() => {
//       if (!userId) {
//         console.error("userId is undefined or empty");
//         return;
//       }
//     const userStatusRef = doc(db, "status", userId);

//     const unsubscribe = onSnapshot(userStatusRef, (snapshot) => {
//       if (snapshot.exists()) {
//         setStatus(snapshot.data());
//       } else {
//         setStatus({ state: "offline", last_changed: null });
//       }
//     });

//     return () => unsubscribe();
//   }, [userId]);

//   if (!status) {
//     return <p>Loading status...</p>;
//   }

//   return (
//     <div className="online-status">
//       {status.state === "online" ? (
//         <span style={{ color: "yellow" }}>Online</span>
//       ) : (
//         <span style={{ color: "gray" }}>
//           Last seen:{" "}
//           {status.last_changed
//             ? new Date(status.last_changed.toDate()).toLocaleString()
//             : "Unknown"}
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;

// import { useEffect, useState } from "react";
// import { auth, db } from "../../lib/firebase"; // Importez votre configuration Firebase
// import {
//   doc,
//   updateDoc,
//   onSnapshot,
//   serverTimestamp,
// } from "firebase/firestore";

// // Fonction Chrono pour formater la date et l'heure
// const Chrono = ({ timestamp }) => {
//   if (!timestamp) return "N/A";
//   const date = new Date(timestamp);
//   return date.toLocaleString("fr-FR", {
//     dateStyle: "short",
//     timeStyle: "short",
//   });
// };

// const OnlineStatus = ({ userId }) => {
//   const [online, setOnline] = useState(false); // État "en ligne" ou "hors ligne"
//   const [lastSeen, setLastSeen] = useState(null); // Dernière connexion
//   const [isCurrentUser, setIsCurrentUser] = useState(false); // Est-ce l'utilisateur connecté ?

//   useEffect(() => {
//     let unsubscribeSnapshot;

//     console.log("unsubscribesnapshot", unsubscribeSnapshot);
//     // Fonction pour mettre à jour Firestore
//     const updateFirestoreStatus = async (isOnline) => {
//       if (!auth.currentUser) return;

//       const userRef = doc(db, "users", auth.currentUser.uid); // Référence Firestore
//       try {
//         await updateDoc(userRef, {
//           isOnline: isOnline,
//           lastSeen: isOnline ? null : serverTimestamp(), // Ajoute un timestamp si hors ligne
//         });
//       } catch (error) {
//         console.error("Erreur lors de la mise à jour du statut :", error);
//       }
//     };

//     // Gestion de la visibilité pour l'utilisateur connecté
//     const handleVisibilityChange = async () => {
//       if (isCurrentUser) {
//         if (document.visibilityState === "visible") {
//           setOnline(true);
//           await updateFirestoreStatus(true);
//         } else {
//           setOnline(false);
//           await updateFirestoreStatus(false);
//         }
//       }
//     };

//     if (userId) {
//       // Surveiller un utilisateur spécifique (via userId)
//       const userRef = doc(db, "users", userId);
//       unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           setOnline(data.isOnline);
//           setLastSeen(data.lastSeen?.toMillis());
//         }
//       });
//     } else {
//       // Surveiller l'utilisateur connecté
//       setIsCurrentUser(true);

//       const authUnsubscribe = auth.onAuthStateChanged((user) => {
//         if (user) {
//           const userRef = doc(db, "users", user.uid);
//           console.log("userRef", userRef);

//           // Initialiser la présence en ligne
//           updateFirestoreStatus(true);

//           // Surveiller les mises à jour en temps réel
//           unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
//             if (docSnap.exists()) {
//               const data = docSnap.data();
//               setOnline(data.isOnline);
//               setLastSeen(data.lastSeen?.toMillis());
//             }
//           });
//         } else {
//           setOnline(false);
//           setLastSeen(null);
//         }
//       });

//       // Ajouter des événements pour surveiller la visibilité
//       document.addEventListener("visibilitychange", handleVisibilityChange);
//       window.addEventListener("focus", handleVisibilityChange);
//       window.addEventListener("blur", handleVisibilityChange);

//       return () => {
//         authUnsubscribe();
//         if (unsubscribeSnapshot) unsubscribeSnapshot();
//         document.removeEventListener(
//           "visibilitychange",
//           handleVisibilityChange
//         );
//         window.removeEventListener("focus", handleVisibilityChange);
//         window.removeEventListener("blur", handleVisibilityChange);
//       };
//     }

//     return () => {
//       if (unsubscribeSnapshot) unsubscribeSnapshot();
//     };
//   }, [userId, isCurrentUser]);

//   return (
//     <div>
//       {online ? (
//         <span style={{ color: "green" }}>Online</span>
//       ) : (
//         <span style={{ color: "red" }}>
//           Offline (Last seen: <Chrono timestamp={lastSeen} />)
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;

// import { useEffect, useState } from "react";
// import { auth, db } from "../../lib/firebase"; // Importez votre configuration Firebase
// import {
//   doc,
//   updateDoc,
//   onSnapshot,
//   serverTimestamp,
// } from "firebase/firestore";

// const OnlineStatus = ({ userId }) => {
//   const [online, setOnline] = useState(false); // État "en ligne" ou "hors ligne"
//   const [lastSeen, setLastSeen] = useState(null); // Dernière connexion

//   useEffect(() => {
//     let unsubscribeSnapshot;

//     // Fonction pour mettre à jour le statut Firestore de l'utilisateur connecté
//     const updateFirestoreStatus = async (isOnline) => {
//       if (!auth.currentUser) return;

//       const userRef = doc(db, "users", auth.userId); // Référence Firestore
//       try {
//         await updateDoc(userRef, {
//           isOnline: isOnline,
//           lastSeen: isOnline ? null : serverTimestamp(), // Si hors ligne, ajoute un timestamp
//         });
//       } catch (error) {
//         console.error("Erreur lors de la mise à jour du statut :", error);
//       }
//     };

//     // Gestion de la visibilité pour l'utilisateur connecté
//     const handleVisibilityChange = async () => {
//       if (document.visibilityState === "visible") {
//         setOnline(true);
//         await updateFirestoreStatus(true); // Utilisateur en ligne
//       } else {
//         setOnline(false);
//         await updateFirestoreStatus(false); // Utilisateur hors ligne
//       }
//     };

//     // Si aucun `userId` n'est fourni, traquer l'utilisateur connecté
//     if (!userId) {
//       const authUnsubscribe = auth.onAuthStateChanged((user) => {
//         if (user) {
//           updateFirestoreStatus(true); // Initialiser la présence

//           // Surveiller les mises à jour en temps réel pour l'utilisateur connecté
//           const userRef = doc(db, "users", user.uid);
//           unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
//             if (docSnap.exists()) {
//               const data = docSnap.data();
//               setOnline(data.isOnline);
//               setLastSeen(data.lastSeen?.toDate());
//             }
//           });
//         } else {
//           setOnline(false);
//           setLastSeen(null);
//         }
//       });

//       // Événements pour surveiller si l'utilisateur est actif sur la page
//       document.addEventListener("visibilitychange", handleVisibilityChange);
//       window.addEventListener("focus", handleVisibilityChange);
//       window.addEventListener("blur", handleVisibilityChange);

//       return () => {
//         authUnsubscribe();
//         if (unsubscribeSnapshot) unsubscribeSnapshot();
//         document.removeEventListener(
//           "visibilitychange",
//           handleVisibilityChange
//         );
//         window.removeEventListener("focus", handleVisibilityChange);
//         window.removeEventListener("blur", handleVisibilityChange);
//       };
//     }

//     // Si un `userId` est fourni, traquer un autre utilisateur
//     // if (userId) {
//     //   const userRef = doc(db, "users", userId);

//     //   // Surveiller les mises à jour en temps réel pour cet utilisateur
//     //   unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
//     //     if (docSnap.exists()) {
//     //       const data = docSnap.data();
//     //       setOnline(data.isOnline);
//     //       setLastSeen(data.lastSeen?.toDate());
//     //     }
//     //   });

//     //   return () => {
//     //     if (unsubscribeSnapshot) unsubscribeSnapshot();
//     //   };
//     // }
//   }, [userId]);

//   return (
//     <div>
//       {online ? (
//         <span style={{ color: "yellow" }}>Online</span>
//       ) : (
//         <span style={{ color: "red" }}>
//           Offline (Last seen: {lastSeen ? lastSeen.toLocaleString() : "N/A"})
//         </span>
//       )}
//     </div>
//   );
// };

// export default OnlineStatus;

// // import { useEffect, useState } from "react";
// // import { auth, db } from "../../lib/firebase"; // Importez votre configuration Firebase
// // import {
// //   doc,
// //   updateDoc,
// //   onSnapshot,
// //   serverTimestamp,
// // } from "firebase/firestore";

// // const UserPresence = () => {
// //   const [online, setOnline] = useState(false); // État "en ligne" ou "hors ligne"
// //   const [lastSeen, setLastSeen] = useState(null); // Dernière connexion

// //   useEffect(() => {
// //     let unsubscribeSnapshot;

// //     // Fonction pour mettre à jour le statut Firestore
// //     const updateFirestoreStatus = async (isOnline) => {
// //       if (!auth.currentUser) return;

// //       const userRef = doc(db, "users", auth.currentUser.uid); // Référence Firestore
// //       try {
// //         await updateDoc(userRef, {
// //           isOnline: isOnline,
// //           lastSeen: isOnline ? null : serverTimestamp(), // Si hors ligne, ajoute un timestamp
// //         });
// //       } catch (error) {
// //         console.error("Erreur lors de la mise à jour du statut :", error);
// //       }
// //     };

// //     // Gestion du statut utilisateur
// //     const handleVisibilityChange = async () => {
// //       if (document.visibilityState === "visible") {
// //         setOnline(true);
// //         await updateFirestoreStatus(true); // Utilisateur en ligne
// //       } else {
// //         setOnline(false);
// //         await updateFirestoreStatus(false); // Utilisateur hors ligne
// //       }
// //     };

// //     // Surveiller les changements d'état d'authentification
// //     const authUnsubscribe = auth.onAuthStateChanged((user) => {
// //       if (user) {
// //         // Initialiser la présence
// //         updateFirestoreStatus(true);

// //         // Surveiller les mises à jour en temps réel dans Firestore
// //         const userRef = doc(db, "users", user.uid);
// //         unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
// //           if (docSnap.exists()) {
// //             const data = docSnap.data();
// //             setOnline(data.isOnline);
// //             setLastSeen(data.lastSeen?.toDate());
// //           }
// //         });
// //       } else {
// //         setOnline(false);
// //         setLastSeen(null);
// //       }
// //     });

// //     // Événements pour surveiller si l'utilisateur est actif sur la page
// //     document.addEventListener("visibilitychange", handleVisibilityChange);
// //     window.addEventListener("focus", handleVisibilityChange);
// //     window.addEventListener("blur", handleVisibilityChange);

// //     return () => {
// //       // Nettoyage des écouteurs et désinscription des snapshots
// //       authUnsubscribe();
// //       if (unsubscribeSnapshot) unsubscribeSnapshot();
// //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// //       window.removeEventListener("focus", handleVisibilityChange);
// //       window.removeEventListener("blur", handleVisibilityChange);
// //     };
// //   }, []);

// //   return (
// //     <div>
// //       {online ? (
// //         <span style={{ color: "green" }}>Online</span>
// //       ) : (
// //         <span style={{ color: "red" }}>
// //           Offline (Last seen: {lastSeen ? lastSeen.toLocaleString() : "N/A"})
// //         </span>
// //       )}
// //     </div>
// //   );
// // };

// // const OnlineStatus = ({ userId }) => {
// //   const [online, setOnline] = useState(false); // État "en ligne" ou "hors ligne"
// //   const [lastSeen, setLastSeen] = useState(null); // Dernière connexion

// //   useEffect(() => {
// //     if (!userId) return; // Si aucun ID d'utilisateur n'est fourni, arrêtez

// //     // Référence Firestore pour l'utilisateur à surveiller
// //     const userRef = doc(db, "users", userId);

// //     // Surveiller les mises à jour en temps réel pour cet utilisateur
// //     const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
// //       if (docSnap.exists()) {
// //         const data = docSnap.data();
// //         setOnline(data.isOnline);
// //         setLastSeen(data.lastSeen?.toDate());
// //       }
// //     });

// //     return () => {
// //       unsubscribeSnapshot(); // Nettoyer l'abonnement
// //     };
// //   }, [userId]);

// //   return (
// //     <div>
// //       {online ? (
// //         <span style={{ color: "yellow" }}>Online</span>
// //       ) : (
// //         <span style={{ color: "red" }}>
// //           Offline (Last seen: {lastSeen ? lastSeen.toLocaleString() : "N/A"})
// //         </span>
// //       )}
// //     </div>
// //   );
// // };

// // export default OnlineStatus;

// // // import { useEffect } from "react";
// // // import {
// // //   ref,
// // //   onValue,
// // //   set,
// // //   serverTimestamp,
// // //   onDisconnect,
// // // } from "firebase/database";
// // // import { useUserStatusStore } from "../../lib/userStatus"; // Assurez-vous que le chemin est correct
// // // import Chrono from "../chrono/Chrono"; // Assurez-vous que le chemin est correct
// // // import { auth, rdb } from "../../lib/firebase"; // Assurez-vous que le chemin est correct
// // // import "./status.css";

// // // /**
// // //  * OnlineStatus Component
// // //  * Affiche le statut en ligne de l'utilisateur (en ligne ou dernière connexion).
// // //  *
// // //  * @param {Object} props - Propriétés du composant.
// // //  * @param {string} props.userId - ID unique de l'utilisateur pour le suivi du statut.
// // //  * @returns {JSX.Element} Le composant OnlineStatus.
// // //  */

// // // const OnlineStatus = ({ userId }) => {
// // //   const { online, lastSeen, setUserStatus } = useUserStatusStore();

// // //   useEffect(() => {
// // //     const handleUserPresence = (user) => {
// // //       if (!user || !userId) return; // Sortie si l'utilisateur n'est pas connecté ou si userId est manquant

// // //       const userStatusRef = ref(rdb, `users/${userId}/status`);
// // //       const isOnlineStatus = {
// // //         state: "online",
// // //         last_changed: new Date(),
// // //       };
// // //       const isOfflineStatus = {
// // //         state: "offline",
// // //         last_changed: new Date(),
// // //       };

// // //       // Définir l'utilisateur comme en ligne
// // //       set(userStatusRef, isOnlineStatus);
// // //       onDisconnect(userStatusRef).set(isOfflineStatus);

// // //       // Configurer un intervalle pour garder l'utilisateur en ligne toutes les 30 secondes
// // //       const heartbeatInterval = setInterval(() => {
// // //         set(userStatusRef, isOnlineStatus);
// // //       }, 30000);

// // //       // Écoute des changements de statut en ligne/hors ligne dans la Realtime Database
// // //       const unsubscribe = onValue(userStatusRef, (snapshot) => {
// // //         const status = snapshot.val();
// // //         if (status) {
// // //           setUserStatus(status.state === "online", status.last_changed);
// // //         }
// // //       });

// // //       // Gérer la déconnexion de l'utilisateur quand la fenêtre se ferme
// // //       const handleOffline = () => {
// // //         clearInterval(heartbeatInterval);
// // //         set(userStatusRef, isOfflineStatus);
// // //       };

// // //       window.addEventListener("beforeunload", handleOffline);

// // //       // Nettoyer les écouteurs et l'intervalle au démontage du composant
// // //       return () => {
// // //         window.removeEventListener("beforeunload", handleOffline);
// // //         unsubscribe();
// // //         clearInterval(heartbeatInterval);
// // //       };
// // //     };

// // //     // Écouter l'état d'authentification et appliquer la présence utilisateur
// // //     const unsubscribeAuth = auth.onAuthStateChanged(handleUserPresence);

// // //     // Nettoyage au démontage du composant
// // //     return () => unsubscribeAuth();
// // //   }, [userId, setUserStatus]);

// // //   return (
// // //     <div className="status">
// // //       {typeof online === "boolean" ? (
// // //         online ? (
// // //           <span className="online">Online</span>
// // //         ) : (
// // //           <span className="offline">
// // //             Last online <Chrono date={lastSeen} />
// // //           </span>
// // //         )
// // //       ) : (
// // //         <span className="loading">Checking status...</span>
// // //       )}
// // //     </div>

// // //     // <div className="status">
// // //     //   {online ? (
// // //     //     <span className="online">Online</span>
// // //     //   ) : (
// // //     //     <span className="offline">
// // //     //       Last online <Chrono date={lastSeen} />
// // //     //     </span>
// // //     //   )}
// // //     // </div>
// // //   );
// // // };

// // // export default OnlineStatus;
// // import { useEffect } from "react";
// // import Chrono from "../chrono/Chrono"; // Composant Chrono
// // import "./status.css";
// // import {
// //   doc,
// //   setDoc,
// //   updateDoc,
// //   onSnapshot,
// //   serverTimestamp,
// // } from "firebase/firestore";
// // import { db } from "../../lib/firebase";
// // import { useUserStatusStore } from "../../lib/userStatus";
// // /**
// //  * OnlineStatus Component
// //  * Affiche le statut en ligne ou dernière connexion.
// //  *
// //  * @param {Object} props - Propriétés du composant.
// //  * @param {string} props.userId - ID de l'utilisateur à surveiller.
// //  * @returns {JSX.Element}
// //  */
// // const OnlineStatus = ({ userId }) => {
// //   const { online, lastSeen, setUserStatus } = useUserStatusStore();

// //   useEffect(() => {
// //     if (!userId) return;

// //     // Gestion Firestore pour le statut de l'utilisateur
// //     const userRef = doc(db, "users", userId);

// //     const unsubscribe = onSnapshot(userRef, (docSnap) => {
// //       if (docSnap.exists()) {
// //         const data = docSnap.data();
// //         setUserStatus(data.isOnline, data.lastSeen?.toDate());
// //       }
// //     });

// //     return () => unsubscribe();
// //   }, [userId, setUserStatus]);

// //   return (
// //     <div className="status">
// //       {typeof online === "boolean" ? (
// //         online ? (
// //           <span className="online">Online</span>
// //         ) : (
// //           <span className="offline">
// //             Last online <Chrono date={lastSeen} />
// //           </span>
// //         )
// //       ) : (
// //         <span className="loading">Checking status...</span>
// //       )}
// //     </div>
// //   );
// // };

// // export default OnlineStatus;
