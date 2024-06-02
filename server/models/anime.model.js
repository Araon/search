import mongoose, { Schema } from "mongoose";

const animeSchema = new Schema(
  {
    title: { type: String, required: true },
    episodes: { type: Number },
    status: { type: String },
    animeSeason: {
      season: { type: String },
      year: { type: Number },
    },
    picture: { type: String },
    thumbnail: { type: String },
    synonyms: { type: [String] },
    relatedAnime: { type: [String] },
    tags: { type: [String] },
    sources: { type: [String] },
    type: { type: String },
  },
  { collection: "anime_collection" }
);

const Anime = mongoose.model("anime_collection", animeSchema);

animeSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

export default Anime;
