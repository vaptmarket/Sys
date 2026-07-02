import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'cliente' | 'empresa' | 'user';
  pixKey?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('vapt_auth_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Check if user has explicit role setup in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          let role: 'admin' | 'cliente' | 'empresa' | 'user' = 'cliente';
          const email = firebaseUser.email || '';

          // Determine initial default role
          if (email.toLowerCase().includes('admin') || email === 'joao@exemplo.com' || email === 'aplicativo.vaptmarket@gmail.com') {
            role = 'admin';
          }

          let pixKey = '';
          let phone = '';
          let cep = '';
          let street = '';
          let number = '';
          let complement = '';
          let neighborhood = '';
          let city = '';
          let state = '';
          if (userSnap.exists()) {
            role = userSnap.data().role || role;
            pixKey = userSnap.data().pixKey || '';
            phone = userSnap.data().phone || '';
            cep = userSnap.data().cep || '';
            street = userSnap.data().street || '';
            number = userSnap.data().number || '';
            complement = userSnap.data().complement || '';
            neighborhood = userSnap.data().neighborhood || '';
            city = userSnap.data().city || '';
            state = userSnap.data().state || '';
          } else {
            // First time social login or email registration missing firestore doc
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: email,
              displayName: firebaseUser.displayName || 'Usuário Vapt',
              role: role,
              createdAt: Date.now()
            }, { merge: true });
          }

          const sessionUser: User = {
            uid: firebaseUser.uid,
            email: email,
            displayName: firebaseUser.displayName || 'Usuário Vapt',
            role: role,
            pixKey: pixKey,
            phone: phone,
            cep: cep,
            street: street,
            number: number,
            complement: complement,
            neighborhood: neighborhood,
            city: city,
            state: state
          };

          setUser(sessionUser);
          localStorage.setItem('vapt_auth_session', JSON.stringify(sessionUser));
        } else {
          // Try to fallback to any existing localStorage session or null
          const savedUser = localStorage.getItem('vapt_auth_session');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error synchronizing authenticated user State with Firestore:', error);
        // Resilient fallback to local state if offline or Firestore query fails
        const savedUser = localStorage.getItem('vapt_auth_session');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Social Login with Google Auth via Firebase
  const login = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const email = firebaseUser.email || '';
      let role: 'admin' | 'cliente' | 'empresa' | 'user' = 'cliente';
      if (email.toLowerCase().includes('admin') || email === 'joao@exemplo.com' || email === 'aplicativo.vaptmarket@gmail.com') {
        role = 'admin';
      }

      // Check or create Firestore document
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);
      let pixKey = '';
      let phone = '';
      let cep = '';
      let street = '';
      let number = '';
      let complement = '';
      let neighborhood = '';
      let city = '';
      let state = '';
      if (userSnap.exists()) {
        role = userSnap.data().role || role;
        pixKey = userSnap.data().pixKey || '';
        phone = userSnap.data().phone || '';
        cep = userSnap.data().cep || '';
        street = userSnap.data().street || '';
        number = userSnap.data().number || '';
        complement = userSnap.data().complement || '';
        neighborhood = userSnap.data().neighborhood || '';
        city = userSnap.data().city || '';
        state = userSnap.data().state || '';
      } else {
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: email,
          displayName: firebaseUser.displayName || 'Usuário Vapt',
          role: role,
          createdAt: Date.now()
        });
      }

      const sessionUser: User = {
        uid: firebaseUser.uid,
        email: email,
        displayName: firebaseUser.displayName || 'Usuário Vapt',
        role: role,
        pixKey: pixKey,
        phone: phone,
        cep: cep,
        street: street,
        number: number,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        state: state
      };

      setUser(sessionUser);
      localStorage.setItem('vapt_auth_session', JSON.stringify(sessionUser));
      window.dispatchEvent(new Event('vapt_auth_update'));
      return sessionUser;
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<User> => {
    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password || '123';

    try {
      const result = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      let role: 'admin' | 'cliente' | 'empresa' | 'user' = 'cliente';
      let pixKey = '';
      let phone = '';
      let cep = '';
      let street = '';
      let number = '';
      let complement = '';
      let neighborhood = '';
      let city = '';
      let state = '';
      if (targetEmail.includes('admin') || targetEmail === 'joao@exemplo.com' || targetEmail === 'aplicativo.vaptmarket@gmail.com') {
        role = 'admin';
      }

      if (userSnap.exists()) {
        role = userSnap.data().role || role;
        pixKey = userSnap.data().pixKey || '';
        phone = userSnap.data().phone || '';
        cep = userSnap.data().cep || '';
        street = userSnap.data().street || '';
        number = userSnap.data().number || '';
        complement = userSnap.data().complement || '';
        neighborhood = userSnap.data().neighborhood || '';
        city = userSnap.data().city || '';
        state = userSnap.data().state || '';
      }

      const sessionUser: User = {
        uid: firebaseUser.uid,
        email: targetEmail,
        displayName: firebaseUser.displayName || 'Usuário Vapt',
        role: role,
        pixKey: pixKey,
        phone: phone,
        cep: cep,
        street: street,
        number: number,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        state: state
      };

      setUser(sessionUser);
      localStorage.setItem('vapt_auth_session', JSON.stringify(sessionUser));
      window.dispatchEvent(new Event('vapt_auth_update'));
      return sessionUser;
    } catch (error: any) {
      console.error('Email Login Error:', error);
      // Fallback to local authentication for offline demo resilience
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials' || error.code === 'auth/network-request-failed') {
        // Fallback local file search
        const savedUsersStr = localStorage.getItem('vapt_registered_users');
        const registeredUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];
        const matchedUser = registeredUsers.find((u: any) => u.email === targetEmail);
        
        if (matchedUser && matchedUser.password === targetPassword) {
          const localUser: User = {
            uid: matchedUser.uid,
            email: matchedUser.email,
            displayName: matchedUser.displayName,
            role: matchedUser.role || 'user'
          };
          setUser(localUser);
          localStorage.setItem('vapt_auth_session', JSON.stringify(localUser));
          window.dispatchEvent(new Event('vapt_auth_update'));
          return localUser;
        }
      }
      throw new Error(error.message || 'Falha ao autenticar.');
    }
  };

  const registerWithEmail = async (name: string, email: string, password?: string, chosenRole: 'cliente' | 'empresa' = 'cliente'): Promise<User> => {
    const targetEmail = email.trim().toLowerCase();
    const targetName = name.trim();
    const targetPassword = password || '123';

    if (!targetName) throw new Error('O nome é obrigatório.');
    if (!targetEmail) throw new Error('O e-mail é obrigatório.');

    try {
      const result = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
      const firebaseUser = result.user;

      // Update auth profile display name
      await firebaseUpdateProfile(firebaseUser, {
        displayName: targetName
      });

      let role: 'admin' | 'cliente' | 'empresa' | 'user' = chosenRole;
      if (targetEmail.includes('admin') || targetEmail === 'joao@exemplo.com' || targetEmail === 'aplicativo.vaptmarket@gmail.com') {
        role = 'admin';
      }

      // Save to Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        email: targetEmail,
        displayName: targetName,
        role: role,
        createdAt: Date.now()
      });

      const sessionUser: User = {
        uid: firebaseUser.uid,
        email: targetEmail,
        displayName: targetName,
        role: role
      };

      setUser(sessionUser);
      localStorage.setItem('vapt_auth_session', JSON.stringify(sessionUser));
      
      // Sync local registry for backward compatibility with secondary views
      const savedUsersStr = localStorage.getItem('vapt_registered_users');
      const registeredUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];
      if (!registeredUsers.some((u: any) => u.uid === firebaseUser.uid)) {
        registeredUsers.push({
          uid: firebaseUser.uid,
          email: targetEmail,
          displayName: targetName,
          role: role,
          password: targetPassword
        });
        localStorage.setItem('vapt_registered_users', JSON.stringify(registeredUsers));
      }

      window.dispatchEvent(new Event('vapt_auth_update'));
      return sessionUser;
    } catch (error: any) {
      console.error('Email Registration Error:', error);
      throw new Error(error.message || 'Falha ao registrar conta.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
    setUser(null);
    localStorage.removeItem('vapt_auth_session');
    window.dispatchEvent(new Event('vapt_auth_update'));
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && updates.displayName) {
        await firebaseUpdateProfile(currentUser, {
          displayName: updates.displayName
        });
      }

      if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('vapt_auth_session', JSON.stringify(updatedUser));

        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, updates);
        }

        // Also update local registered users registry fallback
        const savedUsersStr = localStorage.getItem('vapt_registered_users');
        if (savedUsersStr) {
          const registeredUsers = JSON.parse(savedUsersStr);
          const idx = registeredUsers.findIndex((u: any) => u.uid === user.uid);
          if (idx !== -1) {
            registeredUsers[idx] = { ...registeredUsers[idx], ...updates };
            localStorage.setItem('vapt_registered_users', JSON.stringify(registeredUsers));
          }
        }
        
        window.dispatchEvent(new Event('vapt_auth_update'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return { 
    user, 
    loading, 
    login, 
    loginWithEmail,
    registerWithEmail,
    logout, 
    updateProfile, 
    isAuthenticated: !!user 
  };
}

