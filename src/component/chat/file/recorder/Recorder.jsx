import { useState, useRef, useEffect } from "react";
import "./recorder.css";

const Recorder = ({ startRecording, stopRecording, sendAudio }) => {
  const [audioURL, setAudioURL] = useState(null); // Stores the URL of the recorded audio for playback
  const mediaRecorderRef = useRef(null); // Reference to the MediaRecorder instance
  const audioChunksRef = useRef([]); // Array to store chunks of audio data during recording
  const streamRef = useRef(null); // Reference to the audio stream

  useEffect(() => {
    if (startRecording) {
      handleStartRecording();
    } else if (stopRecording) {
      handleStopRecording();
    }
  }, [startRecording, stopRecording]);

  // Starts recording audio from the user's microphone
  const handleStartRecording = async () => {
    try {
      // Request permission to access the microphone and get the audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize MediaRecorder with the audio stream
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // Clear any previous audio chunks

      // Collect audio data as it becomes available
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Handle the stop event to create a playable audio URL
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL); // Set the recorded audio URL for playback
      };

      // Start recording
      mediaRecorder.start();
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stops the ongoing audio recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // Stop the MediaRecorder
      console.log("Recording stopped");
    }
    if (streamRef.current) {
      // Stop all tracks in the audio stream to release the microphone
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Sends the recorded audio to the chat component via the handleSend function
  const handleSendAudio = async () => {
    if (audioURL) {
      try {
        // Fetch the recorded audio blob from the generated audio URL
        const response = await fetch(audioURL);
        const audioBlob = await response.blob();

        // Create a file object for the recorded audio
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
          type: "audio/webm",
        });

        // Use the handleSend function to send the audio as a message
        sendAudio({
          text: "", // No text message, only audio
          files: [{ file: audioFile, type: "audio" }],
        });

        // Reset the audio URL after sending the message
        setAudioURL(null);
      } catch (error) {
        console.error("Error sending audio:", error);
      }
    }
  };

  return (
    <div className="recorder-container">
      {audioURL && (
        <div className="audio-preview">
          <audio controls src={audioURL}></audio>
          <div className="audio-actions">
            <button onClick={handleSendAudio}>Envoyer</button>
            <button onClick={() => setAudioURL(null)}>Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recorder;
