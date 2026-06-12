const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const genai = new GoogleGenAI({
  apiKey: process.env.GENAI_API_KEY,
});

type Context= {
  role: "user" | "assistant";
  parts: { text: string }
}[];
const context: Context = [];

async function chatCompletion() {
    const response = await genai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: context
    });
    const responseMessage = response.text;
    context.push({
      role: "model",
      parts: [{ text: responseMessage }],
    });
    console.log(response.candidates?.[0]?.content?.role, response.text);
}

async function run() {
  const input = require("prompt-sync")({ sigint: true });

  while (true) {
    const userInput = input() as string;
    if (userInput.toLowerCase() === "exit") {
      console.log("Exiting the chat. Goodbye!");
      break;
    }

    context.push({
      role: "user",
      parts: [{ text: userInput }],
    });

    await chatCompletion();
  }
}

run();
