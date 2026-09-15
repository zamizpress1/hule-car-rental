import React from 'react';
import '../index.css';

export const metadata = {
  title: 'Hule Car Rental | Find & Rent Cars in Addis Ababa',
  description: 'The premier managed car rental network in Addis Ababa. Connecting verified vehicle listers with trusted renters.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
