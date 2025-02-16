from mongoengine import Document, StringField, EmailField, DateTimeField
import datetime

class Sighting(Document):
    latitude = StringField(required=True)
    longitude = StringField(required=True)
    image = StringField(required=True)  # Stores the URL from imgbb (or imgur)
    type = StringField(required=True, choices=['animal', 'bird', 'insect', 'plant'])
    species = StringField(required=True)
    description = StringField(required=True)
    email = EmailField(required=True)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    meta = {'collection': 'sightings'}
