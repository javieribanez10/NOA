import React, { useState } from 'react';
import { User, Mail, Building, Phone, Globe, Briefcase, UserCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Profile = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    country: user?.country || '',
    division: user?.division || '',
    licenseType: user?.licenseType || 'BUILDER'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update logic
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      country: user?.country || '',
      division: user?.division || '',
      licenseType: user?.licenseType || 'BUILDER'
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Mi Perfil</h1>
        <p className="text-gray-600 text-lg">Gestiona tu información personal</p>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">{user?.fullName}</h2>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {user?.licenseType}
              </span>
              {user?.isActive && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <UserCheck className="w-4 h-4" />
                  Activo
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-200 focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-200 focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-200 focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                  <Globe className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-200 focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                  <Building className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-200 focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                División
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                  <Briefcase className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-200 focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Licencia
              </label>
              <select
                value={form.licenseType}
                onChange={(e) => setForm({ ...form, licenseType: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="BUILDER">BUILDER</option>
                <option value="SCALER">SCALER</option>
                <option value="LEADER">LEADER</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Editar Perfil
              </button>
            )}
          </div>
        </form>

        {user && (
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">API Key:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono">
                  {user.apiKey}
                </code>
              </div>
              <div>
                <span className="text-gray-600">Cuenta creada:</span>
                <span className="ml-2">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;