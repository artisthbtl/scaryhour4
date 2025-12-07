import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Learn from './pages/learn'
import Login from './pages/login'
import Register from './pages/register'
import ProtectedRoute from './ProtectedRoute'
import NotFound from './pages/NotFound'
import Shell from './pages/shell'
import Challenge from './pages/challenge'
import Landing from './pages/landing'

function Logout() {
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
			<Route path="/learn" element={
				<ProtectedRoute>
				<Learn />
				</ProtectedRoute>
			}
			/>
			<Route path="/" element={<Landing />} />
			
			<Route path="/challenge" element={
				<ProtectedRoute>
				<Challenge />
				</ProtectedRoute>
			}
			/>
			<Route path="/shell/:sessionId" element={
				<ProtectedRoute>
				<Shell />
				</ProtectedRoute>
			}
			/>
			<Route path="/login" element={<Login />} />
			<Route path="/logout" element={<Logout />} />
			<Route path="/register" element={<RegisterAndLogout />} />
			<Route path="*" element={<NotFound />} />
		</Routes>
		</BrowserRouter>
	)
}

export default App