// import { GoogleGenerativeAI } from "@google/generative-ai";

// // Load API key from environment variables
// const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// // Initialize the Gemini AI client
// const genAI = new GoogleGenerativeAI(API_KEY);

// export async function fetchGeminiResponse(prompt: string) {
//     try {
//         const model = genAI.getGenerativeModel({ model: "gemini-pro" });
//         const result = await model.generateContent(prompt);
//         const response = await result.response;
//         return response.text(); // Returns the generated text
//     } catch (error) {
//         console.error("Gemini API Error:", error);
//         return "Error fetching AI response.";
//     }
// }
