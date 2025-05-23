import "dotenv/config";
import { CommandKit } from "commandkit";
import { Client, GatewayIntentBits, MessageFlags } from "discord.js";
import Database from "./utils/database";

const client = new Client({
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

new CommandKit({
  client,
  bulkRegister: true,
  commandsPath: `${__dirname}/commands`,
  eventsPath: `${__dirname}/events`,
});

(async () => {
  const db = new Database({ uri: process.env.MONGODB_URI! });
  await db.connect().then(() => {
    client.login(process.env.BOT_TOKEN);
  });
})();
