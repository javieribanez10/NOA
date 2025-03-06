import React from 'react';

interface TermsAndConditionsProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Términos y Condiciones</h2>
        
        <div className="prose prose-sm">
          <h3>1. Aceptación de los términos</h3>
          <p>Al acceder y utilizar N.O.A, aceptas estos términos y condiciones en su totalidad.</p>

          <h3>2. Uso del servicio</h3>
          <p>Te comprometes a utilizar el servicio de manera ética y legal, respetando las políticas de uso establecidas.</p>

          <h3>3. Privacidad y datos</h3>
          <p>Nos comprometemos a proteger tu información personal según nuestra política de privacidad.</p>

          <h3>4. Limitación de responsabilidad</h3>
          <p>N.O.A se proporciona "tal cual", sin garantías de ningún tipo.</p>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;