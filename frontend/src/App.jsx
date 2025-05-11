import react from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Learn from './pages/learn'
import Login from './pages/login'
import Register from './pages/register'
import NotFound from './pages/NotFound'
import ProtectedRoute from './ProtectedRoute'

function logout() {
    localStorage.clear()
    return <Navigate to={'/login'}/>
}

function RegisterAndLogout() {
    localStorage.clear()
    return <Register />
}

function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route
            path="/learn"
            element={
                <ProtectedRoute>
                <Learn />
                </ProtectedRoute>
            }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<logout />} />
            <Route path="/register" element={<RegisterAndLogout />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
    )
}

export default App