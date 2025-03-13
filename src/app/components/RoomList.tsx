import React from 'react';
import { LoadingState } from './LoadingState';
import { logger } from '../utils/logger';

interface Room {
  id: string;
  name: string;
  isProtected?: boolean;
  memberCount?: number;
}

interface RoomListProps {
  rooms: Room[];
  selectedRoom?: string;
  isLoading?: boolean;
  onRoomSelect: (roomId: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({
  rooms,
  selectedRoom,
  isLoading,
  onRoomSelect
}) => {
  const [joiningRoom, setJoiningRoom] = React.useState<string | null>(null);

  const handleRoomClick = async (roomId: string) => {
    try {
      setJoiningRoom(roomId);
      await onRoomSelect(roomId);
    } catch (error) {
      logger.error('Failed to join room', { 
        roomId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setJoiningRoom(null);
    }
  };

  if (isLoading) {
    return (
      <LoadingState 
        type="inline" 
        message="DISCOVERING NESTS..." 
      />
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="empty-rooms">
        <p>No active nests found</p>
        <p className="sub-text">Create one to get started</p>
      </div>
    );
  }

  return (
    <ul className="room-list">
      {rooms.map((room) => (
        <li
          key={room.id}
          className={`room-item ${selectedRoom === room.id ? 'selected' : ''} 
                     ${joiningRoom === room.id ? 'joining' : ''}`}
          onClick={() => handleRoomClick(room.id)}
        >
          <div className="room-info">
            <span className="room-name">{room.name}</span>
            {room.memberCount !== undefined && (
              <span className="member-count">
                {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
              </span>
            )}
          </div>
          {room.isProtected && (
            <span className="room-protected">PROTECTED</span>
          )}
          {joiningRoom === room.id && (
            <div className="join-indicator">
              <LoadingState 
                type="inline" 
                message="Joining..." 
                showSpinner={false} 
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default RoomList;