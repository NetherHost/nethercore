export default class UnknownURIError extends Error {
  constructor(uri?: string) {
    super(uri ? `Unknown URI: ${uri}` : "Unknown URI");
    this.name = "UnknownURIError";
    Object.setPrototypeOf(this, UnknownURIError.prototype);
  }
}
