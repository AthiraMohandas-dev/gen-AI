import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genai = new GoogleGenAI({
    apiKey: process.env.GENAI_API_KEY,
})

async function run() {
    const response = await genai.models.generateContent({
        model: "models/gemini-3.5-flash",
        contents: [
            {
                role: "user",
                parts: [{ text: "Hello, how are you?" }]
            }
        ]
    });
    console.log(response.text);
}
run();