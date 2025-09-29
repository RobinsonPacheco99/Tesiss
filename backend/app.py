from flask import Flask, request, jsonify
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
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Inicializar Firebase Admin SDK
firebase_admin_sdk_path = os.getenv('FIREBASE_ADMIN_SDK_PATH', 'tesiss-14581-firebase-adminsdk-fbsvc-5e8ddbe0b2.json')
cred = credentials.Certificate(firebase_admin_sdk_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

if __name__ == '__main__':
    app.run(port=5000, debug=True)
