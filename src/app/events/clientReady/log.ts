import "dotenv/config";

import type { Client } from "discord.js";
import { ActivityType } from "discord.js";
import type { CommandKit } from "commandkit";
import cache from "../../utils/cache";

export default async function (
  c: Client<true>,
  client: Client<true>,
  handler: CommandKit
) {
  console.log(`${client.user.username} is online and ready!`);
  cache.set("ready", true);

  client.user.setActivity({
    name: `🔥 | netherhost.cc`,
    type: ActivityType.Custom,
  });
}
