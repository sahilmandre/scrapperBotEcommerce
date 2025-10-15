import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DealsPage from './pages/DealsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Navbar from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import FoodDealsPage from './pages/FoodDealsPage';

function App() {
  return (
    <Router>
      <div className="container-fluid">
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/food-deals" element={<FoodDealsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;