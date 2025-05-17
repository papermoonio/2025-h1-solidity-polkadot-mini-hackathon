import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'DAO 抽奖系统',
  description: '一个去中心化提案+抽奖系统',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body className="bg-gray-950 text-gray-100">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-6">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
