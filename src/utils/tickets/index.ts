import OpenTicket from "./open-ticket";
import CloseTicket from "./close-ticket";

class Ticket {
  public open: OpenTicket["open"];
  public close: CloseTicket["close"];

  constructor() {
    const openTicket = new OpenTicket();
    const closeTicket = new CloseTicket();
    this.open = openTicket.open.bind(openTicket);
    this.close = openTicket.open.bind(closeTicket);
  }
}

export default Ticket;
