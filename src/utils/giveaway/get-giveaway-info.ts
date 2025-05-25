import Giveaway from "../../models/Giveaway";
import { GiveawayDocument } from "../../models/Giveaway";

class GetGiveawayInfo {
  constructor() {}

  public async execute(giveawayId: number): Promise<GiveawayDocument | null> {
    try {
      const giveaway = await Giveaway.findOne({ id: giveawayId });

      if (!giveaway) {
        console.log(`Giveaway ${giveawayId} not found.`);
        return null;
      }

      return giveaway;
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
      return null;
    }
  }

  public async getByMessageId(
    messageId: string
  ): Promise<GiveawayDocument | null> {
    try {
      const giveaway = await Giveaway.findOne({ messageId });

      if (!giveaway) {
        console.log(`Giveaway with message ID ${messageId} not found.`);
        return null;
      }

      return giveaway;
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
      return null;
    }
  }
}

export default GetGiveawayInfo;
