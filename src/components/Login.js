import React, { useState } from 'react';
import { loginUser, registerUser, resetPassword } from '../firebase';
import fondoImage from '../fondo.png';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones del lado del cliente
      if (!email.trim() || !password.trim()) {
        throw new Error('Todos los campos son obligatorios');
      }

      // Validación de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Por favor ingresa un email válido');
      }

      // Validaciones específicas para registro
      if (!isLogin) {
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }

        // Validación de fortaleza de contraseña
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
          throw new Error('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
        }
      }

      let user;
      if (isLogin) {
        console.log('Intentando iniciar sesión con:', email);
        user = await loginUser(email, password);
        console.log('Login exitoso:', user.uid);
      } else {
        console.log('Intentando registrar usuario con:', email);
        user = await registerUser(email, password);
        console.log('Registro exitoso:', user.uid);
      }
      
      // Llamar a la función onLogin pasada desde App.js
      console.log('Llamando a onLogin con usuario:', user.uid);
      onLogin(user);
    } catch (error) {
      console.error('Error de autenticación:', error);
      setError(error.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la recuperación de contraseña
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      // Validaciones del lado del cliente
      if (!resetEmail.trim()) {
        throw new Error('El email es requerido');
      }

      // Validación de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetEmail)) {
        throw new Error('Por favor ingresa un email válido');
      }

      const result = await resetPassword(resetEmail);
      setResetMessage(result.message);
      // Limpiar el formulario después de 3 segundos
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error al recuperar contraseña:', error);
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No existe una cuenta con este email';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este email';
      case 'auth/weak-password':
        return 'La contraseña es muy débil';
      case 'auth/invalid-email':
        return 'Email inválido';
      default:
        return errorCode;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 480px) {
            .login-container {
              padding: 15px !important;
              margin: 10px !important;
            }
            
            .login-form {
              padding: 30px 20px !important;
            }
            
            .login-header {
              height: 160px !important;
              background-size: 60% !important;
            }
            
            .login-title {
              font-size: 24px !important;
            }
            
            .login-subtitle {
              font-size: 14px !important;
            }
            
            .login-input {
              padding: 14px 16px !important;
              font-size: 16px !important;
            }
            
            .login-button {
              padding: 14px !important;
              font-size: 15px !important;
            }
          }
          
          @media (max-width: 360px) {
            .login-container {
              padding: 10px !important;
              margin: 5px !important;
            }
            
            .login-form {
              padding: 25px 15px !important;
            }
            
            .login-header {
              height: 140px !important;
              background-size: 50% !important;
            }
          }
        `}
      </style>
      {/* Formulario de Login Moderno y Minimalista */}
      {isLogin && (
        <div className="login-container" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {/* Header con logo */}
          <div className="login-header" style={{
            height: '30px',
            background: `url(${fondoImage})`,
            backgroundSize: '65%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center bottom',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'relative',
            borderRadius: '24px 24px 0 0',
            paddingBottom: '250px'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.03)',
              borderRadius: '24px 24px 0 0'
            }}></div>
          </div>

        {/* Contenido del formulario */}
        <div className="login-form" style={{ padding: '40px 30px 30px' }}>
          {/* Título de bienvenida */}
           <div style={{ textAlign: 'center', marginBottom: '32px' }}>
             <h2 className="login-title" style={{
               margin: '0 0 8px 0',
               fontSize: '28px',
               fontWeight: '700',
               color: '#1a202c',
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               backgroundClip: 'text'
             }}>
               ¡Bienvenido!
             </h2>
             <p className="login-subtitle" style={{
               margin: 0,
               color: '#718096',
               fontSize: '16px',
               fontWeight: '400'
             }}>
               Inicia sesión para continuar
             </p>
           </div>

          {/* Mostrar errores */}
          {error && (
            <div style={{
              background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
              color: '#c53030',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #fca5a5'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Campo de Email/Usuario */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Correo Electrónico
              </label>
              <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   placeholder="Correo"
                   className="login-input"
                   style={{
                     width: '100%',
                     padding: '16px 20px',
                     border: '2px solid #e2e8f0',
                     borderRadius: '12px',
                     fontSize: '16px',
                     transition: 'all 0.3s ease',
                     boxSizing: 'border-box',
                     background: '#f8fafc',
                     fontFamily: 'inherit',
                     outline: 'none'
                   }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Campo de Contraseña con mostrar/ocultar */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Contraseña
              </label>
              <input
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                     placeholder="••••••••"
                     className="login-input"
                     style={{
                       width: '100%',
                       padding: '16px 20px',
                       border: '2px solid #e2e8f0',
                       borderRadius: '12px',
                       fontSize: '16px',
                       boxSizing: 'border-box',
                       background: '#f8fafc',
                       fontFamily: 'inherit',
                       outline: 'none'
                     }}
                />
            </div>

            {/* Opción de recordar credenciales */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#667eea',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="rememberMe"
                style={{
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Recordar credenciales
              </label>
            </div>

            {/* Enlace para recuperar contraseña */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '20px' 
            }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                onMouseLeave={(e) => e.target.style.color = '#667eea'}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de Iniciar Sesión */}
            <button
                 type="submit"
                 disabled={loading}
                 className="login-button"
                 style={{
                   width: '100%',
                   padding: '16px',
                   background: loading 
                     ? '#a0aec0' 
                     : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                   color: 'white',
                   border: 'none',
                   borderRadius: '12px',
                   fontSize: '16px',
                   fontWeight: '600',
                   cursor: loading ? 'not-allowed' : 'pointer',
                   transition: 'all 0.3s ease',
                   boxShadow: loading 
                     ? 'none' 
                     : '0 4px 15px rgba(102, 126, 234, 0.4)',
                   position: 'relative',
                   overflow: 'hidden'
                 }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {loading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Enlace para registrarse */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{
              margin: 0,
              color: '#718096',
              fontSize: '14px'
            }}>
              ¿Aún no tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: '600'
                }}
              >
                Regístrate
              </button>
            </p>
          </div>
        </div>
        </div>
      )}

      {/* Formulario de Registro */}
      {!isLogin && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {/* Header con logo */}
          <div style={{
            height: '280px',
            background: `url(${fondoImage})`,
            backgroundSize: '70%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderRadius: '24px 24px 0 0'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.03)',
              borderRadius: '24px 24px 0 0'
            }}></div>
          </div>

          {/* Contenido del formulario */}
          <div style={{ padding: '40px 30px 30px' }}>
            {/* Título de bienvenida */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '700',
                color: '#1a202c',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ¡Crear Cuenta!
              </h2>
              <p style={{
                margin: 0,
                color: '#718096',
                fontSize: '16px',
                fontWeight: '400'
              }}>
                Regístrate para comenzar
              </p>
            </div>

            {/* Mostrar errores */}
            {error && (
              <div style={{
                background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
                color: '#c53030',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #fca5a5'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Campo de Email/Usuario */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu-email@universidad.edu"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Campo de Contraseña con mostrar/ocultar */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      background: '#f8fafc',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Campo de Confirmar Contraseña */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Botón de Registrarse */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading 
                    ? '#a0aec0' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading 
                    ? 'none' 
                    : '0 4px 15px rgba(102, 126, 234, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                  }
                }}
              >
                {loading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    Creando cuenta...
                  </div>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>

            {/* Enlace para iniciar sesión - Solo mostrar cuando estamos en modo registro */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <p style={{
                margin: 0,
                color: '#718096',
                fontSize: '14px'
              }}>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recuperación de contraseña */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            {/* Botón cerrar */}
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetError('');
                setResetMessage('');
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '5px'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h3 style={{
                margin: '0 0 10px 0',
                color: '#1e3c72',
                fontSize: '1.4em'
              }}>
                🔑 Recuperar Contraseña
              </h3>
              <p style={{
                margin: 0,
                color: '#666',
                fontSize: '0.9em',
                lineHeight: '1.4'
              }}>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontWeight: '500',
                  fontSize: '0.9em'
                }}>
                  📧 Correo Electrónico
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '10px',
                    fontSize: '16px',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2a5298'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  placeholder="tu-email@universidad.edu"
                />
              </div>

              {resetError && (
                <div style={{
                  background: '#fee',
                  color: '#c33',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.9em',
                  border: '1px solid #fcc'
                }}>
                  ⚠️ {resetError}
                </div>
              )}

              {resetMessage && (
                <div style={{
                  background: '#efe',
                  color: '#363',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.9em',
                  border: '1px solid #cfc'
                }}>
                  ✅ {resetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: resetLoading ? '#ccc' : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: resetLoading ? 'none' : '0 4px 15px rgba(30, 60, 114, 0.3)'
                }}
              >
                {resetLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Enviando...
                  </span>
                ) : (
                  '📧 Enviar Enlace de Recuperación'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;