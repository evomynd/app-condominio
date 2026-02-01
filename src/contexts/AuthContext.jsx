import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de segurança - mostra a página após 500ms mesmo sem resposta do Firebase
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 500);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeoutId);
      setUser(user);
      
      if (user) {
        // Buscar role do usuário no Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'porteiro');
          } else {
            setUserRole('porteiro');
          }
        } catch (error) {
          console.error('Erro ao buscar role do usuário:', error);
          setUserRole('porteiro');
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar se usuário está bloqueado
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists() && userDoc.data().blocked) {
        await firebaseSignOut(auth);
        return { success: false, error: 'Usuário bloqueado. Entre em contato com o administrador.' };
      }
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, displayName, role = 'porteiro') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Set user display name
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        name: displayName,
        role: role,
        blocked: false,
        createdAt: new Date()
      });

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userRole,
    currentUser: user,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
