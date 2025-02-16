from mongoengine import Document, StringField, FloatField, DateTimeField
from datetime import datetime

class Report(Document):
    report_type = StringField(required=True)
    latitude = FloatField(required=True)
    longitude = FloatField(required=True)
    email = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'reports'}
