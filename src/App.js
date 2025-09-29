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
  };

  const handleBaseQuestionsSection = () => {
    setActiveSection(activeSection === 'base' ? 'none' : 'base');
    setShowBaseQuestions(activeSection !== 'base');
    setShowForm(false);
  };

  const handleChatbotSection = () => {
    setActiveSection(activeSection === 'chatbot' ? 'none' : 'chatbot');
    setShowForm(false);
    setShowBaseQuestions(false);
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
        </div>
      </div>
    </div>
  );
}

export default App;