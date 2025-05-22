import axios from "axios";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

interface LinkedUserResponse {
  success: boolean;
  linked: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  message?: string;
}

export async function checkUserLinked(
  discordId: string
): Promise<LinkedUserResponse> {
  try {
    const API_KEY = process.env.NETHER_API_KEY;

    if (!API_KEY) {
      console.error("NETHER_API_KEY not found in environment variables");
      return {
        success: false,
        linked: false,
        message: "API key not configured",
      };
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    try {
      const response = await axios.get(
        `https://nether.host/api/discord/linked?discord_id=${discordId}`,
        {
          headers: {
            "X-Api-Key": `${API_KEY}`,
          },
          httpsAgent,
        }
      );

      return response.data;
    } catch (error: any) {
      console.log("HTTPS request failed, trying HTTP instead:", error.message);

      const httpResponse = await axios.get(
        `http://nether.host/api/discord/linked?discord_id=${discordId}`,
        {
          headers: {
            "X-Api-Key": `${API_KEY}`,
          },
        }
      );
      return httpResponse.data;
    }
  } catch (error: any) {
    console.error("Error checking if user is linked:", error.message);

    if (error.response) {
      if (error.response.status === 401) {
        return {
          success: false,
          linked: false,
          message: "Unauthorized. Invalid API key.",
        };
      } else if (error.response.status === 400) {
        return {
          success: false,
          linked: false,
          message: "Discord ID is required.",
        };
      }
    }

    return {
      success: false,
      linked: false,
      message: `Error connecting to the API: ${error.message}`,
    };
  }
}
