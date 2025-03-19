// services/api/ChatApi.ts
import { apiService } from "./api";

export interface ChatResponse {
  response: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const chatApiService = {
  /**
   * Envía un mensaje al chat de NOA y obtiene una respuesta
   * @param message Mensaje del usuario
   */
  sendChatMessage: async (message: string): Promise<ChatResponse> => {
    try {
      // Corregido: usar la ruta correcta según main.py
      const response = await apiService.post<ChatResponse>("/chat", { message });
      return response.data;
    } catch (error) {
      console.error("Error al enviar mensaje al chat:", error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de conversaciones (si el endpoint está disponible)
   */
  getChatHistory: async (): Promise<{ messages: ChatMessage[] }> => {
    try {
      // Corregido: usar la ruta correcta según main.py
      const response = await apiService.get<{ messages: ChatMessage[] }>("/chat/history");
      return response.data;
    } catch (error) {
      console.error("Error al obtener historial de chat:", error);
      return { messages: [] };
    }
  },

  /**
   * Limpia el historial de conversaciones (si el endpoint está disponible)
   */
  clearChatHistory: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      // Corregido: usar la ruta correcta según main.py
      const response = await apiService.delete<{ success: boolean; message?: string }>("/chat/history");
      return response.data;
    } catch (error) {
      console.error("Error al limpiar historial de chat:", error);
      throw error;
    }
  }
};