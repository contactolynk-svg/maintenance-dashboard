import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Maintenance Dashboard',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{margin:0, padding:0, background:'#0f1623', minHeight:'100vh'}}>
        {children}
      </body>
    </html>
  )
}
