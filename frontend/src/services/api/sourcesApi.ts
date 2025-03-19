// services/api/sourcesApi.ts
import { apiService } from './api';

interface GetUserFilesParams {
  section?: string;
}

class SourcesApiService {
  // Obtiene la lista de archivos subidos por el usuario
  async getUserFiles(params?: GetUserFilesParams) {
    let url = '/user-files';
    
    // Añadir parámetros de consulta si se proporcionan
    if (params?.section) {
      url += `?section=${encodeURIComponent(params.section)}`;
    }
    
    const response = await apiService.get(url);
    return response.data;
  }

  // Sube un archivo
  async uploadFile(formData: FormData) {
    const response = await apiService.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Envía una "carga manual" de texto para generar embeddings
  async uploadManual(data: Record<string, any>) {
    const response = await apiService.post('/upload/manual', data);
    return response.data;
  }

  // Elimina un archivo y sus embeddings asociados
  async deleteFile(fileId: number) {
    // Para respuestas 204 (No Content), no se espera un body en la respuesta
    await apiService.delete(`/user-files/${fileId}`);
    return { success: true };
  }

  // Elimina una entrada manual y sus embeddings asociados
  async deleteManualEntry(entryId: number) {
    // Usar la nueva URL del endpoint
    await apiService.delete(`/manual-entries/${entryId}`);
    return { success: true };
  }
}

export const sourcesApiService = new SourcesApiService();