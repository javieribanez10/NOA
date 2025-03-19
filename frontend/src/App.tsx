import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation
} from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Sidebar from './components/Sidebar';
import AppRoutes from './routes';

// Componente protegido que envuelve las rutas que requieren autenticación
const ProtectedLayout = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirigir al login guardando la URL intentada para redireccionar después si es necesario
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pt-16 lg:pt-8">
          <div className="max-w-[1400px] mx-auto w-full">
            <AppRoutes />
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(localStorage.getItem('token'))
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(Boolean(token));
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <UserProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Ruta por defecto para usuarios no autenticados */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />
          } />
          
          {/* Rutas protegidas */}
          <Route 
            path="/*" 
            element={<ProtectedLayout isAuthenticated={isAuthenticated} />}
          />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;