import   { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const socket = io("http://localhost:5000");

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const username = queryParams.get("username");

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const [stream, setStream] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [partnerName, setPartnerName] = useState("");
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      socket.emit("join-room", { roomId, username });
    });

    socket.on("user-joined", ({ id, username }) => {
      setPartnerId(id);
      setPartnerName(username);
      callUser(id);
    });

    socket.on("offer", ({ offer, from }) => {
      setPartnerId(from);
      acceptCall(offer, from);
    });

    socket.on("answer", ({ answer }) => {
      peer?.signal(answer);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      peer?.signal(candidate);
    });

    socket.on("user-left", (id) => {
      if (id === partnerId) {
        setPartnerId(null);
        setPartnerName("");
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
    };
  }, [peer, roomId]);

  const callUser = (id) => {
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    newPeer.on("signal", (signal) => {
      socket.emit("offer", { offer: signal, to: id });
    });

    newPeer.on("stream", (userStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = userStream;
      }
    });

    setPeer(newPeer);
  };

  const acceptCall = (offer, from) => {
    const newPeer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    newPeer.on("signal", (signal) => {
      socket.emit("answer", { answer: signal, to: from });
    });

    newPeer.on("stream", (userStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = userStream;
      }
    });

    newPeer.signal(offer);
    setPeer(newPeer);
  };

  const toggleMute = () => {
    stream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setMuted(!muted);
  };

  const toggleVideo = () => {
    stream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    setVideoEnabled(!videoEnabled);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-semibold mb-2">Room ID: {roomId}</h2>
      <div className="flex gap-4">
        <div className="relative">
          <video ref={myVideo} autoPlay playsInline muted className="w-64 h-48 border" />
          <p className="absolute bottom-1 left-1 bg-black text-white px-2 py-1 text-sm">{username}</p>
        </div>
        {partnerId && (
          <div className="relative">
            <video ref={userVideo} autoPlay playsInline className="w-64 h-48 border" />
            <p className="absolute bottom-1 left-1 bg-black text-white px-2 py-1 text-sm">{partnerName}</p>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <button onClick={toggleMute} className="px-4 py-2 bg-blue-500 text-white rounded">
          {muted ? "Unmute" : "Mute"}
        </button>
        <button onClick={toggleVideo} className="px-4 py-2 bg-green-500 text-white rounded">
          {videoEnabled ? "Turn Off Video" : "Turn On Video"}
        </button>
        <button onClick={() => window.location.href = "/"} className="px-4 py-2 bg-red-500 text-white rounded">
          Leave Call
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
