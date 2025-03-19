import { apiService } from "./api";

export interface NoaConfig {
  prompt: string;
  model: string;
  temperature: number;
  personality: string;
  objective: string;
}

export const configApiService = {
  /**
   * Obtiene la configuración actual de NOA desde el servidor
   */
  getConfig: async (): Promise<NoaConfig> => {
    try {
      const response = await apiService.get<NoaConfig>("/noa/config");
      return response.data;
    } catch (error) {
      console.error("Error al obtener la configuración de NOA:", error);
      // Devolver una configuración por defecto en caso de error
      return {
        prompt: '',
        model: 'gpt4',
        temperature: 0.7,
        personality: 'professional',
        objective: 'sales',
      };
    }
  },

  /**
   * Guarda la configuración de NOA en el servidor
   */
  saveConfig: async (config: NoaConfig): Promise<{ message: string }> => {
    try {
      const response = await apiService.post<{ message: string }>("/noa/config", config);
      return {
        message: response.data.message || 'Configuración guardada exitosamente'
      };
    } catch (error) {
      console.error("Error al guardar la configuración de NOA:", error);
      throw error;
    }
  }
};