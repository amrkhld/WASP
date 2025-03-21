'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import axios from 'axios';
import PasswordModal from './PasswordModal';
import RoomInput from './RoomInput';

interface Room {
  _id: string;
  name: string;
  isProtected: boolean;
}

interface ChatRoomsProps {
  onRoomSelect: (room: Room) => void;
  onClose?: () => void; 
}

const ChatRooms: React.FC<ChatRoomsProps> = ({ onRoomSelect, onClose }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get<Room[]>('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomClick = async (room: Room, event: React.MouseEvent<HTMLLIElement>) => {
    if (room.isProtected) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      onRoomSelect(room);
     
      const target = event.currentTarget;
      target.style.transform = 'scale(0.98) translateX(5px)';
      setTimeout(() => {
        target.style.transform = '';
      }, 150);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedRoom) return;

    try {
      const response = await axios.post(`/api/rooms/join`, {
        roomId: selectedRoom._id,
        password
      });
      if (response.status === 200) {
        setShowPasswordModal(false);
        onRoomSelect(selectedRoom);
        setSelectedRoom(null);
      }
    } catch (error: any) {
      console.error('Error joining protected room:', error);
      if (error.response?.status === 401) {
        alert('Incorrect password');
      }
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setSelectedRoom(null);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  const handleRoomCreated = (newRoom: Room) => {
    setRooms(prevRooms => [...prevRooms, newRoom]);
  };

  return (
    <div className="chat-rooms-container">
      <div className="rooms-header">
        <h2>ACCESSIBLE NESTS</h2>
        {onClose && (
          <button 
            className="close-rooms-btn"
            onClick={onClose}
            aria-label="Close room selection"
          >
            ×
          </button>
        )}
      </div>
      <div className="rooms-content">
        <ul>
          {rooms.map((room) => (
            <li
              key={room._id}
              className="room-item"
              onClick={(e) => handleRoomClick(room, e)}
            >
              {room.name}
              {room.isProtected && <span className="room-protected">SECURED</span>}
            </li>
          ))}
        </ul>
      </div>

      <RoomInput onRoomCreated={handleRoomCreated} />

      <div className="signout-section">
        <button className="signout-button" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      {showPasswordModal && selectedRoom && (
        <PasswordModal
          roomName={selectedRoom.name}
          onSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
        />
      )}
    </div>
  );
};

export default ChatRooms;
