import { Routes, Route } from 'react-router-dom'
import MapPage from './pages/MapPage'
import SearchPage from './pages/SearchPage'
import EventsPage from './pages/EventsPage'
<<<<<<< HEAD
import "leaflet/dist/leaflet.css";
import { LoginPage } from './pages/LoginPage';
// import { ProtectedRoute } from './components/Layout/ProtectedRoute';
=======
>>>>>>> 02a484f3a9351a716c76a8ba6c629cd591e14948

function App() {
  return (
    <Routes>
<<<<<<< HEAD
      {/* rutas publicas */}
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/buscar" element={<SearchPage />} />
      <Route path="/eventos" element={<EventsPage />} />


      {/* rutas protegidas */}
      {/* <Route element={<ProtectedRoute />}>
      </Route> */}

=======
      <Route path="/" element={<MapPage />} />
      <Route path="/buscar" element={<SearchPage />} />
      <Route path="/eventos" element={<EventsPage />} />
>>>>>>> 02a484f3a9351a716c76a8ba6c629cd591e14948
    </Routes>
  )
}

export default App