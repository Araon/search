import pymongo
import requests
import time

# Wait for MongoDB to start
time.sleep(10)

# MongoDB connection
client = pymongo.MongoClient("mongo:27017")
db = client["anime_db"]
collection = db["anime_collection"]

# URL of the JSON file
url = "https://github.com/manami-project/anime-offline-database/raw/" \
    "master/anime-offline-database.json"

# Fetching the JSON data from the URL
response = requests.get(url)
data = response.json()

# Insert data into MongoDB collection
if "data" in data:
    collection.insert_many(data["data"])
    print(f"Inserted {len(data['data'])} documents into the collection")
else:
    print("No data found in the JSON file")

# Verify insertion
print(f"Total documents in collection: {collection.count_documents({})}")
