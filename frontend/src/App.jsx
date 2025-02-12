
import { Route,   Routes, useNavigate } from 'react-router-dom';
import './App.css'
import VideoCall from './VideoCall'
import { useState } from 'react';


export  const Home = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (!username) {
      alert("Please enter your name");
      return;
    }
    if (!roomId) {
      const generatedRoomId = Math.random().toString(36).substr(2, 9);
      setRoomId(generatedRoomId);
    }
    navigate(`/room/${roomId}?username=${username}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Join or Create a Video Call</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mb-4"
      />
      <input
        type="text"
        placeholder="Enter room ID (or leave blank to create one)"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="border p-2 mb-4"
      />
      <button onClick={joinRoom} className="px-4 py-2 bg-blue-500 text-white rounded">
        Join Room
      </button>
    </div>
  );
};


function App() {
 

  return (
    <>
     
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<VideoCall />} />
      </Routes>
  
    </>
  )
}

export default App
