from mongoengine import Document, StringField, EmailField, IntField, FloatField, EmbeddedDocumentListField, EmbeddedDocument, ReferenceField

class Sighting(Document):
   latitude = StringField(required=True)
   longitude = StringField(required=True)
   image = StringField(required=True)
   type = StringField(required=True)
   species = StringField(required=True)
   email = EmailField(required=True)
   
   meta = {'collection': 'sightings'}
