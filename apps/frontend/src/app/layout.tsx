import { Poppins } from 'next/font/google';
import '../styles/globals.css';

export const metadata = {
  title: 'Partisipro - Platform Investasi Infrastruktur Blockchain Indonesia',
  description:
    'Demokratisasi investasi infrastruktur di Indonesia melalui teknologi blockchain. Platform PPP yang aman, transparan, dan patuh regulasi Bank Indonesia.',
  keywords:
    'investasi infrastruktur, blockchain Indonesia, PPP, Public Private Partnership, Project Garuda IDR, tokenisasi',
  authors: [{ name: 'Partisipro Team' }],
  openGraph: {
    title: 'Partisipro - Platform Investasi Infrastruktur Blockchain',
    description:
      'Demokratisasi investasi infrastruktur di Indonesia melalui teknologi blockchain yang aman dan transparan.',
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  fallback: ['sans-serif'],
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`scroll-smooth ${poppins.variable}`}>
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
