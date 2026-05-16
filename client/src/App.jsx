import { useAuth, AuthProvider } from './context/AuthContext'
import { ResourceProvider } from './context/ResourceContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import AuthModal from './components/AuthModal'
import Digest from './pages/Digest'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#7F77DD] rounded-md flex items-center justify-center">
            <i className="ti ti-brain text-white text-xs" />
          </div>
          <span className="text-[#555] text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Blurred background — pointer events disabled when not logged in */}
      <div className={!user ? 'pointer-events-none select-none' : ''}>
        <ResourceProvider>
          <Layout>
            {(props) =>
              props.activeNav === 'settings' ? <Settings /> :
              props.activeNav === 'digest' ? <Digest /> :
              <Dashboard {...props} />
            }
          </Layout>
        </ResourceProvider>
      </div>

      {/* Auth modal — always on top, always clickable */}
      {!user && <AuthModal />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
} 