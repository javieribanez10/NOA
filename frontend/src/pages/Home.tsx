import React from 'react';
import { MessageSquare, Users, Clock, ArrowUp, ArrowDown, Activity, Zap } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-600 text-lg">Resumen de actividad y métricas clave</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              12%
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">Conversaciones</h3>
          <p className="text-3xl font-bold gradient-text">2,345</p>
          <p className="text-sm text-gray-600 mt-2">Últimos 30 días</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-pink-600" />
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              8%
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">Clientes Activos</h3>
          <p className="text-3xl font-bold gradient-text">487</p>
          <p className="text-sm text-gray-600 mt-2">Últimos 30 días</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-purple-600" />
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center">
              <ArrowDown className="w-3 h-3 mr-1" />
              5%
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">Tiempo Promedio</h3>
          <p className="text-3xl font-bold gradient-text">3.5m</p>
          <p className="text-sm text-gray-600 mt-2">Por conversación</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Actividad Reciente</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { time: '10:30 AM', client: 'María González', action: 'Nueva consulta sobre productos' },
              { time: '09:45 AM', client: 'Carlos Ruiz', action: 'Actualización de datos' },
              { time: '09:15 AM', client: 'Ana Martínez', action: 'Solicitud de soporte' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-20 text-sm text-gray-500">{activity.time}</div>
                <div>
                  <p className="font-medium text-gray-900">{activity.client}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Rendimiento por Sector</h3>
            <Zap className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { sector: 'Tecnología', conversations: 856, increase: 12 },
              { sector: 'Retail', conversations: 643, increase: 8 },
              { sector: 'Servicios', conversations: 491, increase: -3 },
            ].map((sector, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{sector.sector}</p>
                  <p className="text-sm text-gray-600">{sector.conversations} conversaciones</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-sm font-medium flex items-center ${
                  sector.increase > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {sector.increase > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {Math.abs(sector.increase)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;