import type { Metadata } from 'next';
import { Poppins, Archivo } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins' });
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-archivo' });

export const metadata: Metadata = {
  title: 'NBA Summer League × LiveX — Design Your Drop',
  description: 'Design your custom NBA Summer League hoodie.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${archivo.variable}`}>
      <body className="min-h-dvh bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
