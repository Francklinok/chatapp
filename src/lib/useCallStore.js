
import create from "zustand";
import produce from "immer";

const CallStatus = {
  IDLE: "idle",
  INCOMING: "incoming",
  ONGOING: "ongoing",
  ENDED: "ended",
};

const useCallStore = create((set) => ({
  incomingCall: null,
  callStatus: CallStatus.IDLE,

  setIncomingCall: (call) =>
    set(
      produce((state) => {
        state.incomingCall = call;
        state.callStatus = CallStatus.INCOMING;
      })
    ),

  setCallStatus: (status) =>
    set(
      produce((state) => {
        state.callStatus = status;
      })
    ),

  endCall: () =>
    set(
      produce((state) => {
        state.callStatus = CallStatus.ENDED;
        state.incomingCall = null;
      })
    ),

  resetCallState: () =>
    set(
      produce((state) => {
        state.incomingCall = null;
        state.callStatus = CallStatus.IDLE;
      })
    ),
}));

export default useCallStore;
