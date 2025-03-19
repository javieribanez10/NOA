// services/api/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, AxiosProgressEvent } from 'axios';

// Definición de tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Configuraciones por defecto para el cliente axios
const API_URL = 'http://localhost:8000/api/v1';

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    // Crear instancia de Axios con configuración base
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 segundos timeout
    });

    // Interceptor para agregar el token de autorización
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar errores y tokens expirados
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Si el token expiró y no es un intento de refresh
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          // Evitamos bucles infinitos en el refresh
          !originalRequest.url?.includes('refresh')
        ) {
          originalRequest._retry = true;

          try {
            // Evitamos múltiples llamadas de refresh simultáneas
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshToken();
            }
            
            const newToken = await this.refreshPromise;
            
            // Actualizar el token en el almacenamiento
            localStorage.setItem('token', newToken);
            
            // Actualizar el token en la petición original
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }
            
            // Reintentar la petición original
            return this.api(originalRequest);
          } catch (refreshError) {
            // Si el refresh falla, redirigir al login
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.refreshPromise = null;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Método para refrescar el token
  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post(`${API_URL}/users/refresh`, {
        refresh_token: refreshToken
      });
      
      const { access_token, refresh_token } = response.data;
      
      // Actualizar también el refresh token si se proporciona uno nuevo
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      return access_token;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  // Método para obtener datos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.api.get(url, config);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Método para enviar datos
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.api.post(url, data, config);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Método para actualizar datos
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.api.put(url, data, config);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Método para actualizar datos parcialmente
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.api.patch(url, data, config);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Método para eliminar datos
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.api.delete(url, config);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Manejo centralizado de errores
  private handleError(error: AxiosError): never {
    const response = {
      data: null,
      status: error.response?.status || 500,
      message: this.getErrorMessage(error)
    };
    
    console.error('API Error:', response);
    
    throw response;
  }

  // Obtener mensaje de error adecuado
  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      // Intenta extraer el mensaje de error de la respuesta
      const responseData = error.response.data as any;
      if (responseData.detail) return responseData.detail;
      if (responseData.message) return responseData.message;
      if (typeof responseData === 'string') return responseData;
    }
    
    // Mensajes por código de estado
    switch (error.response?.status) {
      case 400:
        return 'Solicitud incorrecta';
      case 401:
        return 'No autorizado';
      case 403:
        return 'Acceso prohibido';
      case 404:
        return 'Recurso no encontrado';
      case 422:
        return 'Datos de entrada inválidos';
      case 500:
        return 'Error interno del servidor';
      default:
        return error.message || 'Error desconocido';
    }
  }

  // Método para subir archivos (para imágenes, documentos, etc.)
  async uploadFile<T = any>(
    url: string, 
    file: File, 
    onProgress?: (percentage: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await this.api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }
}

// Exportar una instancia única del servicio
export const apiService = new ApiService();

// Exportar también la clase para casos donde se necesite extender o crear instancias personalizadas
export default ApiService;