import base64
import certifi
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
import io
from PIL import Image
import traceback
from models.user import User
from mongoengine import connect
import certifi
import jwt
import requests
from models.user import User
from google.oauth2 import id_token
import jwt
import datetime

load_dotenv()
app = Flask(__name__)
CORS(app)

app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))  # Configure Gemini API key ONCE
model = genai.GenerativeModel("gemini-2.0-flash")

@app.route('/test-route', methods=['GET'])
def testRoute():
    print('hey this is a test')
    return jsonify({"message": "Test successful!"}), 200

@app.route('/auth/google', methods=['POST'])
def google_auth():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({"error": "No token provided"}), 400

        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',  # Updated endpoint
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if not userinfo_response.ok:
            return jsonify({"error": "Failed to get user info"}), 400

        userinfo = userinfo_response.json()
        
        user = User.objects(email=userinfo['email']).first()
        print("here", user)
        if not user:
            user = User(
                email=userinfo['email'],
                name=userinfo['name'],
                google_id=userinfo['sub'] 
            )
            user.save()

        session_token = jwt.encode(
            {'user_id': str(user.id), 'email': user.email},
            app.secret_key,
            algorithm='HS256'
        )

        return jsonify({
            'sessionToken': session_token,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.name
            }
        })

    except Exception as e:
        print('Auth error:', str(e))
        return jsonify({"error": "Authentication failed"}), 500

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        data = request.get_json()
        base64_image = data.get("image")

        if not base64_image:
            return jsonify({"error": "No image received"}), 400

        # Decode base64 string received from the frontend
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))

        # Prepare Gemini API request (using correct function)
        prompt = "Analyze this image and check if there are any animals. If so, identify the species."
        response = model.generate_content(
            [prompt, image]
        )

        print(response.text)

        return jsonify({"message": "Image processed successfully", "analysis": response.text})

    except Exception as e:
        traceback.print_exc()  # Print the full traceback for debugging
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)

# @app.route('/auth/google', methods=['POST'])
# def google_auth():
#     token = request.json.get('token')
#     try:
#         # Verify Google token
#         idinfo = id_token.verify_oauth2_token(
#             token,
#             requests.Request(),
#             'YOUR_GOOGLE_CLIENT_ID'
#         )
#
#         # Create or update user in database
#         user = User.objects(email=idinfo['email']).first()
#         if not user:
#             user = User(
#                 email=idinfo['email'],
#                 name=idinfo['name']
#             ).save()
#
#         # Create session token
#         session_token = jwt.encode(
#             {
#                 'user_id': str(user.id),
#                 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
#             },
#             app.config['SECRET_KEY'],
#             algorithm='HS256'
#         )
#
#         return jsonify({
#             'sessionToken': session_token,
#             'user': {
#                 'id': str(user.id),
#                 'email': user.email,
#                 'name': user.name
#             }
#         })
#
#     except ValueError as e:
#         return jsonify({'error': 'Invalid token'}), 401
#
