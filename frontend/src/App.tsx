import { Routes, Route } from 'react-router-dom'
import MapPage from './pages/MapPage'
import SearchPage from './pages/SearchPage'
import EventsPage from './pages/EventsPage'
import "leaflet/dist/leaflet.css";
import LoginPage from './pages/LoginPage';
import { MainLayout } from './components/Layout/MainLayout';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import AdminLugares from './pages/AdminLugares';
import AdminEventos from './pages/AdminEventos';
import AdminAdministradores from './pages/AdminAdministradores';

function App() {
  return (
    <Routes>
      {/* rutas publicas */}
      <Route path="/login" element={<LoginPage />} />

      {/* rutas con sidebar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<MapPage />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/eventos" element={<EventsPage />} />
      </Route>

      {/* rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLugares />} />
        <Route path="/admin/eventos" element={<AdminEventos />} />
        <Route path="/admin/administradores" element={<AdminAdministradores />} />
      </Route>

    </Routes>
  )
}

export default App