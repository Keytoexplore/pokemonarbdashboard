import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pokemon TCG Arbitrage Tracker',
  description: 'Japanese card arbitrage opportunities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}