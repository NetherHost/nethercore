require("dotenv").config();
require("module-alias/register");

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");

const logger = require("@lib/Logger");
const Database = require("@utils/Database");
const shutdown = require("@utils/shutdown");
const setupCommands = require("./handlers/commandHandler");
const setupEvents = require("./handlers/eventHandler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();
client.commandsSinceLastStartup = new Collection();

setupEvents(client);
setupCommands(client);

client.login(process.env.BOT_TOKEN).catch((error) => {
  logger.error(`Failed to login: ${error}`);
  process.exit(1);
});

const database = new Database();
database.connect(process.env.MONGODB_URI, {});

process.on("SIGINT", () => shutdown(database, client));
process.on("SIGTERM", () => shutdown(database, client));

client.on("error", (error) => logger.error(error.message));
