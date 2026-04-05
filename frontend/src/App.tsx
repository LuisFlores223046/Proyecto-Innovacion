import { Routes, Route } from 'react-router-dom'
import MapPage from './pages/MapPage'
import SearchPage from './pages/SearchPage'
import EventsPage from './pages/EventsPage'
import "leaflet/dist/leaflet.css";
import LoginPage from './pages/LoginPage';
import { MainLayout } from './components/Layout/MainLayout';
// import { ProtectedRoute } from './components/Layout/ProtectedRoute';

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

        {/* rutas protegidas */}
        {/* <Route element={<ProtectedRoute />}>
        </Route> */}
      </Route>
    </Routes>
  )
}

export default App