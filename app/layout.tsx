import type { Metadata } from 'next';
import './globals.css';
import './driver.css';
import 'leaflet/dist/leaflet.css'; // ⚠ Leaflet will not render without its own stylesheet.
import { RunProvider } from '@/lib/state';
import Shell from '@/components/Shell';

export const metadata: Metadata = {
  title: 'Vantage Driver',
  description:
    'Demo build of the Vantage Driver phone app for TVSH Transport. Seeded run, no server, not the production module.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RunProvider>
          <Shell>{children}</Shell>
        </RunProvider>
      </body>
    </html>
  );
}
