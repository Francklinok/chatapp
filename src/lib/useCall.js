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
        ...initialCallState,

        updateCallStatus: (status) => {
          set((state) => ({
            ...state,
            ...status,
          }));
        },

        resetCallState: () => {
          const state = get();
          const { localStream, remoteStream } = state;

          [localStream, remoteStream].forEach((stream) => {
            if (stream instanceof MediaStream) {
              stream.getTracks().forEach((track) => track.stop());
            }
          });

          set({ ...initialCallState });
        },

        setLocalVideoRef: (ref) => {
          set({ localVideoRef: ref });
        },

        setRemoteVideoRef: (ref) => {
          set({ remoteVideoRef: ref });
        },

        setLocalStream: (stream) => {
          set({ localStream: stream });
        },

        setRemoteStream: (stream) => {
          set({ remoteStream: stream });
        },

        playSound: (type, loop = false) => {
          try {
            const sounds = {
              apemis: new Audio("apemis.mp3"),
              apfinis: new Audio("apfinis.mp3"),
              ringtone: new Audio("ringtone.mp3"),
            };

            const currentSound = sounds[type];
            const { currentSound: previousSound } = get().callState;

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
          const { currentSound } = get();

          if (currentSound instanceof Audio) {
            currentSound.pause();
            currentSound.currentTime = 0;
          }

          set({ currentSound: null });
        },
      }),
      { name: "call-store" }
    )
  )
);
