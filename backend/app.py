import base64
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
import io
from PIL import Image
import traceback

load_dotenv()
app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))  # Configure Gemini API key ONCE
model = genai.GenerativeModel("gemini-2.0-flash")

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

        # Prepare image for Gemini (convert to bytes)
        # buffered = io.BytesIO()
        # image.save(buffered, format="JPEG")  # Save as JPEG in bytes
        # image_bytes = buffered.getvalue()

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