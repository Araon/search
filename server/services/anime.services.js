import Anime from "../models/anime.model.js";
import Chroma from "../utils/chroma.js";

class AnimeService {
  static async FindAnimeById(ids) {
    return Anime.find({
      _id: { $in: ids },
    }).select("id title synonyms picture");
  }

  static async FindOne() {
    return Anime.findOne();
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
  static async SemanticSearch(searchString) {
    const results = await Chroma.query({ q: searchString, n: 10 });
    if (
      results?.ids?.length &&
      results?.ids[0].length &&
      results?.distances?.length
    ) {
      const ids = results.ids[0];
      const animes = await this.FindAnimeById(ids);
      const distances = results.distances[0];
      // maintain the order of IDs, this is important, also send the score too
      const reorderedNotes = ids.map((id, idx) => {

        const anime = animes.find((n) => n.id === id);

        const response = {
          title: anime?.title,
          poster: anime?.poster,
          id: anime?._id?.toString(),
          distance: distances[idx],
          similarity: 1 / (1 + distances[idx]), // Ref - https://stats.stackexchange.com/questions/53068/euclidean-distance-score-and-similarity
        };

        return response
      }).filter((n) => n.title);
      return reorderedNotes;
    }
    return [];
  }

  static async FeedAnimeToVectorStore() {
    const BATCH_SIZE = 1;
    let skip = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const animeList = await Anime.find({
          episodes: { $exists: true, $gte: 1 },
        })
          .skip(skip)
          .limit(BATCH_SIZE)
          .select("title synonyms relatedAnime tags type");

        if (animeList.length === 0) {
          hasMore = false;
          break;
        }

        const data = animeList.map((anime) => {
          const text = `${anime.title || ""}. Episodes - ${
            anime.episodes || "N/A"
          }. Status - ${anime.status || "N/A"}. Season - ${
            anime.animeSeason.season || "N/A"
          } ${anime.animeSeason.year || "N/A"}. Tags - ${(
            anime.tags || []
          ).join(", ")}.`;
          const id = anime._id.toString();
          return { text, id };
        });
        const s = performance.now();
        await Chroma.bulkUpsert(data);
        const e = performance.now();
        console.log(
          "Done inserting - ",
          skip + BATCH_SIZE,
          `Took - ${e - s}ms`
        );
        skip += BATCH_SIZE;
      }
    } catch (error) {
      console.error("Error feeding anime to vector store:", error);
      throw error;
    }
  }
}

export default AnimeService;
