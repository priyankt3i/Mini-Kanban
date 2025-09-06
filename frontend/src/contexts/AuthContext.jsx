import { createContext, useContext, useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token) {
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
        }
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/login', {
        username: username.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
      } else {
        localStorage.removeItem('user'); // make sure no invalid value stays
        setUser(null);
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      notifications.show({
        title: 'Success',
        message: 'Logged in successfully',
        color: 'green',
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);

      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Login failed',
        color: 'red',
      });

      return { success: false, error: error.response?.data?.error };
    }
  };


  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);

    notifications.show({
      title: 'Success',
      message: 'Logged out successfully',
      color: 'green',
    });
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};