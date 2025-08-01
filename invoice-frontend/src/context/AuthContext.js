import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const storedUserData = JSON.parse(localStorage.getItem('userData'));
    setIsAuthenticated(authStatus);
    setUserData(storedUserData);
    console.log('[AuthContext] Restored from localStorage:', { authStatus, storedUserData });
  }, []);

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated ? 'true' : 'false');
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }, [isAuthenticated, userData]);

  const login = (user) => {
    setIsAuthenticated(true);
    setUserData(user);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userData', JSON.stringify(user));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userData, login, logout, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);