import React from 'react';
import { Info } from 'lucide-react';
import { NoaConfig } from '../../services/api/ConfigApi';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

interface ConfigPanelProps {
  config: NoaConfig;
  onConfigChange: (field: keyof NoaConfig, value: string | number) => void;
  onSaveConfig: () => Promise<void>;
  isLoading: boolean;
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

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onConfigChange,
  onSaveConfig,
  isLoading
}) => {
  // Asegurarnos que temperature es un número válido para el input range
  const temperatureValue = isNaN(config.temperature) ? 70 : config.temperature * 100;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="space-y-8">
          {/* Configuración: Prompt */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold">Instrucción General</h3>
              <Tooltip content="Define el comportamiento base del asistente.">
                <Info className="w-5 h-5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <textarea
              value={config.prompt}
              onChange={(e) => onConfigChange('prompt', e.target.value)}
              className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Define la instrucción principal..."
            />
          </div>

          {/* Configuración: Modelo */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold">Modelo de IA</h3>
              <Tooltip content="El modelo determina las capacidades del asistente.">
                <Info className="w-5 h-5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <select
              value={config.model}
              onChange={(e) => onConfigChange('model', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="gpt4">GPT-4 (Recomendado)</option>
              <option value="gpt35">GPT-3.5</option>
              <option value="gpt3">GPT-3</option>
            </select>
          </div>

          {/* Configuración: Temperatura */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold">Temperatura</h3>
              <Tooltip content="Controla la creatividad de las respuestas.">
                <Info className="w-5 h-5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={temperatureValue}
                onChange={(e) => onConfigChange('temperature', Number(e.target.value) / 100)}
                className="flex-1"
              />
              <span className="text-gray-600 font-mono w-12">
                {config.temperature.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Configuración: Objetivo */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold">Objetivo del Bot</h3>
              <Tooltip content="Define el propósito principal del asistente.">
                <Info className="w-5 h-5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <select
              value={config.objective}
              onChange={(e) => onConfigChange('objective', e.target.value)}
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

          {/* Configuración: Personalidad */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold">Personalidad</h3>
              <Tooltip content="Define el estilo de comunicación del asistente.">
                <Info className="w-5 h-5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <select
              value={config.personality}
              onChange={(e) => onConfigChange('personality', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="professional">Profesional</option>
              <option value="friendly">Amigable</option>
              <option value="technical">Técnico</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <button
            onClick={onSaveConfig}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;