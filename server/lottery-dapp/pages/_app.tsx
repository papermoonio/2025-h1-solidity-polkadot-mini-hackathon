import "../styles/globals.css"
import type { AppProps } from "next/app"
import { Web3Provider } from "../contexts/Web3Context"
import { ThemeProvider } from "../contexts/ThemeContext"
import { Toaster } from "../components/ui/toaster"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Web3Provider>
        <Component {...pageProps} />
        <Toaster />
      </Web3Provider>
    </ThemeProvider>
  )
} 