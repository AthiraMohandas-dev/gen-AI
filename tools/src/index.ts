import { GoogleGenAI, type Content, Type } from "@google/genai";
import dotenv from "dotenv";
import config = require("dotenv");
dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GENAI_API_KEY || "",
});

type Context = {
  role: "user" | "assistant";
  parts: { text: string };
}[];
const context: Content[] = [
  {
    role: "user",
    parts: [
      {
        text: "What is the current temperature in Mannheim?",
      },
    ],
  },
];

const getCurrentTemperatureFunctionDeclaration = {
  name: "getCurrentTemperature",
  description: "Fetches real-time data",
  parameters: {
    type: Type.OBJECT,
    properties: {
      place: {
        type: Type.STRING,
        description: "location for which to fetch real-time data",
      },
    },
    required: ["place"],
  },
};

// Implementation for getting real-time data
async function getCurrentTemperature(location: any) {
  // Get coordinates
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`,
  );

  const geoData = await geoRes.json();

  if (!geoData.results?.length) {
    throw new Error(`Place not found: ${location}`);
  }

  const { latitude, longitude } = geoData.results[0];

  // Get current temperature
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`,
  );

  const weatherData = await weatherRes.json();
  console.log(`Fetched temperature data for ${location}:`, weatherData);
  return {
    temperature: weatherData.current.temperature_2m,
    location: location,
    time: weatherData.current.time,
    temperatureunit: weatherData.current_units.temperature_2m,
  };
}

async function callAItool() {
  const response = await genAI.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: context,
    config: {
      tools: [
        {
          functionDeclarations: [getCurrentTemperatureFunctionDeclaration],
        },
      ],
    },
  });
  console.log("AI Response:", response.functionCalls);
  if (response.functionCalls && response.functionCalls.length > 0) {
    const functionCall = response.functionCalls[0]; // Assuming one function call
    console.log(`Function to call: ${functionCall?.name}`);
    console.log(`ID: ${functionCall?.id}`);
    console.log(`Arguments: ${JSON.stringify(functionCall?.args)}`);
    const result = await getCurrentTemperature(functionCall?.args?.place);

    // Create a function response part (ensure required fields are defined)
    const function_response_part = {
      name: functionCall?.name ?? "getCurrentTemperature",
      response: { result },
      id: functionCall?.id ?? "",
    };
    console.log(`Result from function: ${JSON.stringify(result)}`);

    context.push({
      role: "user",
      parts: [{ functionResponse: function_response_part }],
    });
    const followUpResponse = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: context,
      config: {
        tools: [
          {
            functionDeclarations: [getCurrentTemperatureFunctionDeclaration],
          },
        ],
      },
    });
    console.log("Follow-up AI Response:", followUpResponse.text);
  } else {
    console.log("No function call found in the response.");
    console.log(response.text);
  }
}

callAItool();
