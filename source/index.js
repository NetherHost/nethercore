// Copyright 2025 Nether Host

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection,
  WebhookClient,
  EmbedBuilder,
} = require("discord.js");
const { createBackup } = require("./backup.js");
const color = require("chalk");
const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const mongoose = require("mongoose");
const embed = require("./config/embed.config.js");
const eventsDir = path.join(__dirname, "/events");
const commandsDir = path.join(__dirname, "/commands");
const eventFolders = fs.readdirSync(eventsDir);
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf8")
);
const handleError = require("./utils/handle-error.js");
const start = Date.now();
const { token } = process.env;
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
  ],
  allowedMentions: {
    parse: [],
  },
});

// database connection
(async () => {
  console.log(
    color.green("[INFO] ") + color.white("Connecting to Database...")
  );

  try {
    await mongoose.connect(process.env.mongodb_uri);

    const time = Date.now() - start;

    console.log(
      color.green("[INFO] ") + color.white(`Connected to Database in ${time}ms`)
    );
  } catch (error) {
    // kill process if database connection fails

    console.log(color.red("[ERROR] ") + color.white(error));
    console.log(
      color.red("[INFO] ") +
        color.gray("Terminating node process to ensure data integrity...")
    );
    process.exit(1);
  }
})();

// read command files
const readCommands = (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readCommands(filePath);
    } else if (file.startsWith("!")) {
      // ignore files that start with "!"
      console.log(
        color.yellow("[WARN] ") +
          color.white(`Skipping "${file}" as it is marked as an exclusion.`)
      );
    } else if (file.endsWith(".js")) {
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(
          color.green("[INFO] ") +
            color.white(`Registered command "${command.data.name}"`)
        );
      } else {
        console.log(
          color.yellow("[WARN] ") +
            color.white(
              `Command "${file}" is missing a required "data" or "execute" property.`
            )
        );
      }
    }
  }
};

client.commands = new Collection();
readCommands(commandsDir); // read commands

const commands = Array.from(client.commands.values()).map(
  (command) => command.data
);

console.log(
  color.green("[INFO] ") + color.white(`Loaded ${commands.length} commands.`)
);

// event handler function
const eventHandler = (eventDir, eventName) => {
  const eventFiles = fs
    .readdirSync(eventDir)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    try {
      const handler = require(path.join(eventDir, file));

      client.on(eventName, async (...args) => {
        try {
          await handler(client, ...args);
        } catch (error) {
          handleError(error);
        }
      });
    } catch (error) {
      handleError(error);
    }
  }
};

// iterate through event folders
for (const folder of eventFolders) {
  const eventDir = path.join(eventsDir, folder);
  if (fs.lstatSync(eventDir).isDirectory()) {
    eventHandler(eventDir, folder);
  }
}

// slash command interaction handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(
      color.red("[ERROR] ") +
        color.white(`No command matching ${interaction.commandName} was found.`)
    );
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    handleError(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        embeds: [
          embed.error("An internal error has occurred. Please try again later"),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [
          embed.error("An internal error has occurred. Please try again later"),
        ],
      });
    }
  }
});

// req:put commands to Discord API
client.once("ready", () => {
  const rest = new REST({ version: "10" }).setToken(token);

  rest
    .put(Routes.applicationCommands(process.env.client_id), {
      body: commands,
    })
    .then(() => {
      if (commands.length === 0) {
        console.log(
          color.yellow("[WARN] ") +
            color.white("No commands found. Skipping registration.")
        );
      } else {
        console.log(
          color.green("[INFO] ") +
            color.white(
              `Successfully registered ${commands.length} command(s).`
            )
        );
      }
    })
    .catch((error) => {
      handleError(error);
    });

  createBackup();

  setInterval(
    () => {
      console.log(
        color.green("[INFO] ") + color.white("Running backup process...")
      );
      createBackup();
    },
    6 * 60 * 60 * 1000
  );
});

client.on("error", (error) => {
  handleError(error);
  sendErrorWebhook(error);
});

process.on("unhandledRejection", (error) => {
  handleError(error);
  sendErrorWebhook(error);
});

process.on("uncaughtException", (error) => {
  handleError(error);
  sendErrorWebhook(error);
});

client.login(token).catch((error) => {
  handleError(error);
  sendErrorWebhook(error);
});

function sendErrorWebhook(error) {
  const webhookUrl = process.env.webhook_url;
  const webhookClient = new WebhookClient({ url: webhookUrl });

  webhookClient.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🚨 Error!")
        .setDescription(
          `An error occurred in the bot console!\n\n\`\`\`\n${error}\n\`\`\``
        )
        .setColor(config.general.botColor),
    ],
  });
}
