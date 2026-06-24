import { Navigate, Route, Routes } from 'react-router-dom'
import CameraDraw from './pages/CameraDraw'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/draw" element={<CameraDraw />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
