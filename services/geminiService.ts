import { GoogleGenAI, Schema, Type } from "@google/genai";
import { BiomeType, Puzzle, TileData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Prompt templates
const BIOME_DESCRIPTIONS: Record<BiomeType, string> = {
  [BiomeType.DATA_WASTELAND]: "A barren landscape of corrupted code and fragmented data packets.",
  [BiomeType.NEON_FOREST]: "A dense thicket of fiber-optic cables glowing with bioluminescent data.",
  [BiomeType.SERVER_CITY]: "Towering monoliths of black glass housing infinite storage arrays.",
  [BiomeType.QUANTUM_FLUX]: "A chaotic region where reality flickers and physics is optional.",
  [BiomeType.REALITY_NODE]: "A stable anchor point connecting the Cortex to the Physical World.",
};

export const generateTileContent = async (
  x: number,
  y: number,
  biome: BiomeType
): Promise<{ description: string; visualFeature: string }> => {
  try {
    const model = 'gemini-3-flash-preview';
    const basePrompt = BIOME_DESCRIPTIONS[biome];
    
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a very short, atmospheric description (max 20 words) for a location in a cyberpunk "open world" game. 
      Biome: ${biome}. 
      Context Description: ${basePrompt}.
      Coordinates: [${x}, ${y}].
      Also provide a single 1-3 word "visual feature" (e.g., "Broken Monolith", "Glowing Tree").
      
      Response format: JSON object with keys "description" and "visualFeature".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            visualFeature: { type: Type.STRING }
          },
          required: ["description", "visualFeature"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Gen Error:", error);
    return {
      description: "Static interference blocks your sensors.",
      visualFeature: "Glitch"
    };
  }
};

export const generatePuzzle = async (biome: BiomeType, difficulty: number): Promise<Puzzle> => {
  // If it's a REALITY_NODE, we MUST use Google Search to generate a "Real World" puzzle.
  if (biome === BiomeType.REALITY_NODE) {
    return generateRealityPuzzle();
  }

  // Otherwise, standard logic/riddle
  const model = 'gemini-3-flash-preview';
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Create a cyberpunk-themed logic puzzle or riddle.
      Difficulty: Level ${difficulty}.
      Biome Context: ${biome}.
      Output JSON with: question, type (must be 'logic' or 'riddle'), answer (short string), and options (array of strings if applicable, or empty).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['logic', 'riddle'] },
            answer: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

     const data = JSON.parse(response.text || '{}');
     return {
       id: crypto.randomUUID(),
       question: data.question,
       type: data.type,
       options: data.options,
       answer: data.answer,
       solved: false
     };
  } catch (e) {
    return {
      id: crypto.randomUUID(),
      question: "404 Puzzle Not Found. What is 2 + 2?",
      type: 'logic',
      answer: "4",
      solved: false
    };
  }
};

// The Feature: Search Grounding
const generateRealityPuzzle = async (): Promise<Puzzle> => {
  const model = 'gemini-3-flash-preview';
  const topics = ['space exploration', 'ocean discoveries', 'artificial intelligence news', 'ancient history findings', 'recent nobel prize'];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  try {
    // 1. First, search for a fact.
    const response = await ai.models.generateContent({
      model,
      contents: `Search for an interesting, specific, and true fact about ${randomTopic} from the last 2 years. 
      Then, create a multiple-choice trivia question based on this fact.
      Return JSON: { "question": string, "correctAnswer": string, "wrongOptions": string[] }`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json', // Using JSON mode with tools might be tricky, let's rely on prompt strength or parse manually if needed. 
        // Actually, schema works with tools in 2.5/3 models usually.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            correctAnswer: { type: Type.STRING },
            wrongOptions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Extract grounding metadata if available (it comes in candidates[0].groundingMetadata)
    // The node SDK puts it in the response object usually accessible via response.candidates[0]
    // But @google/genai wraps it. Let's look at the response structure carefully.
    // The response object has `candidates`.
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingUrls = groundingChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ title: c.web.title || 'Source', uri: c.web.uri }));

    const allOptions = [...(data.wrongOptions || []), data.correctAnswer].sort(() => Math.random() - 0.5);

    return {
      id: crypto.randomUUID(),
      question: `[REALITY CHECK]\n${data.question}`,
      type: 'reality_check',
      options: allOptions,
      answer: data.correctAnswer,
      solved: false,
      groundingUrls: groundingUrls
    };

  } catch (error) {
    console.error("Search Grounding Error:", error);
    return {
      id: crypto.randomUUID(),
      question: "The Reality Link is unstable. What year is it currently?",
      type: 'reality_check',
      answer: new Date().getFullYear().toString(),
      solved: false
    };
  }
};
