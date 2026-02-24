import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const loginWithKakao = async () => {
  const kakaoJsKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const redirectUri = `${window.location.origin}/auth/kakao/callback`;
  window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoJsKey}&redirect_uri=${redirectUri}&response_type=code&scope=profile`;
};

export const loginWithStrava = async () => {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/strava/callback`;
  window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read,activity:read_all&approval_prompt=auto`;
};

export const loginWithNaver = async () => {
  const naverClientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/naver/callback`;
  const state = Math.random().toString(36).substring(2);
  sessionStorage.setItem('naver_oauth_state', state);
  window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverClientId}&redirect_uri=${redirectUri}&state=${state}`;
};

export const updateUserProfile = async (displayName) => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName });
  }
};

export const logout = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);