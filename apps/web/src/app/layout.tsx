import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CeeVee',
  description: 'Smart job opportunity agent',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
