import { ChromaClient } from "chromadb";
import { CHROMA_ENV } from "../config.js";

// docs on port 8000 - http://localhost:8000/docs

class Chroma {
  static client = null;
  static colletion = null;

  static async initWRetry(retries = 5, delay = 10000) {
    const config = {
      auth: {
        provider: CHROMA_ENV.AUTH_PROVIDER,
        credential: CHROMA_ENV.CREDENTIALS,
      },
      path: CHROMA_ENV.URI,
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.client = new ChromaClient(config);
        this.collection = await this.client.getOrCreateCollection({
          name: "anime",
        });
        console.log("Connected to Chroma on attempt", attempt);
        break; // exit the loop if the conenction is successful
      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);
        if (attempt < retries) {
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error("All retry attempts failed.");
        }
      }
    }
  }

  static async getCollection() {
    return this.collection;
  }

  static async query({ q, n }) {
    try {
      const results = await this.collection.query({
        queryTexts: [q], // this is the query text for search
        nResults: n, // how many results to return
      });
      return results;
    } catch (e) {
      console.log(`ChromaDB ERR: Could not query: ${q}.`);
      console.log(e);
    }
  }

  static async singleAdd(entity) {
    try {
      await this.collection.add({
        documents: [entity.text],
        ids: [entity.id],
      });
    } catch (e) {
      console.log(
        `ChromaDB ERR: Could not perfrom singleADD for ID: ${entity.id}.`
      );
      console.log(e);
    }
  }
  static async singleUpsert(entity) {
    try {
      await this.collection.upsert({
        documents: [entity.text],
        ids: [entity.id],
      });
    } catch (e) {
      console.log(
        `ChromaDB ERR: Could not perform upsert for ID ${entity.id}.`
      );
      console.log(e);
    }
  }

  static async bulkAdd(entities = []) {
    try {
      const documents = [];
      const ids = [];

      for (const doc of entities) {
        documents.push(doc.text);
        ids.push(doc.id);
      }
      console.log(documents, ids);
      await this.collection.add({
        documents,
        ids,
      });
    } catch (e) {
      console.log(`ChromaDB ERR: Could not perform bulkAdd.`);
      console.log(e);
    }
  }

  static async bulkUpsert(entities) {
    try {
      const documents = [];
      const ids = [];

      for (const doc of entities) {
        documents.push(doc.text);
        ids.push(doc.id);
      }
      console.log(
        "Pushing - Entities -",
        entities.length,
        "Documents -",
        documents.length,
        "IDs -",
        ids.length
      );

      await this.collection.upsert({
        documents,
        ids,
      });
    } catch (e) {
      console.log(`ChromaDB ERR: Could not perform bulkUpsert.`);
      console.log(e);
    }
  }
}

export default Chroma;
