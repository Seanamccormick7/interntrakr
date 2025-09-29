import { Routes, Route } from 'react-router-dom'
import './App.css'
import { NavBar } from './components/NavBar'
import { Container } from './components/Container'
import Home from './pages/Home'
import Applications from './pages/Applications'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <NavBar />
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </>
  )
}