import type {Metadata} from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata: Metadata = {
  title: 'Sistem Rekrutmen PTK',
  description: 'Sistem manajemen Permintaan Tenaga Kerja (PTK) dan pelacakan kandidat rekrutmen.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <body className="bg-[#F5F5F7] text-slate-900 font-sans antialiased" suppressHydrationWarning>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 w-full md:pl-64 flex flex-col min-h-screen transition-all duration-300">
            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
