import React, { createContext, useState, useContext } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  const login = async (username, password) => {
    const user = await AuthService.login(username, password);
    setCurrentUser(user);
    return user;
  };
  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };
  const isAuthenticated = () = > currentUser !== null;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
