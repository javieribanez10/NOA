import React, { useState, useRef } from 'react';
import { Upload, PencilLine, Check, AlertCircle, X } from 'lucide-react';
import { sourcesApiService } from '../../services/api/sourcesApi';

interface KnowledgeSection {
  id: string;
  title: string;
  description: string;
  acceptedTypes: string;
  maxSize: number;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea';
    required?: boolean;
  }>;
}

interface FileUploaderProps {
  currentSection: KnowledgeSection;
  onUploadSuccess: () => void;
  onManualEntrySuccess: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  currentSection, 
  onUploadSuccess,
  onManualEntrySuccess 
}) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormData, setManualFormData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subir archivos al backend
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploadStatus('uploading');

    try {
      // Construir formData con los archivos
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
      }
      
      // Añadir la sección como parámetro
      formData.append('section', currentSection.id);

      // Llamar a la API
      const response = await sourcesApiService.uploadFile(formData);
      console.log('Upload response:', response);

      setUploadStatus('success');
      
      // Notificar al componente padre
      onUploadSuccess();

      // Resetear el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Volver a 'idle' después de 1 segundo
      setTimeout(() => {
        setUploadStatus('idle');
      }, 1000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      
      // Volver a 'idle' después de 2 segundos en caso de error
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
    }
  };

  // Carga manual al backend
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatus('uploading');

    try {
      // Preparar los datos para la API
      const dataToSend = {
        ...manualFormData,
        section: currentSection.id,
      };

      const response = await sourcesApiService.uploadManual(dataToSend);
      console.log('Manual upload response:', response);

      setUploadStatus('success');
      
      // Notificar al componente padre - ahora solo llamamos a la función sin parámetros
      onManualEntrySuccess();

      // Resetear el formulario
      setManualFormData({});
      setShowManualForm(false);

      setTimeout(() => {
        setUploadStatus('idle');
      }, 1000);
    } catch (error) {
      console.error('Error uploading manual data:', error);
      setUploadStatus('error');
      
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-4">
          {/* INPUT para subir archivos */}
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
              <span>Operación exitosa</span>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Error en la operación</span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Form Modal */}
      {showManualForm && (
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
                      onChange={(e) =>
                        setManualFormData((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent min-h-[100px]"
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      value={manualFormData[field.name] || ''}
                      onChange={(e) =>
                        setManualFormData((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
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

export default FileUploader;