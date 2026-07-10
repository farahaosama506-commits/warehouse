import type { Metadata } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import { ToastProvider } from '@/lib/toast-context'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'نظام إدارة المستودعات',
  description: 'نظام متكامل لإدارة المستودعات والمخزون',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}