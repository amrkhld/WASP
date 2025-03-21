# WASP - Real-Time Chat with YouTube Radio

WASP is a modern real-time chat application built with Next.js that features integrated YouTube radio streaming capabilities. Users can join chat rooms, communicate in real-time, and enjoy synchronized music streaming.

## Features

### Authentication
- Secure user authentication system
- Email and password-based signup/login
- Protected routes and session management using NextAuth.js

### Chat Functionality
- Real-time messaging using Socket.IO
- Multiple chat rooms support
- Password-protected private rooms
- Message persistence with MongoDB
- Automatic reconnection handling
- Message delivery status indicators

### YouTube Radio Integration
- Integrated YouTube player with automatic video streaming
- Random selection from curated music channels
- Audio controls (mute/unmute)
- Minimalist and fullscreen player modes
- Automatic track switching

### User Interface
- Responsive design for mobile and desktop
- Dynamic side panel for room navigation
- Real-time connection status indicators
- Smooth animations and transitions
- Modern gradient-based theming

## Technical Stack

### Frontend
- Next.js 13+ with App Router
- React with TypeScript
- Socket.IO Client
- YouTube IFrame Player API
- CSS Modules and custom animations

### Backend
- Node.js Socket.IO Server
- MongoDB with Mongoose
- NextAuth.js for authentication
- RESTful API endpoints
- Rate limiting and security middleware

### Infrastructure
- Separate Socket.IO server for real-time communication
- MongoDB for data persistence
- YouTube Data API integration

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Start the development servers:
   ```bash
   # Start the Next.js development server
   npm run dev

   # Start the Socket.IO server
   node server.js
   ```

## Project Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── models/            # MongoDB models
│   ├── styles/            # Global styles
│   └── types/             # TypeScript types
```

## Key Components

### ChatBox
The main chat interface component that displays messages and handles user interactions.

### Radio
YouTube player component with two modes:
- Fullscreen: Complete player with video and controls
- Minimal: Compact audio-only interface

### ChatRooms
Room management interface for creating, joining, and navigating between chat rooms.

## Socket.IO Implementation

The application uses a custom Socket.IO setup with features like:
- Automatic reconnection
- Message queueing
- Delivery acknowledgments
- Room-based message broadcasting
- Connection state management

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/messages` - Message handling
- `/api/rooms` - Room management
- `/api/rooms/join` - Room access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License

## Acknowledgments

Special thanks to the YouTube content creators whose channels are featured in the radio integration.