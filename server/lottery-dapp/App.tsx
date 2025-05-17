import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./contexts/ThemeContext"
import { Web3Provider } from "./contexts/Web3Context"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import CreateLottery from "./pages/CreateLottery"
import LotteryDetails from "./pages/LotteryDetails"
import Profile from "./pages/Profile"
import Admin from "./pages/Admin"
import { Toaster } from "./components/Toaster"

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateLottery />} />
              <Route path="/lottery/:id" element={<LotteryDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </Web3Provider>
    </ThemeProvider>
  )
}

export default App
