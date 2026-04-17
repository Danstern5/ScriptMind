import { AuthProvider } from './contexts/AuthContext'
import useAuth from './hooks/useAuth'
import AuthPage from './components/AuthPage'
import ScriptMind from './ScriptMind'

function AppGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen w-full"
        style={{
          background: 'var(--bg-canvas)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
        }}
      >
        Loading…
      </div>
    )
  }

  return user ? <ScriptMind /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  )
}
