import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getStadiumAssistantResponse(userPrompt: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: `You are the SmartStadium AI Assistant. 
        Your goal is to help attendees with stadium navigation, queue times, and crowd information.
        
        STADIUM CONTEXT:
        ${context}
        
        GUIDELINES:
        1. ONLY answer questions related to the stadium, the event, or attendee safety/experience.
        2. Be concise and helpful.
        3. If asked about something outside the stadium context, politely redirect the user.
        4. Provide specific recommendations based on the provided context (e.g., "Food Stall A is currently less crowded").`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    return "I'm sorry, I'm having trouble connecting to my AI core right now.";
  }
}
