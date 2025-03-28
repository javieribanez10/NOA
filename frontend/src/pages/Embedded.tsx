import React, { useState } from 'react';
import {
  Code,
  Copy,
  CheckCircle,
  MessageCircle,
  Send,
  User,
  Bot,
  X,
  Palette,
  Layout,
  Type,
  MessageSquare
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

interface BubbleConfig {
  initialMessage: string;
  title: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  fontSize: string;
  fontFamily: string;
}

interface EmbeddedConfig {
  apiKey?: string;
  theme?: string;
  position?: string;
  type?: string;
  bubbleConfig?: BubbleConfig;
}

interface EmbeddedProps {
  config?: EmbeddedConfig;
}

const Embedded: React.FC<EmbeddedProps> = ({ config }) => {
  // Utilizar la configuración pasada vía props o valores por defecto
  const [widgetType, setWidgetType] = useState(config?.type || 'bubble');
  const [position, setPosition] = useState(config?.position || 'bottom-right');
  const [theme, setTheme] = useState(config?.theme || 'light');
  const [bubbleConfig, setBubbleConfig] = useState<BubbleConfig>(
    config?.bubbleConfig || {
      initialMessage: '¡Hola! ¿En qué puedo ayudarte?',
      title: 'N.O.A Assistant',
      subtitle: 'Respuesta en segundos',
      primaryColor: '#7e22ce',
      secondaryColor: '#db2777',
      textColor: '#1f2937',
      fontSize: '14px',
      fontFamily: 'Poppins'
    }
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: '¡Hola! Soy N.O.A, tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const getEmbedCode = () => {
    return `<script>
  window.NOA = {
    config: {
      apiKey: 'your-api-key',
      theme: '${theme}',
      position: '${position}',
      type: '${widgetType}',
      bubbleConfig: {
        initialMessage: '${bubbleConfig.initialMessage}',
        title: '${bubbleConfig.title}',
        subtitle: '${bubbleConfig.subtitle}',
        primaryColor: '${bubbleConfig.primaryColor}',
        secondaryColor: '${bubbleConfig.secondaryColor}',
        textColor: '${bubbleConfig.textColor}',
        fontSize: '${bubbleConfig.fontSize}',
        fontFamily: '${bubbleConfig.fontFamily}'
      }
    }
  };
</script>
<script src="https://cdn.noa.ai/widget.js"></script>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: 'Gracias por tu mensaje. ¿Hay algo más en lo que pueda ayudarte?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 min-h-screen flex flex-col">
      <header className="py-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Código Embebido</h1>
        <p className="text-gray-600 text-base md:text-lg">Integra N.O.A en tu sitio web</p>
      </header>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Widget Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold mb-3">Tipo de Widget</h3>
          <div className="space-y-2">
            <button
              className={`w-full p-3 border rounded-xl flex items-center gap-2 transition-all ${
                widgetType === 'bubble'
                  ? 'border-purple-600 bg-purple-50 text-purple-600'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setWidgetType('bubble')}
            >
              <MessageCircle className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Burbuja</div>
                <div className="text-xs text-gray-600">Widget flotante</div>
              </div>
            </button>
            <button
              className={`w-full p-3 border rounded-xl flex items-center gap-2 transition-all ${
                widgetType === 'embed'
                  ? 'border-purple-600 bg-purple-50 text-purple-600'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setWidgetType('embed')}
            >
              <Code className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Embebido</div>
                <div className="text-xs text-gray-600">En página</div>
              </div>
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold mb-3">Apariencia</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color Primario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bubbleConfig.primaryColor}
                  onChange={(e) => setBubbleConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-8 h-8 p-0.5 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={bubbleConfig.primaryColor}
                  onChange={(e) => setBubbleConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color Secundario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bubbleConfig.secondaryColor}
                  onChange={(e) => setBubbleConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-8 h-8 p-0.5 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={bubbleConfig.secondaryColor}
                  onChange={(e) => setBubbleConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold mb-3">Tipografía</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
              <select
                value={bubbleConfig.fontSize}
                onChange={(e) => setBubbleConfig(prev => ({ ...prev, fontSize: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              >
                <option value="12px">Pequeño (12px)</option>
                <option value="14px">Mediano (14px)</option>
                <option value="16px">Grande (16px)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
              <select
                value={bubbleConfig.fontFamily}
                onChange={(e) => setBubbleConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              >
                <option value="Poppins">Poppins</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold mb-3">Contenido</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={bubbleConfig.title}
                onChange={(e) => setBubbleConfig(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
                placeholder="N.O.A Assistant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <input
                type="text"
                value={bubbleConfig.subtitle}
                onChange={(e) => setBubbleConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
                placeholder="Respuesta en segundos"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Code and Preview Section */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Código de Integración</h3>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-white text-sm h-[calc(100%-3rem)] overflow-auto">
            <pre className="whitespace-pre-wrap">
              {getEmbedCode()}
            </pre>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold mb-3">Vista Previa</h3>
          <div className="relative h-[calc(100%-3rem)] bg-gray-50 rounded-lg border border-gray-200">
            {widgetType === 'bubble' && !isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className={`absolute ${position.includes('right') ? 'right-4' : 'left-4'} ${
                  position.includes('top') ? 'top-4' : 'bottom-4'
                } p-3 rounded-full shadow-lg hover:opacity-90 transition-opacity`}
                style={{
                  background: `linear-gradient(to right, ${bubbleConfig.primaryColor}, ${bubbleConfig.secondaryColor})`
                }}
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
            )}

            {(widgetType === 'embed' || isChatOpen) && (
              <div className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                <div
                  className="p-3 flex items-center justify-between"
                  style={{
                    background: `linear-gradient(to right, ${bubbleConfig.primaryColor}, ${bubbleConfig.secondaryColor})`,
                    color: '#fff'
                  }}
                >
                  <div>
                    <h3 className="font-semibold">{bubbleConfig.title}</h3>
                    <p className="text-sm opacity-90">{bubbleConfig.subtitle}</p>
                  </div>
                  {widgetType === 'bubble' && (
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1 hover:bg-white/10 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div
                  className="flex-1 p-4 space-y-4 overflow-y-auto"
                  style={{
                    fontSize: bubbleConfig.fontSize,
                    fontFamily: bubbleConfig.fontFamily,
                    color: bubbleConfig.textColor
                  }}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${
                        msg.type === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.type === 'user'
                            ? 'bg-purple-100'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600'
                        }`}
                      >
                        {msg.type === 'user' ? (
                          <User className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-purple-50'
                            : 'bg-gray-100'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                      style={{
                        background: `linear-gradient(to right, ${bubbleConfig.primaryColor}, ${bubbleConfig.secondaryColor})`
                      }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Embedded;
