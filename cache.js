import { langcache } from "./api.js";

export async function checkCache(topic) {
  try {
    const result = await langcache.search({
      prompt: topic,
      similarityThreshold: 0.85,
    });

    if (result?.data.length > 0) {
      console.log(`💾 Cache HIT — similarity: ${result.data[0].similarity}`);
      let parsed = JSON.parse(result.data[0].response);

      return parsed;
    }
    console.log("🔍 Cache MISS — running full research");
    return null;
  } catch (error) {
    console.error("Cache check failed:", err.message);
    return null;
  }
}
export async function saveToCache(topic, report) {
  try {
    await langcache.set({
      prompt: topic,
      response: JSON.stringify(report),
      ttl: 3600 * 24,
    });
    console.log("💾 Saved to cache");
  } catch (err) {
    console.error("Cache save failed:", err.message);
  }
}
