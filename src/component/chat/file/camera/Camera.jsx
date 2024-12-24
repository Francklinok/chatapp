import React, { useRef, useState, useEffect, useCallback } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../../../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useUserStore } from "../../../../lib/userStore"; // Assurez-vous que le chemin est correct
import { useChatStore } from "../../../../lib/chatStore"; // Assurez-vous que le chemin est correct
import { v4 as uuidv4 } from "uuid"; // Importation de uuid pour les noms de fichiers uniques
import "./camera.css";

const TakePhoto = ({ onPhotoSent, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [stream, setStream] = useState(null); // État pour gérer le flux vidéo

  const [showCamera, setShowCamera] = useState(true);
  const { chatId } = useChatStore();
  const { currentUser } = useUserStore();

  // Fonction pour démarrer la caméra
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Erreur lors de l'accès à la caméra :", error);
      // Vous pouvez ajouter une gestion d'erreur visuelle ici
    }
  }, []);

  // Démarrer la caméra au montage du composant
  useEffect(() => {
    startCamera();

    // Nettoyage lors du démontage du composant
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera, stream]);

  // Fonction pour prendre une photo
  const takePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL("image/jpeg");
      setPhotoUrl(photoDataUrl);
    }
  };

  // Fonction pour arrêter la caméra
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
    }
    setShowCamera(false); // Cache la caméra et les boutons
    setPhotoUrl("");
    if (onCancel) {
      onCancel(); // Appelle la fonction onCancel passée en props
    }
  };

  // Fonction pour uploader la photo
  const uploadPhoto = async () => {
    if (photoUrl && chatId && currentUser) {
      try {
        const storage = getStorage();
        const photoBlob = await fetch(photoUrl).then((res) => res.blob());

        // Générer un nom de fichier unique avec UUID
        const storageRef = ref(storage, `chat_photos/${uuidv4()}.jpg`);

        await uploadBytes(storageRef, photoBlob);
        const downloadUrl = await getDownloadURL(storageRef);

        // Appeler onPhotoSent avec les données du message
        handleSend("image");

        // onPhotoSent({
        //   type: "image",
        //   url: downloadUrl,
        // });

        console.log("Photo téléchargée avec succès");

        setPhotoUrl(""); // Efface l'URL de la photo après l'envoi
        stopCamera(); // Arrête et cache la caméra après l'envoi
      } catch (error) {
        console.error("Erreur lors du téléchargement de la photo :", error);
        // Vous pouvez ajouter un état pour afficher l'erreur dans l'UI
      }
    }
  };

  // Fonction pour reprendre une photo
  const retakePhoto = () => {
    setPhotoUrl("");
    setShowCamera(true);
    startCamera();
  };

  return (
    <div className="camera">
      {showCamera && (
        <div className="video">
          <video ref={videoRef} autoPlay playsInline></video>
          <div className="button-container">
            <button onClick={stopCamera} aria-label="Stop Camera">
              Stop Camera
            </button>
            <button onClick={takePhoto} aria-label="Take Photo">
              Take Photo
            </button>
          </div>
        </div>
      )}

      <div className="canvas">
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

        {photoUrl && (
          <div className="photo-preview">
            <img src={photoUrl} alt="Photo prise" />
            <div className="button-container">
              <button onClick={uploadPhoto} aria-label="Send Photo">
                Send Photo
              </button>
              <button onClick={retakePhoto} aria-label="Retake Photo">
                Retake
              </button>
              <button onClick={stopCamera} aria-label="Cancel">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakePhoto;

// import React, { useRef, useState, useEffect } from "react";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { db } from "../../../../lib/firebase";
// import { addDoc, collection } from "firebase/firestore";
// import { useUserStore } from "../../../../lib/userStore"; // Assuming you're using a store for currentUser
// import { useChatStore } from "../../../../lib/chatStore"; // Assuming you're using a store for chatId
// import "./camera.css";

// const TakePhoto = ({ onPhotoSent, onCancel }) => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [photoUrl, setPhotoUrl] = useState("");
//   const [stream, setStream] = useState(null); // Add stream state
//   //   const [visible, setIsVisible] = useState(false);

//   const [showCamera, setShowCamera] = useState(true);
//   const { chatId } = useChatStore();
//   const { currentUser } = useUserStore();

//   useEffect(() => {
//     const startCamera = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//         });

//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           setStream(stream);
//         }
//         // Save the stream to state
//       } catch (error) {
//         console.error("Error accessing camera:", error);
//       }
//     };
//     startCamera();

//     return () => {
//       // Clean up the stream when the component unmounts
//       if (stream) {
//         stream.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, []);

//   const takePhoto = () => {
//     const canvas = canvasRef.current;
//     const video = videoRef.current;

//     if (canvas && video) {
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const context = canvas.getContext("2d");
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);
//       const photoDataUrl = canvas.toDataURL("image/jpeg");
//       setPhotoUrl(photoDataUrl);
//     }
//   };

//   const stopCamera = () => {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//       videoRef.current.srcObject = null;
//       setStream(null);
//     }
//     setShowCamera(false); // Cache la caméra et les boutons
//     setPhotoUrl("");
//   };

//   const uploadPhoto = async () => {
//     if (photoUrl && chatId && currentUser) {
//       try {
//         const storage = getStorage();
//         const photoBlob = await fetch(photoUrl).then((res) => res.blob());
//         const storageRef = ref(storage, `chat_photos/${Date.now()}.jpg`);
//         await uploadBytes(storageRef, photoBlob);
//         const downloadUrl = await getDownloadURL(storageRef);

//         // Appeler onPhotoSent avec les données du message
//         onPhotoSent("image");

//         console.log("Photo téléchargée avec succès");

//         setPhotoUrl(""); // Efface l'URL de la photo après l'envoi
//         stopCamera(); // Arrête et cache la caméra après l'envoi
//       } catch (error) {
//         console.error("Erreur lors du téléchargement de la photo :", error);
//       }
//     }
//   };

//   return (
//     <div className="camera">
//       {showCamera && (
//         <div className="video">
//           <video ref={videoRef} autoPlay></video>
//           <div className="buton">
//             <button onClick={stopCamera}>Stop Camera</button>
//             <button onClick={takePhoto}>Take Photo</button>
//           </div>
//         </div>
//       )}

//       <div className="canvas">
//         <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

//         {photoUrl && (
//           <div>
//             <img src={photoUrl} alt="Taken Photo" />
//             <div className="buton">
//               <button onClick={uploadPhoto}>Send Photo</button>
//               <button onClick={stopCamera}>Cancel</button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* <button onClick={startCamera}>Start Camera</button> */}
//     </div>
//   );
// };

// export default TakePhoto;

//   const uploadPhoto = async () => {
//     if (photoUrl && chatId && currentUser) {
//       try {
//         const storage = getStorage();
//         const photoBlob = await fetch(photoUrl).then((res) => res.blob());
//         const storageRef = ref(storage, `chat_photos/${Date.now()}.jpg`);
//         await uploadBytes(storageRef, photoBlob);
//         const downloadUrl = await getDownloadURL(storageRef);

//         // Add the photo message to Firestore
//         await addDoc(collection(db, "chats", chatId, "messages"), {
//           type: "photo",
//           photoUrl: downloadUrl,
//           timestamp: new Date(),
//           sender: currentUser.id,
//         });
//         console.log("Photo uploaded successfully");
//         setPhotoUrl(""); // Clear photoUrl after upload
//         stopCamera();
//         if (onPhotoSent) onPhotoSent(); // Appeler le callback après envoi
//       } catch (error) {
//         console.error("Error uploading photo:", error);
//       }
//     }
//   };// TakePhoto.jsx
// import React, { useRef, useState, useEffect } from "react";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { db } from "../../../../lib/firebase";
// import { addDoc, collection } from "firebase/firestore";
// import { useUserStore } from "../../../../lib/userStore"; // Assurez-vous que ce chemin est correct
// import { useChatStore } from "../../../../lib/chatStore"; // Assurez-vous que ce chemin est correct
// import "./camera.css";

// const TakePhoto = ({ onPhotoSent, onCancel }) => {
//   // Ajouter des callbacks
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [photoUrl, setPhotoUrl] = useState("");
//   const [stream, setStream] = useState(null);
//   const { chatId } = useChatStore();
//   const { currentUser } = useUserStore();

//   useEffect(() => {
//     const startCamera = async () => {
//       try {
//         const cameraStream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//         });
//         if (videoRef.current) {
//           videoRef.current.srcObject = cameraStream;
//           setStream(cameraStream);
//         }
//       } catch (error) {
//         console.error("Erreur d'accès à la caméra :", error);
//       }
//     };

//     startCamera(); // Démarre la caméra dès le montage du composant

//     return () => {
//       // Nettoie le flux lorsque le composant est démonté
//       if (stream) {
//         stream.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, []);

//   const takePhoto = () => {
//     const canvas = canvasRef.current;
//     const video = videoRef.current;

//     if (canvas && video) {
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const context = canvas.getContext("2d");
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);
//       const photoDataUrl = canvas.toDataURL("image/jpeg");
//       setPhotoUrl(photoDataUrl);
//     }
//   };

//   const stopCamera = () => {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//       videoRef.current.srcObject = null;
//       setStream(null);
//     }
//     if (onCancel) onCancel(); // Appeler le callback de cancellation
//     setPhotoUrl(""); // Efface l'URL de la photo
//   };

//   const uploadPhoto = async () => {
//     if (photoUrl && chatId && currentUser) {
//       try {
//         const storage = getStorage();
//         const photoBlob = await fetch(photoUrl).then((res) => res.blob());
//         const storageRef = ref(storage, `chat_photos/${Date.now()}.jpg`);
//         await uploadBytes(storageRef, photoBlob);
//         const downloadUrl = await getDownloadURL(storageRef);

//         // Appeler onPhotoSent avec les données du message
//         onPhotoSent("image", downloadUrl, "Photo envoyée");

//         console.log("Photo téléchargée avec succès");

//         setPhotoUrl(""); // Efface l'URL de la photo après l'envoi
//         stopCamera(); // Arrête et cache la caméra après l'envoi
//       } catch (error) {
//         console.error("Erreur lors du téléchargement de la photo :", error);
//       }
//     }
//   };

//   return (
//     <div className="camera">
//       {stream && (
//         <div className="video-controls">
//           <video
//             ref={videoRef}
//             autoPlay
//             style={{ display: "block", width: "100%" }}
//           ></video>
//           <div className="buttons">
//             <button onClick={takePhoto}>Prendre une Photo</button>
//             <button onClick={stopCamera}>Arrêter la Caméra</button>
//           </div>
//         </div>
//       )}

//       <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

//       {photoUrl && (
//         <div className="photo-preview">
//           <img src={photoUrl} alt="Photo prise" style={{ maxWidth: "100%" }} />
//           <div className="buttons">
//             <button onClick={uploadPhoto}>Envoyer la Photo</button>
//             <button onClick={stopCamera}>Annuler</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TakePhoto;
