import React, { useState } from 'react';
import { Bot, Settings, Info, Send, User, MessageSquare } from 'lucide-react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute z-10 w-64 bg-gray-900 text-white text-sm rounded-lg py-2 px-3 -right-2 top-full mt-2 pointer-events-none">
        {content}
        <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45" />
      </div>
    </div>
  );
};

const Noa = () => {
  const [config, setConfig] = useState({
    prompt: '',
    model: 'gpt4',
    temperature: 0.7,
    personality: 'professional',
    objective: 'sales'
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: '¡Hola! Soy NOA, tu asistente virtual. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const getPersonalityPrompt = () => {
    switch (config.personality) {
      case 'professional':
        return 'formal y profesional';
      case 'friendly':
        return 'amigable y cercano';
      case 'technical':
        return 'técnico y detallado';
      case 'casual':
        return 'casual y relajado';
      case 'formal':
        return 'muy formal y serio';
      default:
        return 'profesional';
    }
  };

  const getObjectivePrompt = () => {
    switch (config.objective) {
      case 'sales':
        return 'enfocado en ventas y conversión';
      case 'support':
        return 'orientado al soporte técnico';
      case 'scheduling':
        return 'especializado en agendar reuniones';
      case 'qualification':
        return 'enfocado en calificar leads';
      case 'product_recommendation':
        return 'experto en recomendar productos';
      case 'customer_service':
        return 'centrado en atención al cliente';
      default:
        return 'enfocado en ventas';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTesting(true);

    // Simulate bot response based on configuration
    setTimeout(() => {
      const personality = getPersonalityPrompt();
      const objective = getObjectivePrompt();
      
      let response = `[Simulación de respuesta ${personality}, ${objective}] `;
      
      if (config.temperature < 0.3) {
        response += 'Respuesta concisa y directa: ';
      } else if (config.temperature > 0.7) {
        response += 'Respuesta creativa y elaborada: ';
      }

      response += 'Gracias por tu mensaje. ¿Hay algo más en lo que pueda ayudarte?';

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, botMessage]);
      setIsTesting(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Configuración de NOA</h1>
        <p className="text-gray-600 text-lg">Personaliza el comportamiento de tu asistente</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="space-y-8">
              {/* Prompt Configuration */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold">Instrucción General</h3>
                  <Tooltip content="Define el comportamiento base del asistente. Esta instrucción actúa como la directriz principal que NOA seguirá en todas sus interacciones.">
                    <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <textarea
                  value={config.prompt}
                  onChange={(e) => handleChange('prompt', e.target.value)}
                  className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Define la instrucción principal que regulará el comportamiento del asistente..."
                />
              </div>

              {/* Model Selection */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold">Modelo de IA</h3>
                  <Tooltip content="El modelo determina las capacidades y el rendimiento del asistente. Modelos más avanzados ofrecen mejor comprensión y respuestas más precisas.">
                    <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <select
                  value={config.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="gpt4">GPT-4 (Recomendado)</option>
                  <option value="gpt35">GPT-3.5</option>
                  <option value="gpt3">GPT-3</option>
                </select>
              </div>

              {/* Temperature Control */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold">Temperatura</h3>
                  <Tooltip content="Controla la creatividad vs. precisión de las respuestas. Valores más altos (cercanos a 1) generan respuestas más creativas pero menos predecibles, mientras que valores más bajos producen respuestas más consistentes y conservadoras.">
                    <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.temperature * 100}
                    onChange={(e) => handleChange('temperature', Number(e.target.value) / 100)}
                    className="flex-1"
                  />
                  <span className="text-gray-600 font-mono w-12">{config.temperature.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Controla la creatividad de las respuestas
                </p>
              </div>

              {/* Bot Objective */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold">Objetivo del Bot</h3>
                  <Tooltip content="Define el propósito principal del asistente. Esto ayuda a NOA a enfocar sus respuestas y estrategias hacia el objetivo específico de tu negocio.">
                    <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <select
                  value={config.objective}
                  onChange={(e) => handleChange('objective', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="sales">Ventas de Productos</option>
                  <option value="support">Soporte Técnico</option>
                  <option value="scheduling">Agendar Reuniones</option>
                  <option value="qualification">Calificación de Leads</option>
                  <option value="product_recommendation">Recomendación de Productos</option>
                  <option value="customer_service">Atención al Cliente</option>
                </select>
              </div>

              {/* Personality Selection */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold">Personalidad</h3>
                  <Tooltip content="Define el estilo de comunicación del asistente. La personalidad afecta el tono y la forma en que NOA interactúa con los usuarios.">
                    <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <select
                  value={config.personality}
                  onChange={(e) => handleChange('personality', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="professional">Profesional</option>
                  <option value="friendly">Amigable</option>
                  <option value="technical">Técnico</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>

        {/* Chat Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-xl font-bold">Vista Previa del Chat</h3>
            <Tooltip content="Prueba cómo se comportará NOA con la configuración actual. Las respuestas son simuladas para demostración.">
              <Info className="w-5 h-5 text-gray-400 cursor-help" />
            </Tooltip>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 h-[600px] flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user'
                        ? 'bg-purple-100'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-purple-50'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe un mensaje para probar..."
                  className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  disabled={isTesting}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isTesting}
                  className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Noa;