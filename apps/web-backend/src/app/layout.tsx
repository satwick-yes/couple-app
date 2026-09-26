export const metadata = {
  title: 'LDR App Backend',
  description: 'API and WebSocket server for the LDR app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
