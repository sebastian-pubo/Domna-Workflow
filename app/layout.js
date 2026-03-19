import './globals.css';

export const metadata = {
  title: 'Domna Work OS',
  description: 'Monday-style operations platform for Domna',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
