import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserDoc } from '../services/firestore.service';
import {
  login,
  register,
  loginWithGoogle,
  loginWithGithub,
  logout,
} from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          const doc = await getUserDoc(firebaseUser.uid);
          setUser(firebaseUser);
          setRole(doc?.role ?? 'USER');
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      },
      () => setLoading(false) // error handler — don't hang on bad config
    );
    return unsubscribe;
  }, []);

  const value = {
    user,
    role,
    loading,
    isAdmin: () => role === 'ADMIN',
    isUser: () => role === 'USER',
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
