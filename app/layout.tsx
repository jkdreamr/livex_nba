import type { Metadata } from 'next';
import { Poppins, Archivo, Anton, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ChatWidget } from '@/components/chat/ChatWidget';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins' });
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-archivo' });
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'NBA Summer League x LiveX | Custom Hoodie',
  description: 'Build a Summer League hoodie with team graphics, colors, and patches.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${archivo.variable} ${anton.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh bg-bg text-ink font-sans antialiased">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
