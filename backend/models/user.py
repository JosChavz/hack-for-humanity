from mongoengine import Document, StringField, EmailField, IntField, FloatField, EmbeddedDocumentListField, EmbeddedDocument, ReferenceField, ListField

class User(Document):
   name = StringField(required=True, max_length=100)
   email = EmailField(required=True, unique=True)
   google_id = StringField(required=False)  # Make it optional
   profilePicture = StringField(required=False)
   contributionNumber = IntField(required=True)
   favoriteSpecies = ListField(StringField(), default=list)  # List of species names

   
   meta = {'collection': 'users'}