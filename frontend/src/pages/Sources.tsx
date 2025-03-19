import React, { useState, useEffect } from 'react';
import { Book, FileText, Building, X, PencilLine } from 'lucide-react';
import { sourcesApiService } from '../services/api/sourcesApi';
import FileUploader from '../components/Sources/FileUploader';

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

interface ContentItem {
  id: string;
  name: string;
  size?: number;
  section: string;
  uploadDate: string;
  status?: 'processing' | 'ready' | 'error';
  type: 'file' | 'manual';
  content?: Record<string, any>;
}

const Sources = () => {
  const [activeSection, setActiveSection] = useState<string>('products');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // 1. Secciones (igual que antes)
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

  // Efecto que se ejecuta cuando cambia la sección activa
  useEffect(() => {
    fetchContentFromServer();
  }, [activeSection]); // Se ejecuta cuando cambia activeSection

  // Función para cargar la lista de archivos y entradas manuales filtrada por sección
  const fetchContentFromServer = async () => {
    try {
      // Llamamos a la API con el filtro de sección
      const serverList = await sourcesApiService.getUserFiles({ 
        section: activeSection 
      });

      // Mapeamos cada item del servidor a nuestro formato ContentItem
      const mapped = serverList.map((item: any) => {
        return {
          id: item.id.toString(),
          name: item.original_filename,
          size: item.file_size || 0,
          section: item.section || activeSection,
          uploadDate: item.upload_date || item.created_at,
          status: item.type === 'manual' ? 'ready' : (
            item.processing_status === 'completed'
              ? 'ready'
              : item.processing_status === 'error'
              ? 'error'
              : 'processing'
          ),
          type: item.type || 'file',
          content: item.content
        } as ContentItem;
      });

      setContentItems(mapped);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  // Manejador para cambiar de sección
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    // fetchContentFromServer se ejecutará automáticamente debido al useEffect
  };

  // Función para manejar una carga manual exitosa desde FileUploader
  const handleManualEntrySuccess = () => {
    // Ya no necesitamos añadir manualmente, simplemente recargamos todo
    fetchContentFromServer();
  };

  // Eliminar archivo o entrada manual
  const handleDelete = async (item: ContentItem) => {
    const isManual = item.type === 'manual';
    const confirmMessage = isManual
      ? '¿Estás seguro de que deseas eliminar esta entrada manual? Esta acción eliminará también todos los embeddings asociados y no se puede deshacer.'
      : '¿Estás seguro de que deseas eliminar este archivo? Esta acción eliminará también todos los embeddings asociados y no se puede deshacer.';
    
    try {
      // Mostrar confirmación
      if (!confirm(confirmMessage)) {
        return;
      }
      
      // Actualizar estado para mostrar indicador de carga
      setDeletingItemId(item.id);
      
      // Llamar a la API correspondiente para eliminar
      if (isManual) {
        await sourcesApiService.deleteManualEntry(parseInt(item.id));
      } else {
        await sourcesApiService.deleteFile(parseInt(item.id));
      }
      
      // Actualizar estado local eliminando el item
      setContentItems((prev) => prev.filter((i) => i.id !== item.id));
      
      console.log(isManual ? 'Entrada manual eliminada correctamente' : 'Archivo eliminado correctamente');
      
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar. Por favor, inténtalo de nuevo.');
    } finally {
      // Siempre resetear el estado de eliminación
      setDeletingItemId(null);
    }
  };

  // Helper para formatear tamaño
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Derivar estado
  const currentSection = sections.find((s) => s.id === activeSection);

  // Render
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
            onClick={() => handleSectionChange(section.id)}
            className={`p-6 rounded-xl border transition-all ${
              activeSection === section.id
                ? 'border-purple-200 bg-purple-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50'
            }`}
          >
            <section.icon
              className={`w-8 h-8 mb-4 ${
                activeSection === section.id ? 'text-purple-600' : 'text-gray-400'
              }`}
            />
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

        {/* Componente FileUploader */}
        {currentSection && (
          <FileUploader
            currentSection={currentSection}
            onUploadSuccess={fetchContentFromServer}
            onManualEntrySuccess={handleManualEntrySuccess}
          />
        )}

        {/* Content List */}
        <div className="space-y-4">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                item.type === 'manual'
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {item.type === 'manual' ? (
                  <PencilLine className="w-6 h-6 text-purple-600 flex-shrink-0" />
                ) : (
                  <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <h4 className="font-medium truncate">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.type === 'manual' 
                      ? 'Entrada manual'
                      : formatFileSize(item.size || 0)} • {new Date(item.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                {item.status === 'processing' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm whitespace-nowrap">
                    Procesando...
                  </span>
                )}
                {item.status === 'ready' && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm whitespace-nowrap">
                    Listo
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm whitespace-nowrap">
                    Error
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(item)}
                disabled={deletingItemId === item.id}
                className={`p-2 rounded-lg hover:bg-gray-100 flex-shrink-0 ${
                  deletingItemId === item.id ? 'text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                {deletingItemId === item.id ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}

          {contentItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay contenido en esta sección
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sources;