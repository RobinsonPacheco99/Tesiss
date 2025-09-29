import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
//jjkgjhvchfgxchvjklñkjvhc
const Chatbot = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatState, setChatState] = useState('greeting'); // greeting, menu, requesting_questions, processing
  const [questionParams, setQuestionParams] = useState({
    quantity: null,
    category: null,
    difficulty: null
  });
  const [baseQuestions, setBaseQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Scroll automático al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar preguntas base al inicializar
  useEffect(() => {
    loadBaseQuestions();
  }, []);

  // Mensaje de bienvenida inicial
  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(
        `¡Hola ${user?.email || 'Usuario'}! 👋 Soy tu asistente conversacional.\n\n` +
        `Puedo ayudarte con:\n` +
        `• 📋 Consultar respuestas de la base de datos\n` +
        `• 🔢 Generar cantidad exacta de respuestas (ej: "20 respuestas", "35 respuestas")\n` +
        `• ❓ Responder dudas sobre el sistema\n\n` +
        `¿En qué puedo ayudarte hoy?`
      );
    }
  }, [user]);

  const loadBaseQuestions = async () => {
    try {
      const docRef = doc(db, "preguntas", "cuestionario");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const preguntas = docSnap.data().preguntas || [];
        setBaseQuestions(preguntas);
      }
    } catch (error) {
      console.error('Error cargando preguntas base:', error);
    }
  };

  const addBotMessage = (text, type = 'bot') => {
    const newMessage = {
      id: Date.now(),
      text,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (text) => {
    const newMessage = {
      id: Date.now(),
      text,
      type: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const getRandomQuestions = (questions, count) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const offerQuestionSuggestions = () => {
    if (baseQuestions.length === 0) {
      addBotMessage(
        `No hay preguntas disponibles en la base de datos. 😔\n\n` +
        `Puedes:\n` +
        `• Subir un archivo JSON con preguntas`
      );
      return;
    }

    // Obtener 6 respuestas aleatorias como sugerencias para mayor visualización
    const suggestions = getRandomQuestions(baseQuestions, 6);
    
    let suggestionMessage = `💡 **Aquí tienes algunas respuestas del modelo base:**\n\n`;
    
    suggestions.forEach((pregunta, index) => {
      if (pregunta.respuesta_correcta || pregunta.correct_answer) {
        suggestionMessage += `**${index + 1}.** ${pregunta.respuesta_correcta || pregunta.correct_answer}\n\n`;
      } else if (pregunta.pregunta || pregunta.question) {
        // Si no hay respuesta correcta, mostrar la pregunta
        suggestionMessage += `**${index + 1}.** ${pregunta.pregunta || pregunta.question}\n`;
        if (pregunta.opciones || pregunta.options) {
          const opciones = pregunta.opciones || pregunta.options;
          opciones.forEach((opcion, i) => {
            suggestionMessage += `   ${String.fromCharCode(65 + i)}. ${opcion}\n`;
          });
        }
        suggestionMessage += `\n`;
      } else {
        suggestionMessage += `**${index + 1}.** Respuesta no disponible\n\n`;
      }
    });

    suggestionMessage += `\n📝 **¿Qué te gustaría hacer?**\n\n`;
    suggestionMessage += `• Escribe un número (ej: "20", "35") para generar esa cantidad exacta de respuestas\n`;
    suggestionMessage += `• "Más respuestas" para ver otras sugerencias\n`;
    suggestionMessage += `• "Todas las respuestas" para ver la base completa\n`;

    addBotMessage(suggestionMessage);
  };

  const processUserInput = async (input) => {
    const lowerInput = input.toLowerCase().trim();
    
    // Detectar números para generar cantidad específica
    const numberMatch = input.match(/^\d+$/);
    if (numberMatch) {
      const quantity = parseInt(numberMatch[0]);
      if (quantity > 0 && quantity <= 1000) {
        await generateSpecificQuantity(quantity);
        return;
      } else {
        addBotMessage(`El número debe estar entre 1 y 1000. Has ingresado: ${quantity}`);
        return;
      }
    }

    // Detectar patrones como "20 preguntas", "35 preguntas"
    const quantityMatch = input.match(/(\d+)\s*pregunta/i);
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1]);
      if (quantity > 0 && quantity <= 1000) {
        await generateSpecificQuantity(quantity);
        return;
      }
    }

    // Análisis de intención del usuario
    if (lowerInput.includes('pregunta') || lowerInput.includes('consulta') || lowerInput.includes('base de datos')) {
      setChatState('requesting_questions');
      addBotMessage(
        `Perfecto, puedo ayudarte con las respuestas de la base de datos. 📋\n\n` +
        `Por favor, especifica:\n` +
        `• **Cantidad**: ¿Cuántas respuestas necesitas? (ej: "5", "20", "todas")\n` +
        `• **Dificultad** (opcional): fácil, medio, difícil\n\n` +
        `Ejemplo: "Necesito 10 respuestas de dificultad media"`
      );
      return;
    }

    if (lowerInput.includes('más preguntas') || lowerInput.includes('otras preguntas') || lowerInput.includes('sugerencias')) {
      offerQuestionSuggestions();
      return;
    }



    if (lowerInput.includes('ayuda') || lowerInput.includes('qué puedes hacer') || lowerInput.includes('opciones')) {
      showHelpMenu();
      return;
    }

    // Si estamos en estado de solicitud de preguntas
    if (chatState === 'requesting_questions') {
      await handleQuestionRequest(input);
      return;
    }

    // Respuestas conversacionales generales
    if (lowerInput.includes('hola') || lowerInput.includes('buenos días') || lowerInput.includes('buenas tardes')) {
      addBotMessage(`¡Hola! 😊 ¿En qué puedo ayudarte hoy?`);
      return;
    }

    if (lowerInput.includes('gracias')) {
      addBotMessage(`¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?`);
      return;
    }

    // Si no se especifica tema, responder de manera directa
    if (lowerInput.length > 0) {
      addBotMessage(
        `No estoy seguro de cómo ayudarte con "${input}". 🤔\n\n` +
        `Por favor, intenta ser más específico con tu consulta.`
      );
    }
  };

  const generateSpecificQuantity = async (quantity) => {
    setIsLoading(true);
    addBotMessage(`Generando ${quantity} respuestas para ti... 🎯`);

    try {
      if (baseQuestions.length === 0) {
        addBotMessage(`❌ No hay preguntas disponibles en la base de datos.`);
        return;
      }

      let selectedQuestions;
      if (quantity >= baseQuestions.length) {
        selectedQuestions = baseQuestions.slice(0, baseQuestions.length);
        addBotMessage(`📝 Aquí tienes ${selectedQuestions.length} respuestas (todas las disponibles):`);
      } else {
        selectedQuestions = getRandomQuestions(baseQuestions, quantity);
        addBotMessage(`📝 Aquí tienes exactamente ${quantity} respuestas:`);
      }

      let resultMessage = `\n`;
      
      selectedQuestions.forEach((pregunta, index) => {
        if (pregunta.respuesta_correcta || pregunta.correct_answer) {
          resultMessage += `**${index + 1}.** ${pregunta.respuesta_correcta || pregunta.correct_answer}\n\n`;
        } else if (pregunta.pregunta || pregunta.question) {
          // Si no hay respuesta correcta, mostrar la pregunta completa
          resultMessage += `**${index + 1}.** ${pregunta.pregunta || pregunta.question}\n`;
          if (pregunta.opciones || pregunta.options) {
            const opciones = pregunta.opciones || pregunta.options;
            opciones.forEach((opcion, i) => {
              resultMessage += `   ${String.fromCharCode(65 + i)}. ${opcion}\n`;
            });
          }
          resultMessage += `\n`;
        } else {
          resultMessage += `**${index + 1}.** Respuesta no disponible\n\n`;
        }
      });

      addBotMessage(resultMessage);
      
      // Eliminado: ya no se ofrecen opciones adicionales automáticamente

    } catch (error) {
      console.error('Error generando respuestas:', error);
      addBotMessage("❌ Error al generar las respuestas. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };



  const handleQuestionRequest = async (input) => {
    setIsLoading(true);
    addBotMessage("Analizando tu solicitud... 🔍");

    try {
      // Extraer parámetros de la solicitud
      const params = extractQuestionParameters(input);
      setQuestionParams(params);

      if (params.quantity === null) {
        addBotMessage(
          `No pude identificar la cantidad de preguntas que necesitas. 😅\n\n` +
          `Por favor, especifica cuántas preguntas quieres:\n` +
          `• "5" o "5 preguntas"\n` +
          `• "20 preguntas de matemáticas"\n` +
          `• "Todas las preguntas"`
        );
        setIsLoading(false);
        return;
      }

      await fetchQuestionsFromFirebase(params);
      setChatState('menu');
      
    } catch (error) {
      console.error('Error procesando solicitud:', error);
      addBotMessage(`❌ Hubo un error procesando tu solicitud. Por favor, intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  const extractQuestionParameters = (input) => {
    const lowerInput = input.toLowerCase();
    const params = { quantity: null, category: null, difficulty: null };

    // Extraer cantidad
    const quantityMatch = lowerInput.match(/(\d+)\s*pregunta/);
    if (quantityMatch) {
      params.quantity = parseInt(quantityMatch[1]);
    } else if (lowerInput.includes('todas') || lowerInput.includes('todo')) {
      params.quantity = 'all';
    }

    // Extraer dificultad
    if (lowerInput.includes('fácil') || lowerInput.includes('facil')) {
      params.difficulty = 'fácil';
    } else if (lowerInput.includes('medio') || lowerInput.includes('intermedio')) {
      params.difficulty = 'medio';
    } else if (lowerInput.includes('difícil') || lowerInput.includes('dificil') || lowerInput.includes('avanzado')) {
      params.difficulty = 'difícil';
    }

    return params;
  };

  const fetchQuestionsFromFirebase = async (params) => {
    try {
      const docRef = doc(db, "preguntas", "cuestionario");
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        addBotMessage("❌ No se encontraron preguntas en la base de datos.");
        return;
      }

      let preguntas = docSnap.data().preguntas || [];
      
      // Filtrar por dificultad si se especificó
      if (params.difficulty) {
        preguntas = preguntas.filter(p => 
          p.dificultad?.toLowerCase() === params.difficulty.toLowerCase()
        );
      }

      // Limitar cantidad
      if (params.quantity !== 'all' && typeof params.quantity === 'number') {
        preguntas = preguntas.slice(0, params.quantity);
      }

      if (preguntas.length === 0) {
        addBotMessage(
          `❌ No se encontraron preguntas con los criterios especificados.\n\n` +
          `Criterios aplicados:\n` +
          `${params.quantity !== 'all' ? `• Cantidad: ${params.quantity}\n` : ''}` +
          `${params.difficulty ? `• Dificultad: ${params.difficulty}\n` : ''}`
        );
        return;
      }

      // Mostrar resultados
      let resultMessage = `✅ Encontré ${preguntas.length} respuesta${preguntas.length > 1 ? 's' : ''}:\n\n`;
      
      preguntas.forEach((pregunta, index) => {
        if (pregunta.respuesta_correcta || pregunta.correct_answer) {
          resultMessage += `**${index + 1}.** ${pregunta.respuesta_correcta || pregunta.correct_answer}\n`;
        } else if (pregunta.pregunta || pregunta.question) {
          // Si no hay respuesta correcta, mostrar la pregunta completa
          resultMessage += `**${index + 1}.** ${pregunta.pregunta || pregunta.question}\n`;
          if (pregunta.opciones || pregunta.options) {
            const opciones = pregunta.opciones || pregunta.options;
            opciones.forEach((opcion, i) => {
              resultMessage += `   ${String.fromCharCode(65 + i)}. ${opcion}\n`;
            });
          }
        } else {
          resultMessage += `**${index + 1}.** Respuesta no disponible\n`;
        }
      });

      addBotMessage(resultMessage);
      
      // Eliminado: ya no se ofrecen opciones adicionales automáticamente

    } catch (error) {
      console.error('Error obteniendo preguntas:', error);
      addBotMessage("❌ Error al consultar la base de datos. Por favor, intenta de nuevo.");
    }
  };

  const showHelpMenu = () => {
    addBotMessage(
      `🤖 **Menú de Ayuda**\n\n` +
      `**Comandos disponibles:**\n\n` +
      `🔢 **Generar cantidad específica:**\n` +
      `• Escribe solo un número: "20", "35", "50"\n` +
      `• Con texto: "20 respuestas", "35 respuestas"\n\n` +
      `📋 **Consultar respuestas:**\n` +
      `• "Mostrar respuestas"\n` +
      `• "Más respuestas" - Ver otras sugerencias\n` +
      `• "Todas las respuestas" - Ver base completa\n\n` +
      `❓ **Ayuda:**\n` +
      `• "Ayuda" - Mostrar este menú\n` +
      `• "¿Qué puedes hacer?" - Ver capacidades`
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userInput = inputMessage.trim();
    addUserMessage(userInput);
    setInputMessage('');
    setIsLoading(true);

    try {
      await processUserInput(userInput);
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      addBotMessage("❌ Hubo un error procesando tu mensaje. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>🤖 Asistente Conversacional</h3>
        <p>Conectado como: {user?.email}</p>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">
                {message.text.split('\n').map((line, index) => (
                  <div key={index}>
                    {line.includes('**') ? (
                      <span dangerouslySetInnerHTML={{
                        __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </div>
              <div className="message-time">{message.timestamp}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí... (Enter para enviar)"
            disabled={isLoading}
            rows="2"
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>


    </div>
  );
};

export default Chatbot;

  const handleQuestionRequest = async (input) => {
    setIsLoading(true);
    addBotMessage("Analizando tu solicitud... 🔍");

    try {
      // Extraer parámetros de la solicitud
      const params = extractQuestionParameters(input);
      setQuestionParams(params);

      if (params.quantity === null) {
        addBotMessage(
          `No pude identificar la cantidad de preguntas que necesitas. 😅\n\n` +
          `Por favor, especifica cuántas preguntas quieres:\n` +
          `• "5" o "5 preguntas"\n` +
          `• "20 preguntas de matemáticas"\n` +
          `• "Todas las preguntas"`
        );
        setIsLoading(false);
        return;
      }

      await fetchQuestionsFromFirebase(params);
      setChatState('menu');
      
    } catch (error) {
      console.error('Error procesando solicitud:', error);
      addBotMessage(`❌ Hubo un error procesando tu solicitud. Por favor, intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  const extractQuestionParameters = (input) => {
    const lowerInput = input.toLowerCase();
    const params = { quantity: null, category: null, difficulty: null };

    // Extraer cantidad
    const quantityMatch = lowerInput.match(/(\d+)\s*pregunta/);
    if (quantityMatch) {
      params.quantity = parseInt(quantityMatch[1]);
    } else if (lowerInput.includes('todas') || lowerInput.includes('todo')) {
      params.quantity = 'all';
    }

    // Extraer categoría (palabras clave comunes)
    const categories = ['matemáticas', 'ciencias', 'historia', 'geografía', 'literatura', 'física', 'química', 'biología'];
    for (const category of categories) {
      if (lowerInput.includes(category)) {
        params.category = category;
        break;
      }
    }

    // Extraer dificultad
    if (lowerInput.includes('fácil') || lowerInput.includes('facil')) {
      params.difficulty = 'fácil';
    } else if (lowerInput.includes('medio') || lowerInput.includes('intermedio')) {
      params.difficulty = 'medio';
    } else if (lowerInput.includes('difícil') || lowerInput.includes('dificil') || lowerInput.includes('avanzado')) {
      params.difficulty = 'difícil';
    }

    return params;
  };

  const fetchQuestionsFromFirebase = async (params) => {
    try {
      const docRef = doc(db, "preguntas", "cuestionario");
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        addBotMessage("❌ No se encontraron preguntas en la base de datos.");
        return;
      }

      let preguntas = docSnap.data().preguntas || [];
      
      // Filtrar por categoría si se especificó
      if (params.category) {
        preguntas = preguntas.filter(p => 
          p.categoria?.toLowerCase().includes(params.category) ||
          p.pregunta?.toLowerCase().includes(params.category)
        );
      }

      // Filtrar por dificultad si se especificó
      if (params.difficulty) {
        preguntas = preguntas.filter(p => 
          p.dificultad?.toLowerCase() === params.difficulty.toLowerCase()
        );
      }

      // Limitar cantidad
      if (params.quantity !== 'all' && typeof params.quantity === 'number') {
        preguntas = preguntas.slice(0, params.quantity);
      }

      if (preguntas.length === 0) {
        addBotMessage(
          `❌ No se encontraron preguntas con los criterios especificados.\n\n` +
          `Criterios aplicados:\n` +
          `${params.quantity !== 'all' ? `• Cantidad: ${params.quantity}\n` : ''}` +
          `${params.category ? `• Categoría: ${params.category}\n` : ''}` +
          `${params.difficulty ? `• Dificultad: ${params.difficulty}\n` : ''}`
        );
        return;
      }

      // Mostrar resultados
      let resultMessage = `✅ Encontré ${preguntas.length} pregunta${preguntas.length > 1 ? 's' : ''}:\n\n`;
      
      preguntas.forEach((pregunta, index) => {
        resultMessage += `**${index + 1}.** ${pregunta.pregunta || pregunta.question || 'Pregunta sin texto'}\n`;
        if (pregunta.opciones || pregunta.options) {
          const opciones = pregunta.opciones || pregunta.options;
          opciones.forEach((opcion, i) => {
            // Verificar si la opción ya tiene un literal (A., B., etc.)
            const hasLiteral = /^[A-D]\.?\s/.test(opcion);
            if (hasLiteral) {
              resultMessage += `   ${opcion}\n`;
            } else {
              resultMessage += `   ${String.fromCharCode(65 + i)}. ${opcion}\n`;
            }
          });
        }
        if (pregunta.respuesta_correcta || pregunta.correct_answer) {
          resultMessage += `   ✓ **Respuesta correcta:** ${pregunta.respuesta_correcta || pregunta.correct_answer}\n`;
        }
        resultMessage += '\n';
      });

      addBotMessage(resultMessage);
      
      // Eliminado: ya no se ofrecen opciones adicionales automáticamente

    } catch (error) {
      console.error('Error obteniendo preguntas:', error);
      addBotMessage("❌ Error al consultar la base de datos. Por favor, intenta de nuevo.");
    }
  };