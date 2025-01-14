import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Image Annotation Tool',
  description: 'An image annotation tool with ROI Configuration and Perspective Transform Configure',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          async
          defer
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

