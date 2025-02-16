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
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
import datetime
from models.sighting import Sighting

load_dotenv()
app = Flask(__name__)
CORS(app)

connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))  # Configure Gemini API key ONCE
model = genai.GenerativeModel("gemini-2.0-flash")

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

@app.route('/auth/google', methods=['POST'])
def google_auth():
    token = request.json.get('token')
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            'YOUR_GOOGLE_CLIENT_ID'
        )

        # Create or update user in database
        user = User.objects(email=idinfo['email']).first()
        if not user:
            user = User(
                email=idinfo['email'],
                name=idinfo['name']
            ).save()

        # Create session token
        session_token = jwt.encode(
            {
                'user_id': str(user.id),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
            },
            app.config['SECRET_KEY'],
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

    except ValueError as e:
        return jsonify({'error': 'Invalid token'}), 401
    


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
