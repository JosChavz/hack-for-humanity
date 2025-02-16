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
from models.report import Report
from models.user import User
from mongoengine import connect
import certifi
import jwt
from models.user import User
from google.oauth2 import id_token
import requests  
import datetime
from models.sighting import Sighting
from math import radians, sin, cos, sqrt, atan2
import numpy as np
from openai import OpenAI
from bson import json_util
import json

import json as stdjson

load_dotenv()
app = Flask(__name__)
CORS(app)

app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

genai.configure(api_key=os.getenv("GEMINI_API_KEY")) 
model = genai.GenerativeModel("gemini-1.5-pro")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.route('/auth/google', methods=['POST'])
def google_auth():
    try:
        token = request.json.get('token')
        print("Received token:", token)  # Debug lol
        
        if not token:
            return jsonify({"error": "No token provided"}), 400

        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        print("Google API response status:", userinfo_response.status_code)  # Debug lol
        print("Google API response:", userinfo_response.text)  # Debug lollll
        
        if not userinfo_response.ok:
            return jsonify({
                "error": "Failed to get user info",
                "details": userinfo_response.text
            }), 400

        userinfo = userinfo_response.json()
        print("User info from Google:", userinfo) 
        
        try:
            user = User.objects(email=userinfo['email']).first()
            if not user:
                user = User(
                    email=userinfo['email'],
                    name=userinfo['name'],
                    google_id=userinfo['sub'],
                    profilePicture=userinfo['picture'].encode('utf-8').decode('unicode_escape'),
                    contributionNumber=0,  
                    favoriteSpecies=[]
                )
                user.save()
                print("Created new user:", user.to_json())  
            else:
                print("Found existing user:", user.to_json()) 

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
                    'name': user.name,
                    'profilePicture': user.profilePicture,
                    'contributionNumber': user.contributionNumber,
                    'favoriteSpecies': user.favoriteSpecies,
                }
            })

        except Exception as e:
            print("Database error:", str(e)) 
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    except Exception as e:
        print("Authentication error:", str(e)) 
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        data = request.get_json()
        base64_image = data.get("image")

        if not base64_image:
            return jsonify({"error": "No image received"}), 400

        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))

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

        response = model.generate_content([prompt, image])
        
        app.logger.debug("Gemini API raw response text: %s", response.text)

        raw_text = response.text.strip()
        if not raw_text:
            raise ValueError("Empty response received from Gemini API")
        
        if not (raw_text.startswith("{") and raw_text.endswith("}")):
            first_brace = raw_text.find("{")
            last_brace = raw_text.rfind("}")
            if first_brace != -1 and last_brace != -1:
                raw_text = raw_text[first_brace:last_brace+1]

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
        
        base64_img = data.get('image')
        if not base64_img:
            return jsonify({"error": "No image provided"}), 400

        imgbb_key = os.getenv("IMGBB_KEY")
        imgbb_url = "https://api.imgbb.com/1/upload"
        payload = {
            "key": imgbb_key,
            "image": base64_img
        }
        imgbb_response = requests.post(imgbb_url, data=payload)
        imgbb_json = imgbb_response.json()

        if not (imgbb_response.ok and imgbb_json.get("success")):
            error_message = imgbb_json.get("error", {}).get("message", "Unknown error")
            raise Exception("Image upload error: " + error_message)

        image_url = imgbb_json["data"]["url"]

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
    R = 6371  # Earth's radius in kilometers, cuz we like km

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
        print(
            'crashing out!!'
        )
        print("sightings", sightings[0]['id'])
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
                            'frequency': 1,
                            'id': str(sighting.id),
                            'description': sighting.description,
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
                # 'id': str(len(response_data) + 1),
                'species': species,
                'image': data['image'],
                'location': data['location'],
                'latest_time': data['latest_time'].strftime('%Y-%m-%d %H:%M:%S'),
                'frequency': data['frequency'],
                'id': str(data['id']),
                'description': data['description'],
            })
        
        return jsonify({'species': response_data})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get-sightings', methods=['GET'])
def get_sightings():
    try:
        sightings = Sighting.objects()
        sightings_list = [
            {
                "id": str(sighting.id),
                "latitude": sighting.latitude,
                "longitude": sighting.longitude,
                "image": sighting.image,  
                "type": sighting.type,
                "species": sighting.species,
                "description": sighting.description,
                "created_at": sighting.created_at,
                "email": sighting.email
            }
            for sighting in sightings
        ]
        print(sightings_list)
        return jsonify({"sightings": sightings_list}), 200 
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/vector-search', methods=['POST'])
def vector_search():
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({"error": "No query provided"}), 400

        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = response.data[0].embedding

        pipeline = [
            {
                "$search": {
                    "index": "default",
                    "knnBeta": {
                        "vector": query_embedding,
                        "path": "embedding",
                        "k": 10
                    }
                }
            },
            {
                "$project": {
                    "_id": { "$toString": "$_id" },
                    "species": 1,
                    "type": 1,
                    "image": 1,
                    "description": 1,
                    "location_name": 1,
                    "created_at": 1,
                    "score": { "$meta": "searchScore" }
                }
            }
        ]

        results = list(Sighting.objects().aggregate(pipeline))
        print(f"Found {len(results)} results")
        
        serialized_results = json.loads(json_util.dumps(results))
        return jsonify({"results": serialized_results})

    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({"error": str(e)}), 500

from flask import request, jsonify
import traceback

@app.route('/submit-report', methods=['POST'])
def submit_report():
    try:
        data = request.json
        report_type = data.get('report_type')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        email = data.get('email')

        if not all([report_type, latitude, longitude, email]):
            return jsonify({"error": "Missing required fields"}), 400

        new_report = Report(
            report_type=report_type,
            latitude=latitude,
            longitude=longitude,
            email=email
        )
        new_report.save()

        return jsonify({"message": "Report submitted successfully"}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
