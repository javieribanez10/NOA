import React, { useState, useEffect } from 'react';
import { NoaConfig, configApiService } from '../services/api/ConfigApi';
import { chatApiService } from '../services/api/ChatApi';

// Importación con ruta correcta a los componentes en /components/noa/
import ConfigPanel from '../components/Noa/ConfigPanel';
import ChatPreview, { ChatMessage } from '../components/Noa/ChatPreview';

const Noa: React.FC = () => {
  // Estado para la configuración con valores por defecto
  const [config, setConfig] = useState<NoaConfig>({
    prompt: '',
    model: 'gpt4',
    temperature: 0.7,
    personality: 'professional',
    objective: 'sales',
  });

  // Estados para el chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: '¡Hola! Soy NOA, tu asistente virtual. ¿En qué puedo ayudarte?',
      timestamp: new Date(),
    },
  ]);
  
  // Estados para manejo de carga y errores
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');

  // Cargar la configuración del backend al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoadingConfig(true);
        setError('');
        const serverConfig = await configApiService.getConfig();
        // Aseguramos que temperature sea un número
        setConfig({
          ...serverConfig,
          temperature: typeof serverConfig.temperature === 'number' ? serverConfig.temperature : 0.7,
        });
      } catch (err) {
        console.error('Error al cargar configuración de NOA:', err);
        setError('No se pudo cargar la configuración de NOA. Usando configuración por defecto.');
        // No hacemos nada más ya que el estado ya tiene valores por defecto
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  // Manejador de cambios en los campos de config
  const handleConfigChange = (field: keyof NoaConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Guardar la configuración en el backend
  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      setError('');
      const result = await configApiService.saveConfig(config);
      alert(result.message || 'Configuración guardada exitosamente');
      
      // Si el guardado es exitoso, intentamos recargar la configuración para confirmar
      try {
        const updatedConfig = await configApiService.getConfig();
        setConfig({
          ...updatedConfig,
          temperature: typeof updatedConfig.temperature === 'number' ? updatedConfig.temperature : config.temperature,
        });
      } catch (loadErr) {
        // Si falla la recarga, mantenemos el estado actual
        console.error('Error recargando configuración NOA después de guardar:', loadErr);
      }
    } catch (err) {
      console.error('Error guardando configuración NOA:', err);
      setError('No se pudo guardar la configuración de NOA. Verifique la conexión al servidor.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Manejador de envío de mensaje
  const handleSendMessage = async (messageText: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setSendingMessage(true);

    try {
      const { response } = await chatApiService.sendChatMessage(messageText);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response || 'Lo siento, no pude procesar tu mensaje en este momento.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      // Agregar un mensaje de error al chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente más tarde.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Configuración de NOA</h1>
        <p className="text-gray-600 text-lg">Personaliza el comportamiento de tu asistente</p>
      </header>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 mb-4 rounded-lg">
          {error}
        </div>
      )}

      {loadingConfig ? (
        <div className="text-center py-8">
          <p className="text-lg">Cargando configuración...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Configuración */}
          <ConfigPanel 
            config={config}
            onConfigChange={handleConfigChange}
            onSaveConfig={handleSaveConfig}
            isLoading={savingConfig}
          />

          {/* Vista Previa del Chat */}
          <ChatPreview 
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isSending={sendingMessage}
          />
        </div>
      )}
    </div>
  );
};

export default Noa;