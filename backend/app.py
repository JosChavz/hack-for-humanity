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
from math import radians, sin, cos, sqrt, atan2
from sentence_transformers import SentenceTransformer
import numpy as np

# Import built-in json as stdjson to avoid conflicts with flask.json
import json as stdjson

load_dotenv()
app = Flask(__name__)
CORS(app)

app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))  # Configure Gemini API key ONCE
model = genai.GenerativeModel("gemini-2.0-flash")

# Initialize the model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize models
model = SentenceTransformer('all-MiniLM-L6-v2')
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
gemini_model = genai.GenerativeModel('gemini-2.0-flash')

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
        base64_img = data.get('image')
        
        # Generate content analysis using Gemini
        response = gemini_model.generate_content([
            "Analyze this wildlife image and provide: \n1. Type (animal/bird/insect/plant)\n2. Species name\n3. Brief description",
            base64_img
        ])
        
        # Parse Gemini response
        analysis = response.text.split('\n')
        type_match = next((line for line in analysis if 'Type:' in line), '')
        species_match = next((line for line in analysis if 'Species:' in line), '')
        description = '\n'.join(analysis[analysis.index(next(line for line in analysis if 'Description:' in line)):])
        
        # Generate embedding for the description
        embedding = model.encode(description).tolist()
        
        return jsonify({
            'analysis': {
                'type': type_match.split(':')[1].strip().lower(),
                'species': species_match.split(':')[1].strip(),
                'description': description.replace('Description:', '').strip(),
                'embedding': embedding
            }
        })
    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

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

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in kilometers

    lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return distance

@app.route('/get-species-by-type', methods=['POST'])
def get_species_by_type():
    try:
        data = request.get_json()
        species_type = data.get('type')
        
        if not all(key in data for key in ['type', 'latitude', 'longitude']):
            return jsonify({'error': 'Missing required fields'}), 400
            
        try:
            user_lat = float(data.get('latitude'))
            user_lon = float(data.get('longitude'))
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid coordinates format'}), 400

        sightings = Sighting.objects(type=species_type)
        print("sightings", sightings)
        species_data = {}

        for sighting in sightings:
            
            if not sighting.latitude or not sighting.longitude:
                continue
                
            try:
                distance = calculate_distance(
                    user_lat, 
                    user_lon, 
                    float(sighting.latitude), 
                    float(sighting.longitude)
                )
                
                if distance <= 3.21869:
                    if sighting.species not in species_data:
                        species_data[sighting.species] = {
                            'image': sighting.image,
                            'location': f"{sighting.latitude}, {sighting.longitude}",
                            'latest_time': sighting.created_at,
                            'frequency': 1
                        }
                    else:
                        species_data[sighting.species]['frequency'] += 1
                        if sighting.created_at > species_data[sighting.species]['latest_time']:
                            species_data[sighting.species]['latest_time'] = sighting.created_at
            except ValueError:
                continue

        # Format the response
        response_data = []
        for species, data in species_data.items():
            response_data.append({
                'id': str(len(response_data) + 1),
                'species': species,
                'image': data['image'],
                'location': data['location'],
                'latest_time': data['latest_time'].strftime('%Y-%m-%d %H:%M:%S'),
                'frequency': data['frequency']
            })
        
        return jsonify({'species': response_data})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/vector-search', methods=['POST'])
def vector_search():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # Generate embedding for the search query
        query_embedding = model.encode(query).tolist()
        
        # Perform vector search
        pipeline = [
            {
                "$vectorSearch": {
                    "queryVector": query_embedding,
                    "path": "embedding",
                    "numCandidates": 100,
                    "limit": 10,
                    "index": "vector_index",
                }
            },
            {
                "$project": {
                    "species": 1,
                    "type": 1,
                    "image": 1,
                    "description": 1,
                    "latitude": 1,
                    "longitude": 1,
                    "created_at": 1,
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ]
        
        results = list(Sighting.objects().aggregate(pipeline))
        
        return jsonify({
            "species": [{
                "id": str(result["_id"]),
                "species": result["species"],
                "image": result["image"],
                "location": f"{result['latitude']}, {result['longitude']}",
                "latest_time": result["created_at"].strftime('%Y-%m-%d %H:%M:%S'),
                "description": result["description"],
                "score": result["score"]
            } for result in results]
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
