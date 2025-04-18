const shutdown = async (database, client) => {
  try {
    logger.info("Shutting down...");

    await client.destroy();
    logger.info("Discord client destroyed");

    await database.destroy();
    logger.info("Database disconnected");

    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
    process.exit(1);
  }
};

module.exports = shutdown;
