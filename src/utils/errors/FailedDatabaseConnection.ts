export default class FailedDatabaseConnection extends Error {
  constructor(error?: Error | string) {
    super(
      error instanceof Error
        ? `Database connection failed: ${error.message}`
        : error || "Database connection failed"
    );
    this.name = "FailedDatabaseConnection";
    Object.setPrototypeOf(this, FailedDatabaseConnection.prototype);
  }
}
