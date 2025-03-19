import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import TermsAndConditions from '../components/TermsAndConditions';

const RegisterPage: React.FC = () => {
  // Estado del formulario (sin campos de contraseña)
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    country: '',
    division: '',
    company: '',
    phone: '',
  });

  // Otros estados necesarios
  const [isAccepted, setIsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Hook para redireccionar
  const navigate = useNavigate();

  // Manejador genérico para inputs (text, select, etc.)
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo del submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isAccepted) {
      setError('Debes aceptar los términos y condiciones para registrarte.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Registro para usuario piloto (sin contraseña)
      const response = await fetch('http://localhost:8000/api/v1/users/register-pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          full_name: form.fullName,
          country: form.country,
          division: form.division, 
          company: form.company,
          phone: form.phone,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (data.detail === "El email ya está registrado") {
          setError('Este email ya está registrado');
        } else {
          setError(data.detail || 'Error al registrar');
        }
        return;
      }
      
      const data = await response.json();
      setMessage(data.message || 'Tu solicitud ha sido recibida. El administrador te proporcionará las credenciales de acceso después de verificar tu cuenta.');
      
      // Limpiar formulario después de envío exitoso
      setForm({
        email: '',
        fullName: '',
        country: '',
        division: '',
        company: '',
        phone: '',
      });
      
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsAccept = () => {
    setIsAccepted(true);
    setShowTerms(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="w-full max-w-4xl px-8 py-10 bg-white rounded-2xl shadow-lg border border-purple-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-wider">
            ZAAS
          </h1>
          <p className="text-gray-600 mt-2">
            Solicita acceso al programa piloto
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <p className="text-green-700">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Correo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          {/* Nombre Completo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Nombre y apellidos"
              required
            />
          </div>

          {/* País */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Chile"
              required
            />
          </div>

          {/* Teléfono */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: +569 1234 5678"
              required
            />
          </div>

          {/* División */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              División
            </label>
            <input
              type="text"
              name="division"
              value={form.division}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Marketing"
              required
            />
          </div>

          {/* Empresa */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: ABC Corp"
              required
            />
          </div>

          {/* Tipo de Licencia (deshabilitado, solo PILOT) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Licencia
            </label>
            <select
              name="licenseType"
              value="PILOT"
              disabled
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-100"
            >
              <option value="PILOT">PILOT</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Durante la fase piloto, solo está disponible la licencia PILOT.
            </p>
          </div>

          {/* Información sobre credenciales */}
          <div className="col-span-2 p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-blue-700 text-sm">
              <strong>Nota importante:</strong> Después de enviar este formulario, el administrador generará tus credenciales de acceso. 
              Recibirás tus datos de ingreso al sistema después de que el pago del programa piloto sea verificado.
            </p>
          </div>

          {/* Términos y Condiciones */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Términos y Condiciones
            </label>
            <div className="flex items-center h-[41px]">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-purple-600 hover:underline focus:outline-none"
                >
                  Términos y Condiciones
                </button>
              </label>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="col-span-2 mt-6 flex justify-center">
            <button
              type="submit"
              className="w-full sm:w-auto py-4 px-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isAccepted}
            >
              {isLoading ? 'Procesando...' : 'Solicitar Acceso Piloto'}
            </button>
          </div>

          {/* Link para volver al login */}
          <div className="col-span-2 mt-4 text-center">
            <a 
              href="/login"
              className="text-sm text-purple-600 hover:underline"
            >
              ¿Ya tienes una cuenta? Inicia sesión
            </a>
          </div>
        </form>

        <TermsAndConditions
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          onAccept={handleTermsAccept}
        />
      </div>
    </div>
  );
};

export default RegisterPage;