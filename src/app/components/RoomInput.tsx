'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface Room {
  _id: string;
  name: string;
  isProtected: boolean; 
}

interface RoomInputProps {
  onRoomCreated: (room: Room) => void;
}

const RoomInput: React.FC<RoomInputProps> = ({ onRoomCreated }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isProtected, setIsProtected] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          password: isProtected ? password : undefined,
          isProtected
        }),
      });

      if (response.ok) {
        const newRoom = await response.json();
    
        onRoomCreated({
          _id: newRoom._id,
          name: newRoom.name,
          isProtected: newRoom.isProtected
        });
        setName('');
        setPassword('');
        setIsProtected(false);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="room-input">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NEST NAME"
        required
      />

      {isProtected && (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="INPUT NEST KEYCODE"
          required={isProtected}
        />
      )}
      
      <button type="submit" disabled={!name || (isProtected && !password)}>
        &#11041; CREATE NEST
      </button>

      <div className="password-option">
        <label className="custom-checkbox">
          <span
            onClick={() => setIsProtected(!isProtected)}
            className="checkbox-symbol"
          >
            {isProtected ? '⬣' : '⬡'}
          </span>
          <span className="checkbox-label">SECURED NECTARS?</span>
        </label>
      </div>




    </form>
  );
};

export default RoomInput;
