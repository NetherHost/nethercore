const handleError = require("./handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
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
        content: `# System Prompt:\n${systemPrompt}\n\n# Info DB:\n${infoDB}`,
      },
      {
        role: "user",
        content: `Below is a rough representation of your past messages with the user you are chatting to:\n${context}\n\nAnalyze the prompt provided and provide a response in ${language}. (Prioritize this language), (If the language is Hindi, respond in romanized Hindi). \n\n${prompt}`,
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
    return "Failed to generate a response from OpenAI. Please try again later.";
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
  translate,
};