import React, { useState } from 'react';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Users,
  Clock,
  Target,
  Calendar,
  Filter,
  Building,
  Tag
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// Theme colors
const THEME = {
  primary: {
    purple: '#7e22ce',
    purpleLight: '#8b5cf6',
    purpleLighter: '#c4b5fd',
    pink: '#db2777',
    pinkLight: '#ec4899',
    pinkLighter: '#f9a8d4',
  },
  status: {
    success: '#7e22ce',
    warning: '#db2777',
    danger: '#be185d',
    neutral: '#9333ea'
  }
};

const mockData = {
  leadsByType: [
    { name: 'Caliente', value: 45, color: THEME.primary.pink },
    { name: 'Tibio', value: 30, color: THEME.primary.pinkLight },
    { name: 'Frío', value: 25, color: THEME.primary.pinkLighter }
  ],
  conversationsByProduct: [
    { name: 'Producto A', conversations: 120, conversion: 75 },
    { name: 'Producto B', conversations: 85, conversion: 60 },
    { name: 'Producto C', conversations: 65, conversion: 45 },
    { name: 'Producto D', conversations: 45, conversion: 30 },
    { name: 'Producto E', conversations: 30, conversion: 20 }
  ],
  responseTimeByDay: [
    { day: 'Lun', time: 3.2, conversations: 45 },
    { day: 'Mar', time: 2.8, conversations: 52 },
    { day: 'Mie', time: 3.5, conversations: 38 },
    { day: 'Jue', time: 2.9, conversations: 65 },
    { day: 'Vie', time: 3.1, conversations: 48 },
    { day: 'Sab', time: 2.5, conversations: 35 },
    { day: 'Dom', time: 2.3, conversations: 28 }
  ],
  conversionsBySource: [
    { source: 'WhatsApp', value: 40, color: THEME.primary.purple },
    { source: 'Meta', value: 25, color: THEME.primary.purpleLight },
    { source: 'Google', value: 35, color: THEME.primary.purpleLighter }
  ],
  conversionTrendByMonth: [
    { month: 'Ene', leads: 120, conversions: 65 },
    { month: 'Feb', leads: 150, conversions: 85 },
    { month: 'Mar', leads: 180, conversions: 110 },
    { month: 'Abr', leads: 165, conversions: 95 },
    { month: 'May', leads: 195, conversions: 125 },
    { month: 'Jun', leads: 210, conversions: 145 }
  ],
  conversionMetrics: {
    totalLeads: 487,
    avgResponseTime: '2.8m',
    conversionRate: '68%'
  },
  statusDistribution: [
    { status: 'Completado', value: 45, color: THEME.primary.purple },
    { status: 'En proceso', value: 30, color: THEME.primary.purpleLight },
    { status: 'Perdido', value: 15, color: THEME.primary.pink },
    { status: 'Fuga', value: 10, color: THEME.primary.pinkLight }
  ],
  sectorPerformance: [
    { sector: 'Tecnología', leads: 180, conversions: 120, rate: 66.7 },
    { sector: 'Retail', leads: 150, conversions: 90, rate: 60.0 },
    { sector: 'Servicios', leads: 120, conversions: 85, rate: 70.8 }
  ]
};

const Dashboards = () => {
  const [dateRange, setDateRange] = useState('month');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedLeadType, setSelectedLeadType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  const getStatusBadgeColor = (rate: number) => {
    if (rate >= 65) return 'bg-purple-100 text-purple-700';
    if (rate >= 50) return 'bg-pink-100 text-pink-700';
    return 'bg-pink-200 text-pink-800';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Dashboards</h1>
        <p className="text-gray-600 text-lg">Análisis y métricas de conversaciones</p>
      </header>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
              >
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="quarter">Último trimestre</option>
                <option value="year">Último año</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sector
            </label>
            <div className="relative">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos los sectores</option>
                <option value="tech">Tecnología</option>
                <option value="retail">Retail</option>
                <option value="services">Servicios</option>
              </select>
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Lead
            </label>
            <div className="relative">
              <select
                value={selectedLeadType}
                onChange={(e) => setSelectedLeadType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos los leads</option>
                <option value="hot">Caliente</option>
                <option value="warm">Tibio</option>
                <option value="cold">Frío</option>
              </select>
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuente
            </label>
            <div className="relative">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todas las fuentes</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="meta">Meta</option>
                <option value="google">Google</option>
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-600" />
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              +12% vs prev.
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">Total Leads</h3>
          <p className="text-3xl font-bold gradient-text">{mockData.conversionMetrics.totalLeads}</p>
          <p className="text-sm text-gray-600 mt-2">Último período</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-pink-600" />
            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
              -8% vs prev.
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">Tiempo de Respuesta</h3>
          <p className="text-3xl font-bold gradient-text">{mockData.conversionMetrics.avgResponseTime}</p>
          <p className="text-sm text-gray-600 mt-2">Promedio</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-purple-600" />
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              +5% vs prev.
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">Tasa de Conversión</h3>
          <p className="text-3xl font-bold gradient-text">{mockData.conversionMetrics.conversionRate}</p>
          <p className="text-sm text-gray-600 mt-2">Global</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversion Trend */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Tendencia de Conversión</h3>
            <LineChartIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.conversionTrendByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stackId="1"
                  stroke={THEME.primary.purple}
                  fill={THEME.primary.purple}
                  fillOpacity={0.2}
                  name="Leads"
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stackId="2"
                  stroke={THEME.primary.pink}
                  fill={THEME.primary.pink}
                  fillOpacity={0.2}
                  name="Conversiones"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Fuentes de Leads</h3>
            <PieChartIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.conversionsBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill={THEME.primary.purple}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {mockData.conversionsBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time Analysis */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Análisis de Tiempo de Respuesta</h3>
            <LineChartIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData.responseTimeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="time"
                  stroke={THEME.primary.purple}
                  strokeWidth={2}
                  name="Tiempo (min)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversations"
                  stroke={THEME.primary.pink}
                  strokeWidth={2}
                  name="Conversaciones"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Distribución por Estado</h3>
            <PieChartIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill={THEME.primary.purple}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {mockData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sector Performance Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Rendimiento por Sector</h3>
          <Building className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Sector</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Total Leads</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Conversiones</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Tasa de Conversión</th>
              </tr>
            </thead>
            <tbody>
              {mockData.sectorPerformance.map((sector, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4">{sector.sector}</td>
                  <td className="py-3 px-4">{sector.leads}</td>
                  <td className="py-3 px-4">{sector.conversions}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(sector.rate)}`}>
                      {sector.rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboards;