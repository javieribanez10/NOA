import React, { createContext, useContext, useState, useCallback } from 'react';

// Interfaz User con campos obligatorios
interface User {
  id: string;
  email: string;
  fullName: string;
  licenseType: string;
  phone: string;
  company: string;
  country: string;
  division: string;
  isActive: boolean;
  apiKey: string;  // Campo controlado por el sistema
  createdAt: string;
  updatedAt: string;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUserData: (data: User) => void;
  clearUserData: () => void;
  checkAuthStatus: () => Promise<boolean>;
  setError: (error: string | null) => void;
}

const MOCK_USER = {
  id: 'mock-user-id',
  email: 'demo@example.com',
  fullName: 'Usuario Demo',
  licenseType: 'BUILDER',
  phone: '+56 9 1234 5678',
  company: 'Empresa Demo',
  country: 'Chile',
  division: 'Marketing',
  isActive: true,
  apiKey: 'mock-api-key',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setUserData = useCallback((data: User) => {
    setUser(data);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  const clearUserData = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        clearUserData();
        return false;
      }

      // Mock validation for demo token
      if (token === 'demo-token') {
        setUserData(MOCK_USER);
        return true;
      }

      const response = await fetch('http://localhost:8000/api/v1/users/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || 'Error validando la sesión');
        clearUserData();
        return false;
      }

      if (!user) {
        const userResponse = await fetch('http://localhost:8000/api/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData({
            id: userData.id,
            email: userData.email,
            fullName: userData.full_name,
            licenseType: userData.license_type,
            phone: userData.phone || '',
            company: userData.company || '',
            country: userData.country || '',
            division: userData.division || '',
            isActive: userData.is_active,
            apiKey: userData.api_key || '',
            createdAt: userData.created_at,
            updatedAt: userData.updated_at
          });
        } else {
          const data = await userResponse.json();
          setError(data.detail || 'Error obteniendo datos del usuario');
          clearUserData();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setError('Error de conexión al servidor');
      clearUserData();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, clearUserData, setUserData]);

  return (
    <UserContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading,
      error,
      setUserData, 
      clearUserData,
      checkAuthStatus,
      setError
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};