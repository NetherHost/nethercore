// Copyright 2025 Nether Host

const fs = require("fs");
const path = require("path");

const memoryFilePath = path.join("source", "data", "memory.json");

function loadMemory() {
  if (fs.existsSync(memoryFilePath)) {
    const data = fs.readFileSync(memoryFilePath, "utf8");
    return JSON.parse(data);
  } else {
    return {};
  }
}

function saveMemory(data) {
  fs.writeFileSync(memoryFilePath, JSON.stringify(data, null, 2), "utf8");
}

function addMessageToMemory(user, sentBy, content) {
  const memoryData = loadMemory();

  if (!memoryData[user.id]) {
    memoryData[user.id] = {};
  }

  const messageIndex = Date.now();

  memoryData[user.id][messageIndex] = {
    sent_by: sentBy,
    content,
  };

  saveMemory(memoryData);
}

function getConversationContext(user, limit = 10) {
  const memoryData = loadMemory();
  const userMessages = memoryData[user.id];

  if (!userMessages) return [];

  return Object.values(userMessages).slice(-limit);
}

module.exports = {
  addMessageToMemory,
  getConversationContext,
};
