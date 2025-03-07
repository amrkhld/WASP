import './styles/globals.css';
import { Providers } from './providers';
import { AudioProvider } from './contexts/AudioContext';
import { RadioProvider } from './contexts/RadioContext';

export const metadata = {
  title: 'WASP | Real-Time Chat',
  description: 'Real-time chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Asset&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AudioProvider>
          <RadioProvider>
            <div className="app-container">
              <Providers>{children}</Providers>
            </div>
          </RadioProvider>
        </AudioProvider>
      </body>
    </html>
  );
}