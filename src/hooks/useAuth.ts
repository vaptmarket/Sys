import { useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = () => {
      try {
        const savedUser = localStorage.getItem('vapt_auth_session');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to parse auth session:', error);
      }
    };

    // Simulating auth check
    const timer = setTimeout(() => {
      syncUser();
      setLoading(false);
    }, 500);

    window.addEventListener('vapt_auth_update', syncUser);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('vapt_auth_update', syncUser);
    };
  }, []);

  const login = () => {
    const mockUser: User = {
      uid: 'user123',
      email: 'joao@exemplo.com',
      displayName: 'João das Dores',
      role: 'admin' // Simulating admin for full access
    };
    setUser(mockUser);
    localStorage.setItem('vapt_auth_session', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('vapt_auth_update'));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vapt_auth_session');
    window.dispatchEvent(new Event('vapt_auth_update'));
  };

  const updateProfile = (updates: Partial<User>) => {
    try {
      const savedUser = localStorage.getItem('vapt_auth_session');
      if (savedUser) {
        const currentUser = JSON.parse(savedUser);
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('vapt_auth_session', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('vapt_auth_update'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return { user, loading, login, logout, updateProfile, isAuthenticated: !!user };
}
