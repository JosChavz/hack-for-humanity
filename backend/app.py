from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
import os
from dotenv import load_dotenv
from mongoengine import connect
import certifi

# load_dotenv()
app = Flask(__name__)
CORS(app)

# app.secret_key = os.getenv('SECRET_KEY')

# Initialize MongoEngine
# connect(host=os.getenv('DATABASE_URI'), ssl=True, tlscafile=certifi.where())

# Get information about a certain stock's price history
@app.route('/test-route', methods=['GET'])
def testRoute():
    print('hey this is a test')
    return jsonify({"message": "Test successful!"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9874, debug=True)
