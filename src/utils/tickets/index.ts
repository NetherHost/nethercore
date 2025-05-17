import OpenTicket from "./open-ticket";
import CloseTicket from "./close-ticket";

class Ticket {
  constructor() {}

  public open() {
    return new OpenTicket();
  }

  public close() {
    return new CloseTicket();
  }
}

export default Ticket;
