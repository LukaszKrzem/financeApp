import { createContext, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({
  children,
  token,
  user,
  apiUrl,
  onLogout,
  onLogin,
  handleGoogleLogin,
  googleClientId,
}) {
  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        apiUrl,
        onLogout,
        onLogin,
        handleGoogleLogin,
        googleClientId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
