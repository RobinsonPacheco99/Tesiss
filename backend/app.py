from flask import Flask, request, jsonify
import requests
from flask_cors import CORS, cross_origin
import firebase_admin
from firebase_admin import credentials, firestore
import logging
from datetime import datetime
import json
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gemini_logs.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Inicializa Firebase Admin SDK
# Inicializar Firebase Admin SDK
firebase_admin_sdk_path = os.getenv('FIREBASE_ADMIN_SDK_PATH', 'tesiss-14581-firebase-adminsdk-fbsvc-5e8ddbe0b2.json')
cred = credentials.Certificate(firebase_admin_sdk_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_API_URL = os.getenv('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent')

@app.route('/api/gemini-diverse-questions', methods=['POST', 'OPTIONS'])
@cross_origin()
def gemini_diverse_questions():
    timestamp = datetime.now().isoformat()
    logger.info(f"[{timestamp}] INICIO - Solicitud de preguntas diversas recibida")
    
    try:
        # Lee las preguntas del documento Firestore
        logger.info(f"[{timestamp}] FIRESTORE - Consultando documento 'preguntas/cuestionario'")
        doc_ref = db.collection('preguntas').document('cuestionario')
        doc = doc_ref.get()
        
        if not doc.exists:
            logger.error(f"[{timestamp}] ERROR - No se encontraron preguntas en Firestore")
            return jsonify({'error': 'No se encontraron preguntas en Firestore'}), 404
            
        preguntas = doc.to_dict().get('preguntas', [])
        logger.info(f"[{timestamp}] FIRESTORE - Preguntas obtenidas: {len(preguntas)} preguntas encontradas")
        
        # Clasificar preguntas por tipo para crear diversidad
        tipos_preguntas = {
            'sinonimos_antonimos': [],
            'series_logicas': [],
            'razonamiento_espacial': [],
            'matematicas': [],
            'probabilidad': [],
            'algebra': [],
            'geometria': [],
            'problemas_edad': []
        }
        
        # Clasificar preguntas existentes
        for pregunta in preguntas:
            question_text = pregunta.get('question', '').lower()
            if any(word in question_text for word in ['sinónimo', 'antónimo', 'significa', 'equivale']):
                tipos_preguntas['sinonimos_antonimos'].append(pregunta)
            elif any(word in question_text for word in ['serie', 'secuencia', 'continúa', 'sigue']):
                tipos_preguntas['series_logicas'].append(pregunta)
            elif any(word in question_text for word in ['cubo', 'figura', 'forma', 'espacial']):
                tipos_preguntas['razonamiento_espacial'].append(pregunta)
            elif any(word in question_text for word in ['probabilidad', 'posibilidad', 'azar']):
                tipos_preguntas['probabilidad'].append(pregunta)
            elif any(word in question_text for word in ['edad', 'años', 'mayor', 'menor']):
                tipos_preguntas['problemas_edad'].append(pregunta)
            elif any(word in question_text for word in ['perímetro', 'área', 'triángulo', 'círculo']):
                tipos_preguntas['geometria'].append(pregunta)
            elif any(word in question_text for word in ['ecuación', 'variable', 'x', 'y']):
                tipos_preguntas['algebra'].append(pregunta)
            else:
                tipos_preguntas['matematicas'].append(pregunta)
        
        # Seleccionar ejemplos representativos de cada tipo
        ejemplos_seleccionados = []
        for tipo, preguntas_tipo in tipos_preguntas.items():
            if preguntas_tipo:
                ejemplos_seleccionados.append(preguntas_tipo[0])
        
        # Limitar a 10 ejemplos máximo
        ejemplos_seleccionados = ejemplos_seleccionados[:10]
        
        # Crear el prompt para generar preguntas diversas
        ejemplos_texto = ""
        for i, pregunta in enumerate(ejemplos_seleccionados):
            ejemplos_texto += f"""
EJEMPLO {i+1}:
Pregunta: {pregunta['question']}
Opciones: {', '.join(pregunta['options'])}
Respuesta: {pregunta['answer']}"""
        
        prompt = f"""Basándote en los siguientes ejemplos de diferentes tipos de preguntas, genera exactamente 10 preguntas nuevas que cubran una amplia variedad de temas y tipos de razonamiento:

{ejemplos_texto}

INSTRUCCIONES:
- Genera 10 preguntas completamente nuevas y diversas
- Incluye diferentes tipos: razonamiento lógico, matemáticas aplicadas, comprensión lectora, razonamiento espacial, analogías
- Cada pregunta debe tener exactamente 4 opciones (A, B, C, D)
- Incluye la respuesta correcta para cada pregunta
- Mantén un nivel de dificultad intermedio-avanzado
- Asegúrate de que las preguntas sean coherentes y tengan lógica
- Crea preguntas originales, no copies los ejemplos

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
[{{"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A" o "B" o "C" o "D"}}]"""
        
        logger.info(f"[{timestamp}] PROMPT - Longitud del prompt: {len(prompt)} caracteres")
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        }
        
        # Usar la API key correcta para este endpoint
        GEMINI_API_KEY_DIVERSE = GEMINI_API_KEY
        
        logger.info(f"[{timestamp}] GEMINI_REQUEST - Enviando solicitud a Gemini API")
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY_DIVERSE}",
            json=payload
        )
        
        logger.info(f"[{timestamp}] GEMINI_RESPONSE - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            logger.info(f"[{timestamp}] GEMINI_RESPONSE - Respuesta exitosa recibida")
            
            # Extraer el contenido generado
            if 'candidates' in response_data and len(response_data['candidates']) > 0:
                candidate = response_data['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    generated_text = candidate['content']['parts'][0].get('text', '')
                    logger.info(f"[{timestamp}] GEMINI_CONTENT - Texto generado (longitud: {len(generated_text)})")
                    
                    # Intentar parsear el JSON generado
                    try:
                        # Limpiar el texto si tiene markdown
                        clean_text = generated_text.strip()
                        if clean_text.startswith('```json'):
                            clean_text = clean_text[7:]
                        if clean_text.endswith('```'):
                            clean_text = clean_text[:-3]
                        clean_text = clean_text.strip()
                        
                        preguntas_generadas = json.loads(clean_text)
                        logger.info(f"[{timestamp}] SUCCESS - {len(preguntas_generadas)} preguntas diversas generadas")
                        
                        # Guardar las preguntas generadas en Firestore
                        try:
                            # Crear un documento con timestamp único
                            doc_id = f"generated_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                            doc_ref = db.collection('preguntas_generadas').document(doc_id)
                            
                            doc_data = {
                                'preguntas': preguntas_generadas,
                                'timestamp': datetime.now(),
                                'tipo': 'diversas',
                                'cantidad': len(preguntas_generadas)
                            }
                            
                            doc_ref.set(doc_data)
                            logger.info(f"[{timestamp}] FIRESTORE_SAVE - Preguntas guardadas en Firestore con ID: {doc_id}")
                            
                        except Exception as firestore_error:
                            logger.error(f"[{timestamp}] FIRESTORE_ERROR - Error al guardar en Firestore: {str(firestore_error)}")
                            # Continuar aunque falle el guardado en Firestore
                        
                        # Devolver las preguntas en el formato esperado por la aplicación
                        return jsonify({
                            'candidates': [{
                                'content': {
                                    'parts': [{
                                        'text': json.dumps(preguntas_generadas, ensure_ascii=False, indent=2)
                                    }]
                                }
                            }],
                            'firestore_saved': True,
                            'document_id': doc_id if 'doc_id' in locals() else None
                        })
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"[{timestamp}] JSON_ERROR - Error al parsear JSON: {str(e)}")
                        # Devolver la respuesta original si no se puede parsear
                        return jsonify(response_data)
                else:
                    logger.warning(f"[{timestamp}] GEMINI_WARNING - Estructura de contenido inesperada")
            else:
                logger.warning(f"[{timestamp}] GEMINI_WARNING - No se encontraron candidatos en la respuesta")
                
            return jsonify(response_data)
        else:
            error_text = response.text
            logger.error(f"[{timestamp}] GEMINI_ERROR - Error en la API: {response.status_code}")
            logger.error(f"[{timestamp}] GEMINI_ERROR - Mensaje de error: {error_text}")
            return jsonify({'error': f'Error en la API de Gemini: {response.status_code}', 'details': error_text}), 500
            
    except Exception as e:
        logger.error(f"[{timestamp}] EXCEPTION - Error inesperado: {str(e)}")
        logger.error(f"[{timestamp}] EXCEPTION - Tipo: {type(e).__name__}")
        import traceback
        logger.error(f"[{timestamp}] EXCEPTION - Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Error interno del servidor', 'details': str(e)}), 500

@app.route('/api/gemini-question', methods=['POST', 'OPTIONS'])
@cross_origin()
def gemini_question():
    data = request.json
    image_base64 = data.get('image_base64')
    prompt = data.get('prompt', 'Genera una pregunta de razonamiento abstracto sobre esta imagen y opciones de respuesta.')

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inline_data": {
                        "mime_type": "image/png",
                        "data": image_base64
                    }}
                ]
            }
        ]
    }

    response = requests.post(
        f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
        json=payload
    )

    return jsonify(response.json())

# Nuevo endpoint para obtener preguntas generadas desde Firestore
@app.route('/api/get-generated-questions', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_generated_questions():
    """Obtiene las preguntas generadas más recientes desde Firestore"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        logger.info(f"[{timestamp}] GET_QUESTIONS - Obteniendo preguntas desde Firestore")
        
        # Obtener el documento más reciente de preguntas generadas
        docs = db.collection('preguntas_generadas').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
        
        for doc in docs:
            doc_data = doc.to_dict()
            logger.info(f"[{timestamp}] FIRESTORE_READ - Preguntas obtenidas: {doc_data.get('cantidad', 0)}")
            
            return jsonify({
                'success': True,
                'preguntas': doc_data.get('preguntas', []),
                'timestamp': doc_data.get('timestamp'),
                'tipo': doc_data.get('tipo'),
                'cantidad': doc_data.get('cantidad'),
                'document_id': doc.id
            })
        
        # Si no hay documentos
        logger.info(f"[{timestamp}] NO_DATA - No se encontraron preguntas generadas")
        return jsonify({
            'success': False,
            'message': 'No se encontraron preguntas generadas',
            'preguntas': []
        })
        
    except Exception as e:
        logger.error(f"[{timestamp}] ERROR - Error al obtener preguntas: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error al obtener preguntas desde Firestore',
            'details': str(e)
        }), 500

# Nuevo endpoint para obtener todas las preguntas generadas
@app.route('/api/get-all-generated-questions', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_all_generated_questions():
    """Obtiene todas las preguntas generadas desde Firestore"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        logger.info(f"[{timestamp}] GET_ALL_QUESTIONS - Obteniendo todas las preguntas desde Firestore")
        
        # Obtener todos los documentos de preguntas generadas ordenados por timestamp
        docs = db.collection('preguntas_generadas').order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
        
        all_questions = []
        for doc in docs:
            doc_data = doc.to_dict()
            all_questions.append({
                'id': doc.id,
                'preguntas': doc_data.get('preguntas', []),
                'timestamp': doc_data.get('timestamp'),
                'tipo': doc_data.get('tipo'),
                'cantidad': doc_data.get('cantidad')
            })
        
        logger.info(f"[{timestamp}] FIRESTORE_READ - {len(all_questions)} conjuntos de preguntas obtenidos")
        
        return jsonify({
            'success': True,
            'data': all_questions,
            'total_sets': len(all_questions)
        })
        
    except Exception as e:
        logger.error(f"[{timestamp}] ERROR - Error al obtener todas las preguntas: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error al obtener todas las preguntas desde Firestore',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
