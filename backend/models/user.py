from mongoengine import Document, StringField, EmailField, IntField, FloatField, EmbeddedDocumentListField, EmbeddedDocument, ReferenceField

class User(Document):
   name = StringField(required=True, max_length=50)
   email = EmailField(required=True, unique=True)
   
   meta = {'collection': 'users'}
