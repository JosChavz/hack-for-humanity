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

# Import built-in json as stdjson to avoid conflicts with flask.json
import json as stdjson

load_dotenv()
app = Flask(__name__)
CORS(app)

app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))  # Configure Gemini API key ONCE
model = genai.GenerativeModel("gemini-1.5-flash")


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

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        data = request.get_json()
        base64_image = data.get("image")

        if not base64_image:
            return jsonify({"error": "No image received"}), 400

        # Decode the base64 string and open the image
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))

        # Define the prompt for Gemini
        prompt = """
        Analyze this image and provide a detailed response in JSON format with the following fields:
        1. 'type': must be one of 'animal', 'bird', 'insect', or 'plant'
        2. 'species': the specific species name
        3. 'description': a brief description of what you see in the image and interesting facts about the species
        
        Example response: 
        {
            "type": "bird",
            "species": "Bald Eagle",
            "description": "A majestic Bald Eagle perched on a tree branch. This species is known for its distinctive white head and is the national bird of the United States."
        }
        """

        # Call the Gemini API to analyze the image
        response = model.generate_content([prompt, image])
        
        # Log the raw response for debugging purposes
        app.logger.debug("Gemini API raw response text: %s", response.text)

        # Check if the response is empty or only whitespace
        raw_text = response.text.strip()
        if not raw_text:
            raise ValueError("Empty response received from Gemini API")
        
        # If the response isn't pure JSON, try to extract the JSON object substring
        if not (raw_text.startswith("{") and raw_text.endswith("}")):
            first_brace = raw_text.find("{")
            last_brace = raw_text.rfind("}")
            if first_brace != -1 and last_brace != -1:
                raw_text = raw_text[first_brace:last_brace+1]

        # Attempt to parse the response as JSON using the standard library's json module
        try:
            response_data = stdjson.loads(raw_text)
        except stdjson.JSONDecodeError as parse_err:
            app.logger.error("Failed to parse JSON. Raw response text: %s", raw_text)
            raise ValueError("Failed to parse response JSON from Gemini API") from parse_err

        return jsonify({
            "analysis": response_data,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/submit-sighting', methods=['POST'])
def submit_sighting():
    try:
        data = request.get_json()
        
        # Get the Base64 encoded image string from the request
        base64_img = data.get('image')
        if not base64_img:
            return jsonify({"error": "No image provided"}), 400

        # Upload the image to imgbb
        imgbb_key = os.getenv("IMGBB_KEY")
        imgbb_url = "https://api.imgbb.com/1/upload"
        payload = {
            "key": imgbb_key,
            "image": base64_img
        }
        imgbb_response = requests.post(imgbb_url, data=payload)
        imgbb_json = imgbb_response.json()

        # Check if the image hosting was successful
        if not (imgbb_response.ok and imgbb_json.get("success")):
            error_message = imgbb_json.get("error", {}).get("message", "Unknown error")
            raise Exception("Image upload error: " + error_message)

        # Extract the URL from the response
        image_url = imgbb_json["data"]["url"]

        # Create and save the Sighting document using the image URL
        new_sighting = Sighting(
            latitude=str(data['latitude']),
            longitude=str(data['longitude']),
            image=image_url,
            type=data['type'],
            species=data['species'],
            description=data['description'],
            email=data['email']
        )
        new_sighting.save()
        return jsonify({"message": "Sighting saved successfully"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
