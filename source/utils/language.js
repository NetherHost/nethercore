// Copyright 2025 Nether Host

const fs = require("fs");
const JSON5 = require("json5");
const handleError = require("./handle-error.js");

const loadMessages = (language) => {
  try {
    return JSON5.parse(
      fs.readFileSync(`source/config/messages/${language}.json5`, "utf-8")
    );
  } catch (error) {
    handleError(error);
    return {};
  }
};

const languageChoices = {
  ar: "العربية (Arabic)",
  "de-DE": "Deutsch (German)",
  "en-GB": "English (United Kingdom)",
  "en-US": "English (United States)",
  "es-ES": "Español (Spanish)",
  "fr-FR": "Français (French)",
  "hi-IN": "Hindi (Indian)",
  "id-ID": "Bahasa Indonesia (Indonesian)",
  "ja-JP": "日本語 (Japanese)",
  "nl-NL": "Nederlands (Dutch)",
  "pt-PT": "Português (Portuguese)",
  "ru-RU": "Русский (Russian)",
  "zh-CN": "中文 (Chinese)",
};

const shortLanguageCodes = {
  ar: "ar",
  "de-DE": "de",
  "en-GB": "en",
  "en-US": "en",
  "es-ES": "es",
  "fr-FR": "fr",
  "hi-IN": "hi",
  "id-ID": "id",
  "ja-JP": "ja",
  "nl-NL": "nl",
  "pt-PT": "pt",
  "ru-RU": "ru",
  "zh-CN": "zh",
};

module.exports = { loadMessages, languageChoices, shortLanguageCodes };
