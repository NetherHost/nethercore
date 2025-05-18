import OpenTicket from "./open-ticket";
import CloseTicket from "./close-ticket";
import DeleteTicket from "./delete-ticket";

class Ticket {
  constructor() {}

  public open() {
    return new OpenTicket();
  }

  public close() {
    return new CloseTicket();
  }

  public delete() {
    return new DeleteTicket();
  }
}

export default Ticket;
