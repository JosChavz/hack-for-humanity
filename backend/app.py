from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
import os
from dotenv import load_dotenv
from mongoengine import connect
import certifi
import google.generativeai as genai
import os
from dotenv import load_dotenv
import base64
import io
from PIL import Image


# load_dotenv()
app = Flask(__name__)
CORS(app)

# app.secret_key = os.getenv('SECRET_KEY')

# Initialize MongoEngine
# connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Get information about a certain stock's price history
@app.route('/test-route', methods=['GET'])
def testRoute():
    print('hey this is a test')
    return jsonify({"message": "Test successful!"}), 200


@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        data = request.get_json()
        base64_image = data.get("image")

        if not base64_image:
            return jsonify({"error": "No image received"}), 400

        # Decode base64 string
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))

        # Prepare prompt
        prompt = "Analyze this image and check if there are any animals. If so, identify the species."

        # Send image and prompt to Gemini API
        response = genai.generate_content(model="gemini-pro-vision", inputs=[{"image": image, "text": prompt}])
        
        return jsonify({"message": "Image processed successfully", "analysis": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
