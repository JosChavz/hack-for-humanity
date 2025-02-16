import base64
import certifi
from flask import Flask, json, jsonify, request
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
from models.user import User
from google.oauth2 import id_token
import requests  # Use the requests library for HTTP requests
import datetime
from models.sighting import Sighting

load_dotenv()
app = Flask(__name__)
CORS(app)

app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))  # Configure Gemini API key ONCE
model = genai.GenerativeModel("gemini-2.0-flash")


@app.route('/auth/google', methods=['POST'])
def google_auth():
    try:
        token = request.json.get('token')
        print("Received token:", token)  # Debug log
        
        if not token:
            return jsonify({"error": "No token provided"}), 400

        # Use the requests library to make the HTTP request
        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        print("Google API response status:", userinfo_response.status_code)  # Debug log
        print("Google API response:", userinfo_response.text)  # Debug log
        
        if not userinfo_response.ok:
            return jsonify({
                "error": "Failed to get user info",
                "details": userinfo_response.text
            }), 400

        userinfo = userinfo_response.json()
        print("User info from Google:", userinfo)  # Debug log
        
        try:
            user = User.objects(email=userinfo['email']).first()
            if not user:
                user = User(
                    email=userinfo['email'],
                    name=userinfo['name'],
                    google_id=userinfo['sub'],
                    contributionNumber=0  # Add default value
                )
                user.save()
                print("Created new user:", user.to_json())  # Debug log
            else:
                print("Found existing user:", user.to_json())  # Debug log

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
            print("Database error:", str(e))  # Debug log
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    except Exception as e:
        print("Authentication error:", str(e))  # Debug log
        return jsonify({"error": str(e)}), 500

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        data = request.get_json()
        base64_image = data.get("image")
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        email = data.get("email")

        if not base64_image:
            return jsonify({"error": "No image received"}), 400

        # Decode base64 string received from the frontend
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))

        # Updated prompt for structured response
        prompt = (
            "Analyze this image and determine if it contains an animal, bird, or plant. "
            "Respond with a valid JSON object containing two fields: "
            "'type' (must be one of 'animal', 'bird', or 'plant') and 'species' (the species name). "
            "If no recognizable species is found, return 'Unknown' for both fields. "
            "Example response: {\"type\": \"bird\", \"species\": \"Bald Eagle\"}."
        )

        response = model.generate_content([prompt, image])
        
        # Extract structured data from the response
        try:
            response_data = json.loads(response.text)
            sighting_type = response_data.get("type", "Unknown")
            species = response_data.get("species", "Unknown")
        except Exception:
            return jsonify({"error": "Failed to parse AI response"}), 500

        # Create a new Sighting document
        if species != 'Unknown' and type != 'Unknown':
            new_sighting = Sighting(
                latitude=str(latitude),
                longitude=str(longitude),
                image=base64_image,  # Storing the image as base64
                type=sighting_type,
                species=species,
                email=email
            )

            new_sighting.save()

        return jsonify({
            "species": species,
            "analysis": response_data,
        })

    except Exception as e:
        traceback.print_exc()  # Print the full traceback for debugging
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
