import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: 'Shri Vithal Somanna Halgekar — Member of Legislative Assembly (MLA)',
    template: '%s | Shri Vithal Somanna Halgekar, MLA',
  },
  description: 'Official website of Shri Vithal Somanna Halgekar, Member of Legislative Assembly. Development projects, government schemes, citizen services, news and updates.',
  keywords: ['Vithal Somanna Halgekar', 'MLA', 'Member of Legislative Assembly', 'constituency development', 'citizen services', 'government schemes'],
  openGraph: {
    title: 'Shri Vithal Somanna Halgekar — Member of Legislative Assembly',
    description: 'Official digital platform for development, transparency and citizen services.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Shri Vithal Somanna Halgekar, MLA' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
