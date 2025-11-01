import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Baby Gender Bets 🎀👶',
  description: 'Bet on the baby\'s gender!',
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
