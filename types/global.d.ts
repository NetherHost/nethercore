export interface Ticket {
  userId: string;
  ticketId: string;
  name: string;
  status: "open" | "closed" | "deleted";
  department: "general" | "billing" | "technical" | "other";
  claim: {
    status: boolean;
    claimedBy?: string;
    claimedAt?: Date;
  };
  timestamps: {
    createdAt: Date;
    attendedToAt?: Date;
    closedAt?: Date;
    deletedAt?: Date;
  };
}

export interface User {
  userId: string;
  linked: {
    isLinked: boolean;
    email?: string;
  };
  isStaff: boolean;
  timestamps: {
    joinedAt?: Date;
    leftAt?: Date;
    createdAt?: Date;
  };
}
