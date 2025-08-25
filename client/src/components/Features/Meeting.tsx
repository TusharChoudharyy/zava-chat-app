import {
  VideoIcon,
  MicIcon,
  ScreenShareIcon,
  UsersIcon,
  PhoneOffIcon,
  Minimize2Icon,
  Maximize2Icon,
  LinkIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000");

interface MeetingProps {
  onSendMessage: (message: string) => void;
}

const Meeting: React.FC<MeetingProps> = ({ onSendMessage }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<any[]>([]);
  const [inMeeting, setInMeeting] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [roomId] = useState("room123");
  const [isHost] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<any[]>([]);

  const inviteLink = `${window.location.origin}/join/${roomId}`;

  const startMeeting = async () => {
    setInMeeting(true);

    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setStream(localStream);
    if (videoRef.current) videoRef.current.srcObject = localStream;

    socket.emit("join-room", { roomId, isHost });

    socket.on("user-joined", ({ id }) => {
      const peer = createPeer(id, socket.id, localStream);
      peersRef.current.push({ peerID: id, peer });
      setPeers((prev) => [...prev, { peerID: id, peer }]);
    });

    socket.on("signal", ({ from, data }) => {
      const item = peersRef.current.find((p) => p.peerID === from);
      if (item) item.peer.signal(data);
      else {
        const peer = addPeer(data, from, localStream);
        peersRef.current.push({ peerID: from, peer });
        setPeers((prev) => [...prev, { peerID: from, peer }]);
      }
    });

    socket.on("user-left", ({ id }) => {
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
      setPeers([...peersRef.current]);
    });

    socket.on("host-action", (action) => {
      if (action === "mute") {
        localStream.getAudioTracks().forEach((t) => (t.enabled = false));
        setMicOn(false);
      }
    });

    onSendMessage(`📹 Meeting started! Room: ${roomId}`);
  };

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("signal", { roomId, to: userToSignal, data: signal });
    });
    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("signal", { roomId, to: callerID, data: signal });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMic = () => {
    if (!stream) return;
    const enabled = !micOn;
    stream.getAudioTracks().forEach((track) => (track.enabled = enabled));
    setMicOn(enabled);
  };

  const toggleCam = () => {
    if (!stream) return;
    const enabled = !camOn;
    stream.getVideoTracks().forEach((track) => (track.enabled = enabled));
    setCamOn(enabled);
  };

  const shareScreen = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getTracks()[0];
    const sender = peersRef.current[0]?.peer._pc
      .getSenders()
      .find((s: any) => s.track.kind === "video");
    if (sender) sender.replaceTrack(screenTrack);

    screenTrack.onended = () => {
      if (stream) {
        const camTrack = stream.getVideoTracks()[0];
        if (camTrack) sender.replaceTrack(camTrack);
      }
    };
  };

  const leaveMeeting = () => {
    stream?.getTracks().forEach((t) => t.stop());
    peersRef.current.forEach((p) => p.peer.destroy());
    socket.disconnect();
    setInMeeting(false);
    setPeers([]);
    setStream(null);
  };

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  if (!inMeeting) {
    return (
      <div className="flex items-center justify-center h-full">
        <button
          onClick={startMeeting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg transition transform hover:scale-105"
        >
          <VideoIcon className="w-5 h-5" />
          Start Meeting
        </button>
      </div>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 w-64 h-40 bg-black rounded-lg overflow-hidden shadow-xl z-50">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <button
          onClick={() => setMinimized(false)}
          className="absolute top-2 left-2 p-2 bg-gray-700 rounded-full"
        >
          <Maximize2Icon className="w-4 h-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-gray-900/50 backdrop-blur-md shadow-md">
        <h2 className="text-lg font-semibold">Meeting Room: {roomId}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition"
          >
            <LinkIcon className="w-4 h-4" />
            {inviteCopied ? "Copied!" : "Copy Invite Link"}
          </button>
          <span className="text-sm text-green-400">● Live</span>
          <button
            onClick={() => setMinimized(true)}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
          >
            <Minimize2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
        <div className="relative rounded-xl overflow-hidden bg-gray-800 shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">
            You
          </div>
        </div>

        {peers.map((peer) => (
          <Video key={peer.peerID} peer={peer.peer} />
        ))}
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-6 bg-gray-900/60 backdrop-blur-lg px-6 py-3 rounded-full shadow-xl">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition ${micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"}`}
        >
          <MicIcon className="w-5 h-5" />
        </button>
        <button
          onClick={toggleCam}
          className={`p-3 rounded-full transition ${camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"}`}
        >
          <VideoIcon className="w-5 h-5" />
        </button>
        <button
          onClick={shareScreen}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition"
        >
          <ScreenShareIcon className="w-5 h-5" />
        </button>
        <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition">
          <UsersIcon className="w-5 h-5" />
        </button>
        <button
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition"
          onClick={leaveMeeting}
        >
          <PhoneOffIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const Video = ({ peer }: any) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    peer.on("stream", (stream: MediaStream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 shadow-lg">
      <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">
        Participant
      </div>
    </div>
  ); 
};

export default Meeting;
