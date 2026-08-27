import './globals.css'

export const metadata = {
  title: 'Lightswitch',
  description: 'Cloud File Storage Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
