import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../services/socket.js";

const STUN_SERVER = "stun:stun.l.google.com:19302";

const InlineVideoCall = ({ roomId, onEnd }) => {
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (!user?.id || !roomId) return;

    const socket = getSocket(user.id);

    const createPeerConnection = () => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: STUN_SERVER }]
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            roomId,
            candidate: event.candidate,
            fromUserId: user.id
          });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pcRef.current = pc;
    };

    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (!pcRef.current) {
          createPeerConnection();
        }
        stream.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, stream);
        });

        if (user.role === "doctor") {
          setStatus("Creating offer...");
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socket.emit("webrtc-offer", { roomId, offer, fromUserId: user.id });
          setStatus("Calling patient...");
        } else {
          setStatus("Waiting for doctor to start the call...");
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setStatus("Failed to access camera/microphone");
      }
    };

    const handleOffer = async ({ offer, fromUserId }) => {
      if (fromUserId === user.id) return;
      if (!pcRef.current) {
        createPeerConnection();
      }
      setStatus("Received offer, creating answer...");
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("webrtc-answer", { roomId, answer, fromUserId: user.id });
      setStatus("In call");
    };

    const handleAnswer = async ({ answer, fromUserId }) => {
      if (fromUserId === user.id) return;
      setStatus("Answer received, connecting...");
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setStatus("In call");
    };

    const handleIceCandidate = async ({ candidate, fromUserId }) => {
      if (fromUserId === user.id) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding received ICE candidate", err);
      }
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);

    setStatus("Joining room...");
    socket.emit("join-appointment-room", { roomId });

    createPeerConnection();
    startLocalStream();

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [roomId, user?.id, user?.role]);

  const handleEnd = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (onEnd) onEnd();
  };

  return (
    <div className="mt-4 border border-slate-800 rounded-xl p-3 bg-slate-900/70">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400">
          Room: <span className="font-mono">{roomId}</span>
        </p>
        <p className="text-[11px] text-slate-500">{status}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-1">
          <p className="text-[11px] text-slate-400 mb-1">You</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-md bg-black"
          />
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-1">
          <p className="text-[11px] text-slate-400 mb-1">Remote</p>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-md bg-black"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleEnd}
          className="px-3 py-1.5 rounded-md bg-red-600 text-xs text-white"
        >
          End call
        </button>
      </div>
    </div>
  );
};

export default InlineVideoCall;

