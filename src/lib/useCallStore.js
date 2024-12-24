// store/useCallStore.js
// import create from "zustand";

// const useCallStore = create((set) => ({
//   incomingCall: null,
//   callStatus: "idle", // 'idle', 'incoming', 'ongoing', 'ended'
//   setIncomingCall: (call) =>
//     set({ incomingCall: call, callStatus: "incoming" }),
//   setCallStatus: (status) => set({ callStatus: status }),
//   endCall: () => set({ callStatus: "ended", incomingCall: null }),
// }));

// export default useCallStore;

// store/useCallStore.js
import create from "zustand";
import produce from "immer";

// Définir les types d'états pour plus de clarté
const CallStatus = {
  IDLE: "idle",
  INCOMING: "incoming",
  ONGOING: "ongoing",
  ENDED: "ended",
};

const useCallStore = create((set) => ({
  incomingCall: null,
  callStatus: CallStatus.IDLE,

  // Définir un appel entrant et changer le statut à 'incoming'
  setIncomingCall: (call) =>
    set(
      produce((state) => {
        state.incomingCall = call;
        state.callStatus = CallStatus.INCOMING;
      })
    ),

  // Mettre à jour le statut de l'appel
  setCallStatus: (status) =>
    set(
      produce((state) => {
        state.callStatus = status;
      })
    ),

  // Terminer l'appel et réinitialiser l'état
  endCall: () =>
    set(
      produce((state) => {
        state.callStatus = CallStatus.ENDED;
        state.incomingCall = null;
      })
    ),

  // Réinitialiser l'état à la valeur par défaut
  resetCallState: () =>
    set(
      produce((state) => {
        state.incomingCall = null;
        state.callStatus = CallStatus.IDLE;
      })
    ),
}));

export default useCallStore;
