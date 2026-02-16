import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FTC DECODE Scouting | CAABCMP',
  description: 'Advanced scouting application for FTC 2026 DECODE Season - Alberta Championship',
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
