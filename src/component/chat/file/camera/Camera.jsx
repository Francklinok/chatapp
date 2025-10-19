import React, { useRef, useState, useEffect, useCallback } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../../../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useUserStore } from "../../../../lib/userStore"; 
import { useChatStore } from "../../../../lib/chatStore"; 
import { v4 as uuidv4 } from "uuid"; 
import "./camera.css";

const TakePhoto = ({ onPhotoSent, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [stream, setStream] = useState(null); 

  const [showCamera, setShowCamera] = useState(true);
  const { chatId } = useChatStore();
  const { currentUser } = useUserStore();

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
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera, stream]);

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

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
    }
    setShowCamera(false); 
    setPhotoUrl("");
    if (onCancel) {
      onCancel(); 
    }
  };

  const uploadPhoto = async () => {
    if (photoUrl && chatId && currentUser) {
      try {
        const storage = getStorage();
        const photoBlob = await fetch(photoUrl).then((res) => res.blob());

        const storageRef = ref(storage, `chat_photos/${uuidv4()}.jpg`);

        await uploadBytes(storageRef, photoBlob);
        const downloadUrl = await getDownloadURL(storageRef);

        handleSend("image");

        // onPhotoSent({
        //   type: "image",
        //   url: downloadUrl,
        // });

        console.log("Photo téléchargée avec succès");

        setPhotoUrl(""); 
        stopCamera(); 
      } catch (error) {
        console.error("Erreur lors du téléchargement de la photo :", error);

      }
    }
  };

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
