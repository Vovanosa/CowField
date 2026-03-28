import { AppRouter } from './app/AppRouter'
import { AuthProvider } from './app/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
