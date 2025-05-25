import Giveaway from "../../models/Giveaway";
import { GiveawayDocument } from "../../models/Giveaway";

interface GiveawayFilterOptions {
  active?: boolean;
  sortBy?: "startTime" | "endTime" | "participants" | "id";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

class ListGiveaways {
  constructor() {}

  public async execute(
    options: GiveawayFilterOptions = {}
  ): Promise<GiveawayDocument[]> {
    try {
      const query: any = {};
      if (options.active !== undefined) {
        query.ended = !options.active;
      }

      let sortOptions: any = {};
      if (options.sortBy) {
        sortOptions[options.sortBy] = options.sortOrder === "desc" ? -1 : 1;
      } else {
        sortOptions.id = -1;
      }

      let giveawaysQuery = Giveaway.find(query).sort(sortOptions);
      if (options.limit) {
        giveawaysQuery = giveawaysQuery.limit(options.limit);
      }

      const giveaways = await giveawaysQuery.exec();
      return giveaways;
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
      return [];
    }
  }

  public async getActive(): Promise<GiveawayDocument[]> {
    return this.execute({ active: true });
  }

  public async getEnded(): Promise<GiveawayDocument[]> {
    return this.execute({ active: false });
  }

  public async getRecent(limit: number = 5): Promise<GiveawayDocument[]> {
    return this.execute({ sortBy: "startTime", sortOrder: "desc", limit });
  }
}

export default ListGiveaways;
