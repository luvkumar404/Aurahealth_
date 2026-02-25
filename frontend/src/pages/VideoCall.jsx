import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../services/socket.js";

const STUN_SERVER = "stun:stun.l.google.com:19302";

const VideoCall = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

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

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;
    const next = !isAudioMuted;
    audioTracks.forEach((t) => {
      t.enabled = !next;
    });
    setIsAudioMuted(next);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;
    const next = !isVideoOff;
    videoTracks.forEach((t) => {
      t.enabled = !next;
    });
    setIsVideoOff(next);
  };

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    window.history.back();
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4">
      <p className="text-sm text-slate-400 mb-2">Room: {roomId}</p>
      <p className="text-xs text-slate-500 mb-4">{status}</p>
      <div className="flex gap-2 mb-4">
        <button
          onClick={toggleMute}
          className="px-3 py-1.5 rounded-md bg-slate-800 text-xs text-slate-100"
        >
          {isAudioMuted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={toggleVideo}
          className="px-3 py-1.5 rounded-md bg-slate-800 text-xs text-slate-100"
        >
          {isVideoOff ? "Turn camera on" : "Turn camera off"}
        </button>
        <button
          onClick={endCall}
          className="px-3 py-1.5 rounded-md bg-red-600 text-xs text-white"
        >
          End call
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 w-full max-w-4xl">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
          <p className="text-xs text-slate-400 mb-1">You</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black"
          />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
          <p className="text-xs text-slate-400 mb-1">Remote</p>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCall;

