// Copyright 2024 Nether Host.

const { updateLeftAt } = require("../../utils/leave-server");
const handleError = require("../../utils/handle-error");

module.exports = async (client, user) => {
  try {
    await updateLeftAt(user);
  } catch (error) {
    handleError(error);
  }
};
