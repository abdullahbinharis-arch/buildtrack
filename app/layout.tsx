import './globals.css';

export const metadata = {
  title: 'BuildTrack — Construction Expense Tracker',
  description: 'Track payments, expenses, and profitability across all sites',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
