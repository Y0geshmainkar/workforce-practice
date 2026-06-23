import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';
import { createUserDoc } from './firestore.service';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export async function register(name, email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await createUserDoc(user, { name, provider: 'local' });
  return user;
}

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);
  await createUserDoc(user, { name: user.displayName, provider: 'google' });
  return user;
}

export async function loginWithGithub() {
  const { user } = await signInWithPopup(auth, githubProvider);
  await createUserDoc(user, { name: user.displayName, provider: 'github' });
  return user;
}

export async function logout() {
  await signOut(auth);
}
