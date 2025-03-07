import React from 'react';

interface Room {
    id: string;
    name: string;
}

interface RoomListProps {
    rooms: Room[];
}

const RoomList: React.FC<RoomListProps> = ({ rooms }) => {
    return (
        <div>
            <h2>Chat Rooms</h2>
            <ul>
                {rooms.map(room => (
                    <li key={room.id}>
                        <a href={`/rooms/${room.id}`}>{room.name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RoomList;