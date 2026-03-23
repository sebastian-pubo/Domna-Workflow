import './globals.css';

export const metadata = {
  title: 'Domna Homes Operations Platform',
  description: 'Operations platform for Domna Homes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
