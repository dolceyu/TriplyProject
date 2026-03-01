import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Коли створимо Dashboard для диплому, додамо його сюди */}
      </Routes>
    </Router>
  );
}

export default App;