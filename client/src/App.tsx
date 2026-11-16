import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import PublicMenu from './pages/PublicMenu'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/r/:slug" element={<PublicMenu />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
