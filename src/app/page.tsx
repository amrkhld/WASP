'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useSocket } from './hooks/useSocket';
import ChatRooms from './components/ChatRooms';
import ChatBox from './components/ChatBox';
import MessageInput from './components/MessageInput';
import { Message } from './types/message';

interface Room {
  _id: string;
  name: string;
}

const HomePage = () => {
  const { data: session, status } = useSession();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleMessageReceived = useCallback((message: Message) => {
    setMessages(prev => {

      const isDuplicate = prev.some(m => m.messageId === message.messageId);
      if (isDuplicate) return prev;
      return [...prev, message].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  }, []);

  const { sendMessage, isConnected, isReconnecting } = useSocket(
    selectedRoom?._id || '',
    handleMessageReceived
  );


  if (status === "unauthenticated") {
    redirect("/auth/login");
  }

  const handleRoomSelect = async (room: Room) => {
    setSelectedRoom(room);
    setIsLoading(true);
    if (isMobile) {
      setIsSidePanelOpen(false);
    }
    
    try {
      const response = await fetch(`/api/messages/${room._id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const typedMessages: Message[] = data.map((msg: any) => ({
        id: msg._id || msg.id,
        content: msg.content,
        roomId: msg.roomId,
        userId: msg.userId,
        userName: msg.userName || 'Unknown User',
        timestamp: msg.timestamp
      }));
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedRoom || !session?.user?.id) return;

    const messageData = {
      content,
      roomId: selectedRoom._id,
      userId: session.user.id,
      userName: session.user.name || 'Anonymous'
    };

 
    sendMessage(content);


    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error('Error persisting message:', error);
    }
  }, [selectedRoom, session, sendMessage]);

  const toggleSidePanel = () => {
    setIsSidePanelOpen(prev => {

      if (!prev) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return !prev;
    });
  };

  const closeSidePanel = () => {
    if (isMobile) {
      setIsSidePanelOpen(false);
      document.body.style.overflow = '';
    }
  };


  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div className="gradient-container">
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
        <div className="floating-shape shape3"></div>
      </div>
      <div className={`page-container ${isSidePanelOpen && isMobile ? 'panel-open' : ''}`}>
        <div className="main-content">
          <div className="chatbox-wrapper">
            <ChatBox 
              messages={messages} 
              roomName={selectedRoom?.name}
              isLoading={isLoading}
              isConnected={isConnected}
              isReconnecting={isReconnecting}
              onOpenRooms={toggleSidePanel}
              isSidePanelOpen={isSidePanelOpen}
            />
            <MessageInput 
              onSend={handleSendMessage}    
              disabled={!selectedRoom || !isConnected || isReconnecting}
            />
          </div>
        </div>
        
        <aside 
          className={`side-panel ${isSidePanelOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}
          onClick={(e) => {

            if (isMobile && e.target === e.currentTarget) {
              closeSidePanel();
            }
          }}
        >
          <div className="side-panel-content">
            <div className="logo-container">
              <img src="/assests/logoAlter.png" alt="Logo" />
            </div>
            <ChatRooms 
              onRoomSelect={handleRoomSelect} 
              onClose={isMobile ? closeSidePanel : undefined}
            />
          </div>
        </aside>
      </div>
    </>
  );
};

export default HomePage;