import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DocumentDetails from './pages/DocumentDetails';
import SigningPage from './pages/SigningPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents/:id" element={<DocumentDetails />} />
        <Route path="/sign/:token" element={<SigningPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;