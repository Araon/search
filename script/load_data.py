import pymongo
import requests
import time

time.sleep(5)

client = pymongo.MongoClient("mongo:27017")
db = client["anime_db"]
collection = db["anime_collection"]

url = "https://github.com/manami-project/anime-offline-database/raw/" \
    "master/anime-offline-database.json"

response = requests.get(url)
data = response.json()

if "data" in data:
    collection.insert_many(data["data"])
    print(f"Inserted {len(data['data'])} documents into the collection")
else:
    print("No data found in the JSON file")

print(f"Total documents in collection: {collection.count_documents({})}")
