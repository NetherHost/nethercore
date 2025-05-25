import type { User, GuildMember, Client } from "discord.js";
import type { CommandKit } from "commandkit";
import config from "../../config";

export async function run(
  member: GuildMember,
  client: Client<true>,
  handler: CommandKit
) {
  try {
    await member.roles.add(config.autorole.communityRoleId);
  } catch (error: any) {
    console.error(error);
    console.error(error.stack);
  }
}
