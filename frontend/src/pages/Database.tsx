import React, { useState, useRef } from 'react';
import { Search, Filter, Download, MoreVertical, Mail, Phone, MapPin, Building, Tag, Clock, MessageSquare, Calendar, Columns, ChevronDown, Plus, Upload, X, Check, Globe, MessageCircle } from 'lucide-react';
import Papa from 'papaparse';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  sector: string;
  location: string;
  interestedProduct: string;
  leadType: 'Caliente' | 'Tibio' | 'Frío';
  channel: string;
  firstContact: string;
  lastContact: string;
  leadSource: string;
  conversations: number;
  avgResponseTime: string;
  status: 'Completado' | 'En proceso' | 'Perdido' | 'Fuga';
}

interface ColumnDefinition {
  label: string;
  icon?: React.ElementType;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'number';
  options?: string[];
}

const COLUMNS: Record<keyof Customer, ColumnDefinition> = {
  id: { label: 'ID' },
  name: { label: 'Cliente', required: true, type: 'text' },
  email: { label: 'Email', icon: Mail, required: true, type: 'email' },
  phone: { label: 'Teléfono', icon: Phone, required: true, type: 'tel' },
  company: { label: 'Empresa', icon: Building, required: true, type: 'text' },
  sector: { label: 'Sector', required: true, type: 'select', options: ['Tecnología', 'Retail', 'Servicios', 'Manufactura', 'Otro'] },
  location: { label: 'Ubicación', icon: MapPin, type: 'text' },
  interestedProduct: { label: 'Producto', icon: Tag, type: 'text' },
  leadType: { label: 'Tipo de Lead', icon: Tag, required: true, type: 'select', options: ['Caliente', 'Tibio', 'Frío'] },
  channel: { label: 'Canal', icon: Globe, required: true, type: 'select', options: ['Página Web', 'Meta', 'Google Ads', 'LinkedIn', 'WhatsApp', 'Referido', 'Otro'] },
  firstContact: { label: 'Primer Contacto', icon: Calendar, type: 'date' },
  lastContact: { label: 'Último Contacto', icon: Calendar, type: 'date' },
  leadSource: { label: 'Fuente', icon: Filter, type: 'text' },
  conversations: { label: 'Conversaciones', icon: MessageCircle, type: 'number' },
  avgResponseTime: { label: 'Tiempo Resp.', icon: Clock, type: 'text' },
  status: { label: 'Estado', required: true, type: 'select', options: ['Completado', 'En proceso', 'Perdido', 'Fuga'] }
};

const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'María González',
    email: 'maria@empresa.com',
    phone: '+56 9 1234 5678',
    company: 'Tech Solutions SA',
    sector: 'Tecnología',
    location: 'Santiago, Chile',
    interestedProduct: 'Producto A',
    leadType: 'Caliente',
    channel: 'Página Web',
    firstContact: '2024-02-15',
    lastContact: '2024-03-15',
    leadSource: 'WhatsApp',
    conversations: 23,
    avgResponseTime: '2.5m',
    status: 'Completado'
  }
];

const Database = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedLeadType, setSelectedLeadType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Array<keyof Customer>>([
    'name', 'email', 'phone', 'company', 'sector', 'channel', 'leadType', 'status'
  ]);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    firstContact: new Date().toISOString().split('T')[0],
    lastContact: new Date().toISOString().split('T')[0],
    leadType: 'Tibio',
    status: 'En proceso',
    channel: 'Página Web'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const downloadTemplate = () => {
    const headers = Object.entries(COLUMNS).map(([key, value]) => ({
      label: value.label,
      required: value.required ? '(Requerido)' : '(Opcional)'
    }));
    
    const csvContent = Papa.unparse({
      fields: headers.map(h => `${h.label} ${h.required}`),
      data: [
        [
          '1',
          'Juan Pérez',
          'juan@empresa.com',
          '+56 9 1234 5678',
          'Empresa SA',
          'Tecnología',
          'Santiago, Chile',
          'Producto A',
          'Tibio',
          'Página Web',
          '2024-03-20',
          '2024-03-21',
          'Google Ads',
          '5',
          '3m',
          'En proceso'
        ]
      ]
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_leads.csv';
    link.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        try {
          const newCustomers = results.data.slice(1).map((row: any[], index) => ({
            id: customers.length + index + 1,
            name: row[1],
            email: row[2],
            phone: row[3],
            company: row[4],
            sector: row[5],
            location: row[6],
            interestedProduct: row[7],
            leadType: row[8] as Customer['leadType'],
            channel: row[9],
            firstContact: row[10],
            lastContact: row[11],
            leadSource: row[12],
            conversations: parseInt(row[13]) || 0,
            avgResponseTime: row[14],
            status: row[15] as Customer['status']
          }));

          setCustomers(prev => [...prev, ...newCustomers]);
          setUploadStatus('success');
          setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (error) {
          setUploadStatus('error');
          setTimeout(() => setUploadStatus('idle'), 3000);
        }
      }
    });
  };

  const handleNewCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = customers.length + 1;
    const customerData = {
      ...newCustomer,
      id: newId,
      conversations: 0,
      avgResponseTime: '0m'
    } as Customer;

    setCustomers(prev => [...prev, customerData]);
    setNewCustomer({
      firstContact: new Date().toISOString().split('T')[0],
      lastContact: new Date().toISOString().split('T')[0],
      leadType: 'Tibio',
      status: 'En proceso',
      channel: 'Página Web'
    });
    setShowNewCustomerForm(false);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'all' || customer.sector === selectedSector;
    const matchesLeadType = selectedLeadType === 'all' || customer.leadType === selectedLeadType;
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    const matchesChannel = selectedChannel === 'all' || customer.channel === selectedChannel;
    return matchesSearch && matchesSector && matchesLeadType && matchesStatus && matchesChannel;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'bg-green-100 text-green-700';
      case 'Perdido':
        return 'bg-red-100 text-red-700';
      case 'En proceso':
        return 'bg-yellow-100 text-yellow-700';
      case 'Fuga':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getLeadTypeColor = (type: string) => {
    switch (type) {
      case 'Caliente':
        return 'bg-red-100 text-red-700';
      case 'Tibio':
        return 'bg-orange-100 text-orange-700';
      case 'Frío':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const toggleColumn = (columnKey: keyof Customer) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const toggleAllColumns = () => {
    setVisibleColumns(prev => 
      prev.length === Object.keys(COLUMNS).length ? [] : Object.keys(COLUMNS) as Array<keyof Customer>
    );
  };

  const renderColumnHeader = (columnKey: keyof Customer) => {
    const column = COLUMNS[columnKey];
    const Icon = column.icon;
    
    return (
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span>{column.label}</span>
      </div>
    );
  };

  const renderCellContent = (customer: Customer, columnKey: keyof Customer) => {
    const value = customer[columnKey];
    const column = COLUMNS[columnKey];
    const Icon = column.icon;

    if (columnKey === 'status') {
      return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(value)}`}>
          {value}
        </span>
      );
    }

    if (columnKey === 'leadType') {
      return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLeadTypeColor(value)}`}>
          {value}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span>{value}</span>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Base de Datos</h1>
        <p className="text-gray-600 text-lg">Gestión de clientes y conversaciones</p>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o empresa..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <select
                className="appearance-none pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="all">Todos los sectores</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Retail">Retail</option>
                <option value="Servicios">Servicios</option>
              </select>
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                value={selectedLeadType}
                onChange={(e) => setSelectedLeadType(e.target.value)}
              >
                <option value="all">Todos los leads</option>
                <option value="Caliente">Caliente</option>
                <option value="Tibio">Tibio</option>
                <option value="Frío">Frío</option>
              </select>
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                <option value="all">Todos los canales</option>
                <option value="Página Web">Página Web</option>
                <option value="Meta">Meta</option>
                <option value="Google Ads">Google Ads</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Referido">Referido</option>
                <option value="Otro">Otro</option>
              </select>
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="Completado">Completado</option>
                <option value="Perdido">Perdido</option>
                <option value="En proceso">En proceso</option>
                <option value="Fuga">Fuga</option>
              </select>
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowColumnFilter(!showColumnFilter)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Columns className="w-5 h-5" />
                <span>Columnas</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showColumnFilter && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                    <h3 className="font-medium">Mostrar columnas</h3>
                    <button
                      onClick={toggleAllColumns}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      {visibleColumns.length === Object.keys(COLUMNS).length ? 'Ocultar todo' : 'Mostrar todo'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(Object.entries(COLUMNS) as [keyof Customer, ColumnDefinition][]).map(([key, { label }]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(key)}
                          onChange={() => toggleColumn(key)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Import/Export Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Importar/Exportar Leads</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-white flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla</span>
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-white flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir CSV</span>
                </button>

                {uploadStatus === 'success' && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Importado con éxito
                  </span>
                )}

                {uploadStatus === 'error' && (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
                    <X className="w-4 h-4" />
                    Error al importar
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {visibleColumns.map(columnKey => (
                  <th key={columnKey} className="text-left py-3 px-4">
                    {renderColumnHeader(columnKey)}
                  </th>
                ))}
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {visibleColumns.map(columnKey => (
                    <td key={columnKey} className="py-4 px-4">
                      {renderCellContent(customer, columnKey)}
                    </td>
                  ))}
                  <td className="py-4 px-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Lead Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowNewCustomerForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Lead</span>
          </button>
        </div>

        {/* New Customer Form Modal */}
        {showNewCustomerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Nuevo Lead</h3>
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleNewCustomerSubmit} className="space-y-4">
                {Object.entries(COLUMNS).map(([key, value]) => {
                  if (key === 'id' || key === 'conversations' || key === 'avgResponseTime') return null;
                  
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {value.label}
                        {value.required && <span className="text-red-500">*</span>}
                      </label>
                      {value.type === 'select' ? (
                        <select
                          value={newCustomer[key as keyof Customer] || ''}
                          onChange={(e) => setNewCustomer({
                            ...newCustomer,
                            [key]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          required={value.required}
                        >
                          <option value="">Seleccionar...</option>
                          {value.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={value.type || 'text'}
                          value={newCustomer[key as keyof Customer] || ''}
                          onChange={(e) => setNewCustomer({
                            ...newCustomer,
                            [key]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          required={value.required}
                        />
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Database;