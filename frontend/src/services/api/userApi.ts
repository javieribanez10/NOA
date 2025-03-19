// services/api/userApi.ts
import { apiService } from './api';

// Interfaces para los datos de usuario
export interface UserLoginParams {
  username: string;
  password: string;
}

export interface UserRegistrationParams {
  email: string;
  fullName: string;
  country?: string;
  division?: string;
  company?: string;
  phone?: string;
}

// Interfaz que coincide con la respuesta de la API
export interface UserDataAPI {
  id: string;
  email: string;
  full_name: string;
  license_type: string;
  phone?: string;
  company_name?: string;
  country?: string;
  division?: string;
  is_active: boolean;
  api_key?: string;
  created_at: string;
  updated_at: string;
}

// Interfaz para usar con el contexto (campos obligatorios)
export interface UserData {
  id: string;
  email: string;
  fullName: string;
  licenseType: string;
  phone: string;
  company: string;
  country: string;
  division: string;
  isActive: boolean;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at?: string;
}

class UserApiService {
  // Método para iniciar sesión
  async login(params: UserLoginParams) {
    // Para el login, necesitamos usar formato form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', params.username);
    formData.append('password', params.password);
    
    return apiService.post<LoginResponse>('/users/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // Método para registrar un nuevo usuario
  async register(params: UserRegistrationParams) {
    return apiService.post('/users/register', params);
  }

  // Método para obtener los datos del usuario actual
  async getCurrentUser() {
    const response = await apiService.get<UserDataAPI>('/users/me');
    
    // Transformar la respuesta de la API al formato que espera nuestro contexto
    const userData: UserData = {
      id: response.data.id,
      email: response.data.email,
      fullName: response.data.full_name,
      licenseType: response.data.license_type,
      phone: response.data.phone || '',
      company: response.data.company_name || '',
      country: response.data.country || '',
      division: response.data.division || '',
      isActive: response.data.is_active,
      apiKey: response.data.api_key || '',
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return {
      ...response,
      data: userData
    };
  }

  // Método para actualizar el perfil del usuario
  async updateProfile(userData: Partial<UserData>) {
    // Convierte de nuestro formato al formato de la API
    const apiData = {
      email: userData.email,
      full_name: userData.fullName,
      phone: userData.phone,
      company_name: userData.company,
      country: userData.country,
      division: userData.division,
    };
    
    const response = await apiService.put<UserDataAPI>('/users/profile', apiData);
    
    // Convierte la respuesta de nuevo a nuestro formato
    const updatedUserData: UserData = {
      id: response.data.id,
      email: response.data.email,
      fullName: response.data.full_name,
      licenseType: response.data.license_type,
      phone: response.data.phone || '',
      company: response.data.company_name || '',
      country: response.data.country || '',
      division: response.data.division || '',
      isActive: response.data.is_active,
      apiKey: response.data.api_key || '',
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at
    };
    
    return {
      ...response,
      data: updatedUserData
    };
  }

  // Método para verificar la validez del token
  async validateSession() {
    return apiService.get('/users/validate-session');
  }

  // Método para cerrar sesión
  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    
    // Opcionalmente, también puedes notificar al backend
    try {
      await apiService.post('/users/logout');
    } catch (error) {
      // Incluso si falla, continuamos con el logout local
      console.warn('Error durante el logout en el servidor:', error);
    }
    
    // Redirigir al login
    window.location.href = '/login';
  }

  // Método para solicitar reinicio de contraseña
  async requestPasswordReset(email: string) {
    return apiService.post('/users/password-reset-request', { email });
  }

  // Método para reiniciar contraseña
  async resetPassword(token: string, newPassword: string) {
    return apiService.post('/users/password-reset', {
      token,
      new_password: newPassword
    });
  }
}

export const userApiService = new UserApiService();
export default UserApiService;