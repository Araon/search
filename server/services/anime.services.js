import Anime from "../models/anime.model.js";

class AnimeService {
  static async FindAnimeById(ids) {
    return Anime.find({
      _id: { $in: ids },
    }).select("id title synonyms picture");
  }

  static async FindOne() {
    return Anime.findOne().select("id title synonyms picture");
  }

  static async FuzzySearch(searchString) {
    try {
      const searchRegex = new RegExp(searchString, "i"); // 'i' to make it case insensitive
      const match = {
        $or: [
          { title: { $regex: searchRegex } },
          { plot: { $regex: searchRegex } },
        ],
      };
      const results = await Anime.find(match).select(
        "id title synonyms picture"
      );

      return results;
    } catch (error) {
      console.error("Error searching for given string", error);
      throw error;
    }
  }
}

export default AnimeService;
