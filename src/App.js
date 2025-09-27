import React, { useState, useEffect } from 'react';
import SaveJsonForm from './components/SaveJsonForm';
import Login from './components/Login';
import Chatbot from './components/Chatbot';
import { db, onAuthStateChange, logoutUser } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

function App() {
  // Estados de autenticación
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Estados existentes
  const [showForm, setShowForm] = useState(false);
  const [preguntasApi, setPreguntasApi] = useState([]);
  const [preguntasBase, setPreguntasBase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preguntasGemini, setPreguntasGemini] = useState([]);
  const [loadingGemini, setLoadingGemini] = useState(false);
  const [loadingFirebase, setLoadingFirebase] = useState(false);
  const [errorGemini, setErrorGemini] = useState(null);
  const [showBaseQuestions, setShowBaseQuestions] = useState(false);
  
  // Estado para controlar la sección activa del sidebar
  const [activeSection, setActiveSection] = useState('chat');

  // Efecto para manejar el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      console.log('Estado de autenticación cambiado:', user ? 'Usuario logueado' : 'Usuario no logueado');
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Efecto para cargar preguntas desde Firestore
  useEffect(() => {
    const cargarPreguntasFirestore = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "preguntas", "cuestionario");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPreguntasBase(data.preguntas || []);
        } else {
          setPreguntasBase([]);
        }
      } catch (e) {
        console.error("Error al cargar preguntas de Firestore:", e);
        setPreguntasBase([]);
      }
      setLoading(false);
    };
    cargarPreguntasFirestore();
  }, []);

  // Función para manejar el login
  const handleLogin = (user) => {
    console.log('handleLogin llamado con usuario:', user ? user.uid : 'null');
    if (user) {
      console.log('Estableciendo usuario en el estado...');
      setUser(user);
      setAuthLoading(false); // Asegurar que authLoading sea false
      console.log('Usuario establecido en App.js:', user.uid);
    } else {
      console.error('handleLogin recibió un usuario nulo');
    }
  };

  // Función para manejar el logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      // Resetear estados
      setActiveSection('none');
      setShowForm(false);
      setShowBaseQuestions(false);
      setPreguntasGemini([]);
      setErrorGemini(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Funciones para manejar las secciones
  const handleUploadSection = () => {
    setActiveSection(activeSection === 'upload' ? 'none' : 'upload');
    setShowForm(activeSection !== 'upload');
    setShowBaseQuestions(false);
    setPreguntasGemini([]);
    setErrorGemini(null);
  };

  const handleBaseQuestionsSection = () => {
    setActiveSection(activeSection === 'base' ? 'none' : 'base');
    setShowBaseQuestions(activeSection !== 'base');
    setShowForm(false);
    setPreguntasGemini([]);
    setErrorGemini(null);
  };

  const handleGenerateSection = () => {
    setActiveSection('generate');
    setShowForm(false);
    setShowBaseQuestions(false);
    obtenerPreguntasDiversasGemini();
  };

  const handleLoadSection = () => {
    setActiveSection('load');
    setShowForm(false);
    setShowBaseQuestions(false);
    cargarPreguntasDesdeFirestore();
  };

  const handleChatbotSection = () => {
    setActiveSection(activeSection === 'chatbot' ? 'none' : 'chatbot');
    setShowForm(false);
    setShowBaseQuestions(false);
    setPreguntasGemini([]);
    setErrorGemini(null);
  };

  // Función para cargar preguntas generadas desde Firestore
  const cargarPreguntasDesdeFirestore = async () => {
    setLoadingFirebase(true);
    setPreguntasGemini([]);
    setErrorGemini(null);
    try {
      const res = await fetch('http://localhost:5000/api/get-generated-questions');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      if (data.success && data.preguntas) {
        setPreguntasGemini(data.preguntas);
      } else {
        setErrorGemini(data.message || 'No se encontraron preguntas generadas');
      }
    } catch (e) {
      console.error("Error al cargar preguntas desde Firestore:", e);
      setErrorGemini('Error al cargar preguntas desde Firestore. Asegúrate de que el backend esté corriendo.');
    } finally {
      setLoadingFirebase(false);
    }
  };
  //holamundp

  // Consumir preguntas diversas generadas por Gemini
  const obtenerPreguntasDiversasGemini = async () => {
    setLoadingGemini(true);
    setPreguntasGemini([]);
    setErrorGemini(null);
    try {
      const res = await fetch('http://localhost:5000/api/gemini-diverse-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      // Gemini responde en data.candidates[0].content.parts[0].text
      // El texto debería ser un JSON con las preguntas
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      try {
        // Intentar parsear el JSON de preguntas
        const preguntasArray = JSON.parse(texto);
        if (Array.isArray(preguntasArray)) {
          setPreguntasGemini(preguntasArray);
        } else {
          throw new Error('El formato de respuesta no es un array válido');
        }
      } catch (parseError) {
        console.error("Error al parsear JSON de preguntas:", parseError);
        // Si no se puede parsear como JSON, mostrar como texto plano
        const preguntas = texto.split(/\n\n|\n/).filter(Boolean);
        setPreguntasGemini(preguntas);
      }
    } catch (e) {
      console.error("Error al obtener preguntas diversas de Gemini:", e);
      setErrorGemini('Error al obtener preguntas diversas de Gemini. Asegúrate de que el backend esté corriendo.');
      setPreguntasGemini([]);
    }
    setLoadingGemini(false);
  };

  // Función para copiar preguntas al portapapeles
  const copiarPreguntas = () => {
    let texto = "🎯 PREGUNTAS GENERADAS POR IA\n";
    texto += "=" + "=".repeat(40) + "\n\n";
    
    preguntasGemini.forEach((pregunta, idx) => {
      texto += `${idx + 1}. `;
      
      if (typeof pregunta === 'object') {
        texto += `${pregunta.question}\n`;
        
        if (pregunta.options && pregunta.options.length > 0) {
          pregunta.options.forEach((opt, optIdx) => {
            texto += `   ${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
          });
        }
        
        if (pregunta.answer) {
          texto += `   ✅ Respuesta: ${pregunta.answer}\n`;
        }
      } else {
        texto += `${pregunta}\n`;
      }
      
      texto += "\n";
    });
    
    navigator.clipboard.writeText(texto).then(() => {
      alert('✅ Preguntas copiadas al portapapeles');
    }).catch(() => {
      alert('❌ Error al copiar las preguntas');
    });
  };

  return (
    <div className="App">
      {/* Sidebar izquierdo */}
      <div className="sidebar">
        <div className="sidebar-logo">
          B
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`sidebar-nav-item ${activeSection === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveSection('chat')}
            title="Chat"
          >
            💬
          </div>
          
          <div 
            className={`sidebar-nav-item ${activeSection === 'upload' ? 'active' : ''}`}
            onClick={handleUploadSection}
            title="Cargar Archivo"
          >
            📁
          </div>
          
          <div 
            className={`sidebar-nav-item ${activeSection === 'base' ? 'active' : ''}`}
            onClick={handleBaseQuestionsSection}
            title="Preguntas Base"
          >
            📋
          </div>
          
          <div 
            className={`sidebar-nav-item ${activeSection === 'generate' ? 'active' : ''}`}
            onClick={handleGenerateSection}
            title="Generar IA"
          >
            🤖
          </div>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className="sidebar-nav-item"
            onClick={handleLogout}
            title="Cerrar Sesión"
          >
            🚪
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="main-content">
        {/* Header superior */}
        <div className="main-header">
          <div className="header-search">
            <input 
              type="text" 
              placeholder="Buscar..." 
            />
          </div>
          
          <div className="header-actions">
            <div className="header-user">
              <div className="user-avatar">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">
                {user?.email?.split('@')[0] || 'Usuario'}
              </span>
            </div>
          </div>
        </div>

        {/* Área de contenido */}
        <div className="content-area">
          {activeSection === 'chat' && <Chatbot user={user} />}
          
          {activeSection === 'upload' && (
            <div className="tool-section">
              <h4>📤 Cargar Archivo JSON</h4>
              <SaveJsonForm />
            </div>
          )}

          {activeSection === 'base' && (
            <div className="tool-section">
              <h4>📚 Preguntas del Modelo Base</h4>
              {loading ? (
                <div className="loading-message-small">
                  <div style={{ fontSize: '1.5em', marginBottom: '10px' }}>🔄</div>
                  Cargando preguntas...
                </div>
              ) : (
                <div style={{ marginTop: '15px' }}>
                  {(preguntasApi.length > 0 ? preguntasApi : preguntasBase).length === 0 ? (
                    <div className="empty-state-small">
                      <div style={{ fontSize: '2em', marginBottom: '10px' }}>📝</div>
                      <p>No hay preguntas disponibles. Sube un archivo JSON.</p>
                    </div>
                  ) : (
                    <ul className="questions-list-small">
                      {(preguntasApi.length > 0 ? preguntasApi : preguntasBase).slice(0, 3).map((p, index) => (
                        <li key={p.id || index} className="question-item-small">
                          <strong>{p.question}</strong>
                          {p.answer && (
                            <em style={{ display: 'block', marginTop: '5px', fontSize: '0.9em' }}>
                              ✅ {p.answer}
                            </em>
                          )}
                        </li>
                      ))}
                      {(preguntasApi.length > 0 ? preguntasApi : preguntasBase).length > 3 && (
                        <li className="more-items">
                          ... y {(preguntasApi.length > 0 ? preguntasApi : preguntasBase).length - 3} más
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {(activeSection === 'generate' || activeSection === 'load') && (
            <div className="tool-section">
              <h4>🎯 Preguntas Generadas por IA</h4>
              {(loadingGemini && activeSection === 'generate') || (loadingFirebase && activeSection === 'load') ? (
                <div className="loading-message-small">
                  <div style={{ fontSize: '1.5em', marginBottom: '10px' }}>
                    {activeSection === 'generate' ? '🧠' : '📥'}
                  </div>
                  {activeSection === 'generate' ? 'Generando...' : 'Cargando...'}
                </div>
              ) : errorGemini ? (
                <div className="error-message-small">
                  <div style={{ fontSize: '1.2em', marginBottom: '8px' }}>⚠️</div>
                  {errorGemini}
                </div>
              ) : preguntasGemini.length > 0 ? (
                <div style={{ marginTop: '15px' }}>
                  <div className="generated-info">
                    <p>✨ {preguntasGemini.length} preguntas generadas</p>
                    <button 
                      onClick={copiarPreguntas}
                      className="copy-btn-small"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <ul className="questions-list-small">
                    {preguntasGemini.slice(0, 3).map((pregunta, idx) => (
                      <li key={idx} className="question-item-small">
                        {typeof pregunta === 'object' ? (
                          <>
                            <strong>{pregunta.question}</strong>
                            {pregunta.answer && (
                              <em style={{ display: 'block', marginTop: '5px', fontSize: '0.9em' }}>
                                ✅ {pregunta.answer}
                              </em>
                            )}
                          </>
                        ) : (
                          pregunta
                        )}
                      </li>
                    ))}
                    {preguntasGemini.length > 3 && (
                      <li className="more-items">
                        ... y {preguntasGemini.length - 3} más
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="empty-state-small">
                  <div style={{ fontSize: '2em', marginBottom: '10px' }}>🚀</div>
                  <p>Haz clic en "Generar IA" o "Cargar FB" para ver contenido</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;