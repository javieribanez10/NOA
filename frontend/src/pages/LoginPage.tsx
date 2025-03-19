import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { userApiService } from '../services/api';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUserData } = useUser();

  // Si el usuario ya tiene token, verificamos si es válido
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) validateToken(token);
  }, []);

  const validateToken = async (token: string) => {
    try {
      await userApiService.validateSession();
      // Si el token es válido, redirigimos a la página principal
      navigate('/home');
    } catch (error) {
      handleTokenExpired();
    }
  };

  const handleTokenExpired = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setError('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
  };

  const fetchUserData = async (token: string) => {
    try {
      const { data } = await userApiService.getCurrentUser();
      // Los datos ya vienen procesados y transformados a nuestro formato
      setUserData(data);
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
  
    try {
      const { data } = await userApiService.login({
        username: email,
        password: password,
      });

      // Guardar tokens
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      if (data.expires_at) {
        localStorage.setItem('token_expires_at', data.expires_at);
      }
      
      // Obtener datos del usuario
      await fetchUserData(data.access_token);
      
      // Notificar al componente App
      onLogin(data.access_token);
      
      // Redirigir a la página principal
      navigate('/home');
    } catch (error: any) {
      console.error('Error de login:', error);
      setError(error.message || 'Error en el inicio de sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white px-8 py-10 rounded-2xl shadow-lg border border-purple-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-wider">
              N.O.A
            </h1>
            <p className="text-gray-600 mt-2">
              Inicia sesión para acceder a tu asistente
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            <div className="mt-4 text-center text-sm">
              <p>
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="text-purple-600 hover:text-purple-700">
                  Regístrate
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;