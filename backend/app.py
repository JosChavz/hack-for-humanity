from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
import os
from dotenv import load_dotenv
from mongoengine import connect
import certifi
import jwt
import requests
from models.user import User

load_dotenv()
app = Flask(__name__)
CORS(app)

app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
