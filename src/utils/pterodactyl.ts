import axios from "axios";
import dotenv from "dotenv";
import https from "https";
import { errorHandler } from "./error-handler";
import cache from "./cache";
import { FatalError } from "./errors/FatalError";

dotenv.config();

interface PterodactylStats {
  userCount: number;
  serverCount: number;
}

export async function fetchPterodactylStats(): Promise<PterodactylStats> {
  try {
    const cacheKey = "pterodactyl_stats";
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData as PterodactylStats;

    const API_KEY = process.env.PTERODACTYL_API_KEY;
    const API_URL =
      process.env.PTERODACTYL_API_URL || "https://netherpanel.com";

    if (!API_KEY) {
      console.error("PTERODACTYL_API_KEY not found in environment variables");
      errorHandler.execute(
        new Error("PTERODACTYL_API_KEY not found in environment variables")
      );
      throw new FatalError(
        "PTERODACTYL_API_KEY not found in environment variables"
      );
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const [userResponse, serverResponse] = await Promise.all([
      axios.get(`${API_URL}/api/application/users`, { headers, httpsAgent }),
      axios.get(`${API_URL}/api/application/servers`, { headers, httpsAgent }),
    ]);

    const userCount = userResponse.data.meta.pagination.total;
    const serverCount = serverResponse.data.meta.pagination.total;

    const stats: PterodactylStats = { userCount, serverCount };
    cache.set(cacheKey, stats, 300_000); // 5m

    return stats;
  } catch (error: any) {
    console.error(
      "[PTERODACTYL] Error fetching Pterodactyl stats:",
      error.message
    );
    errorHandler.execute(error);
    return { userCount: 0, serverCount: 0 };
  }
}

export async function initPterodactylStatsFetching(): Promise<void> {
  const updateStats = async () => {
    await fetchPterodactylStats()
      .then((stats) => {
        cache.set("user_count", stats.userCount);
        cache.set("server_count", stats.serverCount);
        console.log(
          `[PTERODACTYL] Updated stats: ${stats.userCount} users, ${stats.serverCount} total servers`
        );
      })
      .catch((err) => {
        console.error("[PTERODACTYL] Failed to update stats:", err);
      });
  };

  await updateStats();
  setInterval(updateStats, 300_000); //5m
}
