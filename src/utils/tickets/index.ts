import OpenTicket from "./open-ticket";
import CloseTicket from "./close-ticket";
import DeleteTicket from "./delete-ticket";
import TicketTranscripts from "./transcript";

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

  public transcript() {
    return new TicketTranscripts();
  }
}

export default Ticket;
