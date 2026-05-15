import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Settings from "./pages/Settings"
import { ResourceProvider } from "./context/ResourceContext"

export default function App() {
  return (
    <ResourceProvider>
      <Layout>
        {(props) =>
          props.activeNav === 'settings'
            ? <Settings />
            : <Dashboard {...props} />
        }
      </Layout>
    </ResourceProvider>
  )
}
