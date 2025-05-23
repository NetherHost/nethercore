export interface BotConfig {
  staff: {
    staffRoleIds: string[];
  };
  tickets: {
    parentCategoryId: string;
    closedCategoryId: string;
  };
}

export interface Ticket {
  userId: string;
  ticketId: string;
  name: string;
  status: "open" | "closed" | "deleted";
  department: "general" | "billing" | "technical" | "other";
  claim: {
    status: boolean;
    claimedBy?: string;
    claimedAt?: number;
  };
  timestamps: {
    createdAt: number;
    attendedToAt?: number;
    closedAt?: number;
    deletedAt?: number;
    firstResponseAt?: number;
    reopenedAt?: number;
  };
  responseTime?: number;
}

export interface User {
  userId: string;
  isStaff: boolean;
  timestamps: {
    joinedAt?: number;
    leftAt?: number;
    createdAt?: number;
  };
}
