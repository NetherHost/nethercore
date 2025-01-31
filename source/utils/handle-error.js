// Copyright 2025 Nether Host

const color = require("chalk");

function handleError(error) {
  console.log(color.red("[ERROR] ") + color.white(error.message));
  console.log(color.red("[ERROR] ") + color.gray(error.stack));
}

module.exports = handleError;
