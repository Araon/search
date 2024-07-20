import pymongo
import requests
import os
import json


def connect_to_mongo(uri, db_name, collection_name, retries=3):
    client = pymongo.MongoClient(uri)
    db = client[db_name]
    collection = db[collection_name]
    for attempt in range(retries):
        try:
            client.server_info()
            print("Connected to the database")
            return collection
        except pymongo.errors.ServerSelectionTimeoutError:
            print(f"Connection failed (attempt {attempt + 1}/"
                  f"{retries}), retrying...")
    else:
        print("Connection failed after all retries, exiting...")
        exit(1)


def fetch_data(url):
    response = requests.get(url)
    response.raise_for_status()  # Will raise an HTTPError for bad responses
    data = response.json()
    return data


def save_data_to_file(data, filename):
    with open(filename, "w") as file:
        json.dump(data, file)
    print(f"Data saved to {filename}")


def insert_data_into_collection(data, collection):
    if "data" in data:
        collection.insert_many(data["data"])
        print(f"Inserted {len(data['data'])} documents into the collection")
    else:
        print("No data found in the JSON file")


def main():
    MONGO_DB_URI = os.getenv("MONGO_DB_URI")
    if not MONGO_DB_URI:
        print("Environment variable MONGO_DB_URI not set, exiting...")
        exit(1)

    collection = connect_to_mongo(MONGO_DB_URI, "anime_db", "anime_collection")

    url = ("https://github.com/manami-project/anime-offline-database/raw/"
           "master/anime-offline-database.json")
    data = fetch_data(url)
    print('Got data from the URL with', len(data), 'keys')

    # save_data_to_file(data, "data.json")
    insert_data_into_collection(data, collection)

    total_docs = collection.count_documents({})
    print(f"Total documents in collection: {total_docs}")


if __name__ == "__main__":
    main()
