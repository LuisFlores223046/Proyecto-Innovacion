import { Routes, Route } from 'react-router-dom'
import MapPage from './pages/MapPage'
import SearchPage from './pages/SearchPage'
import EventsPage from './pages/EventsPage'
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/buscar" element={<SearchPage />} />
      <Route path="/eventos" element={<EventsPage />} />
    </Routes>
  )
}

export default App