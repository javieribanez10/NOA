import React, { useState, useRef } from 'react';
import { Book, FileText, Building, Upload, X, Check, AlertCircle, Plus, PencilLine } from 'lucide-react';

interface KnowledgeSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  acceptedTypes: string;
  maxSize: number;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea';
    required?: boolean;
  }>;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  section: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
}

interface ManualEntry {
  id: string;
  section: string;
  title: string;
  content: Record<string, string>;
  createdAt: string;
}

const Sources = () => {
  const [activeSection, setActiveSection] = useState<string>('products');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormData, setManualFormData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sections: KnowledgeSection[] = [
    {
      id: 'products',
      title: 'Documentos de Producto',
      description: 'Catálogos, especificaciones y manuales de producto',
      icon: FileText,
      acceptedTypes: '.pdf,.doc,.docx',
      maxSize: 10,
      fields: [
        { name: 'productName', label: 'Nombre del Producto', type: 'text', required: true },
        { name: 'description', label: 'Descripción', type: 'textarea', required: true },
        { name: 'specifications', label: 'Especificaciones Técnicas', type: 'textarea' },
        { name: 'pricing', label: 'Información de Precios', type: 'textarea' }
      ]
    },
    {
      id: 'company',
      title: 'Conocimiento General',
      description: 'Documentación corporativa y políticas',
      icon: Building,
      acceptedTypes: '.pdf,.doc,.docx,.txt',
      maxSize: 10,
      fields: [
        { name: 'title', label: 'Título del Documento', type: 'text', required: true },
        { name: 'content', label: 'Contenido', type: 'textarea', required: true },
        { name: 'department', label: 'Departamento', type: 'text' },
        { name: 'policies', label: 'Políticas Aplicables', type: 'textarea' }
      ]
    },
    {
      id: 'knowledge',
      title: 'Base de Conocimiento',
      description: 'FAQs y documentación de soporte',
      icon: Book,
      acceptedTypes: '.pdf,.doc,.docx,.txt,.md',
      maxSize: 10,
      fields: [
        { name: 'topic', label: 'Tema', type: 'text', required: true },
        { name: 'question', label: 'Pregunta', type: 'text', required: true },
        { name: 'answer', label: 'Respuesta', type: 'textarea', required: true },
        { name: 'category', label: 'Categoría', type: 'text' }
      ]
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploadStatus('uploading');
    
    setTimeout(() => {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        section: activeSection,
        uploadDate: new Date().toISOString(),
        status: 'processing'
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      setUploadStatus('success');

      setTimeout(() => {
        setUploadedFiles(prev =>
          prev.map(f =>
            newFiles.find(nf => nf.id === f.id)
              ? { ...f, status: 'ready' }
              : f
          )
        );
        setUploadStatus('idle');
      }, 2000);
    }, 1500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: ManualEntry = {
      id: Math.random().toString(36).substr(2, 9),
      section: activeSection,
      title: manualFormData.title || manualFormData.productName || manualFormData.topic || '',
      content: manualFormData,
      createdAt: new Date().toISOString()
    };

    setManualEntries(prev => [...prev, newEntry]);
    setManualFormData({});
    setShowManualForm(false);
  };

  const handleDelete = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDeleteManual = (entryId: string) => {
    setManualEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const activeFiles = uploadedFiles.filter(f => f.section === activeSection);
  const activeManualEntries = manualEntries.filter(e => e.section === activeSection);
  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="container mx-auto px-4">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Sources</h1>
        <p className="text-gray-600 text-base md:text-lg">Gestiona el conocimiento base de NOA</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`p-6 rounded-xl border transition-all ${
              activeSection === section.id
                ? 'border-purple-200 bg-purple-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50'
            }`}
          >
            <section.icon className={`w-8 h-8 mb-4 ${
              activeSection === section.id ? 'text-purple-600' : 'text-gray-400'
            }`} />
            <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
            <p className="text-sm text-gray-600">{section.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-2">{currentSection?.title}</h2>
          <p className="text-gray-600">{currentSection?.description}</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept={currentSection?.acceptedTypes}
              className="hidden"
              multiple
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
            >
              <Upload className="w-5 h-5" />
              <span>Subir Archivos</span>
            </button>

            <button
              onClick={() => setShowManualForm(true)}
              className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <PencilLine className="w-5 h-5" />
              <span>Carga Manual</span>
            </button>

            <div className="text-sm text-gray-500 w-full md:w-auto">
              Formatos: {currentSection?.acceptedTypes} (máx. {currentSection?.maxSize}MB)
            </div>

            {uploadStatus === 'uploading' && (
              <div className="flex items-center gap-2 text-purple-600">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Subiendo...</span>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span>Archivos subidos correctamente</span>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Error al subir archivos</span>
              </div>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {/* File Uploads */}
          {activeFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4 min-w-0">
                <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium truncate">{file.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                {file.status === 'processing' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm whitespace-nowrap">
                    Procesando...
                  </span>
                )}
                {file.status === 'ready' && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm whitespace-nowrap">
                    Listo
                  </span>
                )}
                {file.status === 'error' && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm whitespace-nowrap">
                    Error
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          {/* Manual Entries */}
          {activeManualEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200"
            >
              <div className="flex items-center gap-4 min-w-0">
                <PencilLine className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium truncate">{entry.title}</h4>
                  <p className="text-sm text-gray-500">
                    Entrada manual • {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteManual(entry.id)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          {activeFiles.length === 0 && activeManualEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay contenido en esta sección
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Form Modal */}
      {showManualForm && currentSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Carga Manual - {currentSection.title}</h3>
              <button
                onClick={() => setShowManualForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              {currentSection.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={manualFormData[field.name] || ''}
                      onChange={(e) => setManualFormData(prev => ({
                        ...prev,
                        [field.name]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent min-h-[100px]"
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      value={manualFormData[field.name] || ''}
                      onChange={(e) => setManualFormData(prev => ({
                        ...prev,
                        [field.name]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
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
  );
};

export default Sources;