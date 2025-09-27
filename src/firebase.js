
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Funciones de autenticación con validaciones mejoradas
export const registerUser = async (email, password) => {
  try {
    // Validaciones adicionales
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('El formato del email no es válido');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejo de errores específicos de Firebase
    let errorMessage = 'Error al crear la cuenta';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Ya existe una cuenta con este correo electrónico';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El correo electrónico no es válido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El registro con email/contraseña no está habilitado';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

export const loginUser = async (email, password) => {
  try {
    // Validaciones adicionales
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('El formato del email no es válido');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error en login:', error);
    
    // Manejo de errores específicos de Firebase
    let errorMessage = 'Error al iniciar sesión';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No existe una cuenta con este correo electrónico';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El correo electrónico no es válido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('Usuario desconectado exitosamente');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    
    let errorMessage = 'Error al cerrar sesión';
    
    switch (error.code) {
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

// Función para recuperación de contraseña
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin, // URL de retorno después del reset
      handleCodeInApp: false
    });
    return { success: true, message: 'Correo de recuperación enviado exitosamente' };
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    
    // Manejo de errores específicos
    let errorMessage = 'Error al enviar el correo de recuperación';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No existe una cuenta con este correo electrónico';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El correo electrónico no es válido';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        break;
      default:
        errorMessage = error.message || 'Error desconocido';
    }
    
    throw new Error(errorMessage);
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export async function guardarPreguntasEnFirestore(preguntasModelo) {
  try {
    // Validaciones
    if (!preguntasModelo || !Array.isArray(preguntasModelo) || preguntasModelo.length === 0) {
      throw new Error('Las preguntas del modelo son requeridas y deben ser un array no vacío');
    }
    
    // Verificar que el usuario esté autenticado
    if (!auth.currentUser) {
      throw new Error('Debes estar autenticado para guardar preguntas');
    }
    
    const nombreModelo = "cuestionario";
    const docRef = doc(db, "preguntas", nombreModelo);
    
    const datosAGuardar = {
      preguntas: preguntasModelo,
      creadoEn: new Date(),
      creadoPor: auth.currentUser.uid,
      emailUsuario: auth.currentUser.email,
      version: "1.0"
    };
    
    await setDoc(docRef, datosAGuardar);
    console.log("¡Documento escrito con éxito en Firestore!");
    
    return {
      success: true,
      message: "Preguntas guardadas exitosamente",
      documentId: nombreModelo
    };
    
  } catch (error) {
    console.error("Error al añadir el documento: ", error);
    
    let errorMessage = 'Error al guardar las preguntas en la base de datos';
    
    switch (error.code) {
      case 'firestore/permission-denied':
        errorMessage = 'No tienes permisos para guardar datos';
        break;
      case 'firestore/unavailable':
        errorMessage = 'La base de datos no está disponible. Intenta más tarde';
        break;
      case 'firestore/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        break;
      case 'firestore/quota-exceeded':
        errorMessage = 'Se ha excedido la cuota de la base de datos';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
}