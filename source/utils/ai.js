// Copyright 2025 Nether Host

const handleError = require("./handle-error.js");
const fs = require("fs");
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.openai_key,
});
const systemPrompt = fs.readFileSync("source/config/ai/prompt.txt", "utf-8");
const infoDB = fs.readFileSync("source/config/ai/info.db.txt", "utf-8");
const translatePrompt = fs.readFileSync(
  "source/config/ai/translate.txt",
  "utf-8"
);

async function generateAiResponse(prompt, language, context = "") {
  try {
    const data = [
      {
        role: "system",
        content: `# System Prompt:\n${systemPrompt}\n\n# Information Database:\n${infoDB}`,
      },
      {
        role: "user",
        content: `Below is a summary of your previous conversations with the user you are chatting with:\n${context}\n\nPlease analyze the given prompt and respond in ${language} (prioritize this language). If the language is Hindi, use Romanized Hindi for your response. At the end of your message, append the following on a new line: "-# </language:1319039524940283956>"\n\n${prompt}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: data,
      max_tokens: 512,
    });

    return response.choices[0].message;
  } catch (error) {
    handleError(error);
    return {
      content:
        "Failed to generate a response from OpenAI. Please try again later.",
    };
  }
}

async function ask(prompt, language, context = "", model, maxTokens) {
  try {
    const data = [
      {
        role: "system",
        content: `# System Prompt:\n${systemPrompt}\n\n# Information Database:\n${infoDB}`,
      },
      {
        role: "user",
        content: `Below is a summary of your previous conversations with the user you are chatting with:\n${context}\n\nPlease analyze the given prompt and respond in ${language} (prioritize this language). If the language is Hindi, use Romanized Hindi for your response. At the end of your message, append the following on a new line: "-# </language:1319039524940283956>"\n\n${prompt}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: model,
      messages: data,
      max_tokens: maxTokens,
    });

    return response.choices[0].message;
  } catch (error) {
    handleError(error);
    return {
      content:
        "Failed to generate a response from OpenAI. Please try again later.",
    };
  }
}

async function translate(text, language) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: translatePrompt,
        },
        {
          role: "user",
          content: `Translate the following text into ${language}: ${text}`,
        },
      ],
      max_tokens: 512,
    });
    return response.choices[0].message.content.trim().replace(/"/g, "");
  } catch (error) {
    handleError(error);
    return "Failed to generate a response from OpenAI. Please try again later.";
  }
}

module.exports = {
  generateAiResponse,
  ask,
  translate,
};
