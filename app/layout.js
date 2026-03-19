export const metadata = {
  title: 'Domna Homes Operations Platform',
  description: 'Domna workflow and operations platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
