import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/auth';
import { AudioProvider } from './contexts/AudioContext';
import { RadioProvider } from './contexts/RadioContext';
import { Providers } from './providers';
import './styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Frequency Nests',
  description: 'A shared music listening experience',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getServerSession(authOptions);

  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          <AudioProvider>
            <RadioProvider>
              {children}
            </RadioProvider>
          </AudioProvider>
        </Providers>
      </body>
    </html>
  );
}