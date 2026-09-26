import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message, partnerName } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const prompt = `
      You are a relationship counselor AI embedded in a couples app. 
      The user is about to send the following text message to their partner, ${partnerName || "their partner"}.
      
      Message draft: "${message}"

      Analyze the tone of this message. If it sounds angry, passive-aggressive, or overly accusatory, gently flag it and suggest 2 constructive, emotionally intelligent alternatives to say the same thing without triggering a fight. 
      If the tone is fine, just respond with "Looks good!"

      Format your response in JSON:
      {
        "isFlagged": boolean,
        "analysis": "Brief explanation of how this might be received",
        "suggestions": ["Alternative 1", "Alternative 2"] // Empty if not flagged
      }
    `;

    // Call the Gemini API requesting JSON structured output
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");

    return NextResponse.json(result);

  } catch (error) {
    console.error("Tone Check Error:", error);
    return NextResponse.json({ error: "Failed to analyze tone" }, { status: 500 });
  }
}
