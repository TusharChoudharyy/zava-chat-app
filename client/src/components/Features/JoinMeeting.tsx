import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000");

interface JoinMeetingProps {
  onSendMessage: (message: string) => void;
}

const JoinMeeting: React.FC<JoinMeetingProps> = ({ onSendMessage }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const start = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(localStream);
      if (videoRef.current) videoRef.current.srcObject = localStream;

      socket.emit("join-room", { roomId, isHost: false });

      socket.on("user-joined", ({ id }) => {
        const peer = createPeer(id, socket.id, localStream);
        peersRef.current.push({ peerID: id, peer });
        setPeers((prev) => [...prev, { peerID: id, peer }]);
      });

      socket.on("signal", ({ from, data }) => {
        const item = peersRef.current.find((p) => p.peerID === from);
        if (item) {
          item.peer.signal(data);
        } else {
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
    };

    start();
  }, [roomId]);

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <h1 className="text-center text-lg p-4">Joining Meeting: {roomId}</h1>
      <div className="grid grid-cols-2 gap-4 p-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="rounded-lg shadow-lg w-full h-full object-cover"
        />
        {peers.map((peer) => (
          <Video key={peer.peerID} peer={peer.peer} />
        ))}
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
    <video playsInline autoPlay ref={ref} className="rounded-lg shadow-lg w-full h-full object-cover" />
  );
};

export default JoinMeeting;
