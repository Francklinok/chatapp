import create from "zustand";
import { persist, devtools } from "zustand/middleware";

const initialCallState = {
  isCalling: false,
  isRinging: false,
  isInCall: false,
  isVideoCall: false,
  callId: null,
  localStream: null,
  remoteStream: null,
  error: null,
  callerId: null,
  receiverId: null,
  currentSound: null,
  isIncomingCall: false,
  isOutgoingCall: false,
  localVideoRef: null,
  remoteVideoRef:null,
  
};

export const useCallStore = create(
  devtools(
    persist(
      (set, get) => ({
        callState: { ...initialCallState },

        // Mise à jour des états d'appel

        updateCallStatus: (status) => {
          set((state) => ({
            callState: { ...state.callState, ...status },
          }));
        },

        // Gestion des flux vidéo/audio
        // attachStream: (stream, type, ref) => {
        //   if (!(stream instanceof MediaStream)) {
        //     console.error("Le flux fourni n'est pas valide :", stream);
        //     return;
        //   }
        //   try {
        //     if (ref?.current) {
        //       ref.current.srcObject = stream;
        //     }
        //   } catch (error) {
        //     console.error("Erreur lors de l'attachement du flux :", error);
        //   }
        // },

        // Réinitialisation de l'état de l'appel
        resetCallState: () => {
          const { localStream, remoteStream } = get().callState;

          [localStream, remoteStream].forEach((stream) => {
            if (stream instanceof MediaStream) {
              stream.getTracks().forEach((track) => track.stop());
            }
          });

          set({ callState: { ...initialCallState } });
        },

        setLocalVideoRef: (ref) => {
          set((state) => ({
            callState:{ ...state.callState, localVideoRef:ref},
          }))
        },
        
        setRemoteVideoRef: (ref) => {
            set((state) => ({
              callState: { ...state.callState, remoteVideoRef:ref}
            }))
          },

        // Définir les flux locaux et distants
        setLocalStream: (stream) => {
          set((state) => ({
            callState: { ...state.callState, localStream: stream },
          }));
        },
        setRemoteStream: (stream) => {
          set((state) => ({
            callState: { ...state.callState, remoteStream: stream },
          }));
        },

        // Gestion des sons (sonneries et fin d'appel)
        playSound: (type, loop = false) => {
          try {
            const sounds = {
              apemis: new Audio("apemis.mp3"),
              apfinis: new Audio("apfinis.mp3"),
              ringtone: new Audio("ringtone.mp3"),
            };

            const currentSound = sounds[type];
            const { currentSound: previousSound } = get().callState;

            // Stop le son en cours avant de jouer un autre
            if (previousSound) {
              previousSound.pause();
              previousSound.currentTime = 0;
            }

            if (currentSound) {
              currentSound.loop = loop;
              currentSound.play();
            }

            set((state) => ({
              callState: { ...state.callState, currentSound },
            }));
          } catch (error) {
            console.error("Erreur lors de la lecture du son :", error);
          }
        },

        stopSound: () => {
          const { currentSound } = get().callState;

          if (currentSound instanceof Audio) {
            currentSound.pause();
            currentSound.currentTime = 0;
          }

          set((state) => ({
            callState: { ...state.callState, currentSound: null },
          }));
        },
      }),
      { name: "call-store" }
    )
  )
);
