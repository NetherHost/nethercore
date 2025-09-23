import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import Database from "./app/utils/database";
import { errorHandler } from "./app/utils/error-handler";

const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessagePolls,
  ],
  allowedMentions: {
    parse: [],
    roles: [],
    repliedUser: true,
  },
});

// process.on("unhandledRejection", (error: Error) => {
//   errorHandler.execute(error);
//   process.exit(1);
// });

// process.on("uncaughtException", (error: Error) => {
//   errorHandler.execute(error);
//   process.exit(1);
// });

// client.on("error", (error: Error) => {
//   errorHandler.execute(error);
// });

(async () => {
  const db = new Database({ uri: process.env.MONGODB_URI! });

  try {
    console.log("Connecting to MongoDB...");
    await db.connect();
    console.log("MongoDB connection established successfully");
  } catch (error) {
    console.error("Startup sequence failed:", error);
    process.exit(1);
  }
})();

export default client;
