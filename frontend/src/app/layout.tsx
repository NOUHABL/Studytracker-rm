import type { Metadata } from 'next';
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StudyTracker',
  description: 'Track your study sessions and progress',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="font-body bg-paper text-ink antialiased min-h-screen">
        {children}
        {/* Bridge script: lets the Chrome extension read session data */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__STUDYTRACKER_BRIDGE__ = true;
          window.addEventListener('message', async function(event) {
            if (event.source !== window) return;
            if (event.data?.type !== 'ST_GET_SESSION') return;
            try {
              const keys = Object.keys(localStorage);
              const authKey = keys.find(k => k.includes('auth-token') || k.includes('supabase'));
              if (!authKey) {
                window.postMessage({ type: 'ST_SESSION_RESPONSE', error: 'Not logged in' }, '*');
                return;
              }
              const raw = localStorage.getItem(authKey);
              const parsed = JSON.parse(raw);
              // Supabase stores session under .session or directly
              const session = parsed?.session || parsed;
              const token = session?.access_token;
              if (!token) {
                window.postMessage({ type: 'ST_SESSION_RESPONSE', error: 'No token found' }, '*');
                return;
              }
              window.postMessage({ type: 'ST_SESSION_RESPONSE', token }, '*');
            } catch(e) {
              window.postMessage({ type: 'ST_SESSION_RESPONSE', error: e.message }, '*');
            }
          });
        `}} />
      </body>
    </html>
  );
}