import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import { getQuestionPrompt } from './prompt.js';

const client = new OpenAI({
  baseURL: 'https://api.sambanova.ai/v1',
  apiKey: process.env.SAMBANOVA_API_KEY,
});

const finalPrompt = getQuestionPrompt({ userQuestion: 'What is JavaScript?' });

const res = await client.chat.completions.create({
  model: 'Meta-Llama-3.3-70B-Instruct',
  messages: [{ role: 'user', content: finalPrompt }],
  temperature: 0.7,
});

const text = res.choices[0].message.content;
console.log('RAW RESPONSE:\n', text.substring(0, 500));

const match = text.match(/```(?:json)?([\s\S]*?)```/);
const jsonString = match ? match[1].trim() : text.trim();
console.log('\nJSON STRING:\n', jsonString.substring(0, 300));

try {
  const data = JSON.parse(jsonString);
  console.log('\nPARSED OK:', Object.keys(data));
} catch(e) {
  console.log('\nPARSE ERROR:', e.message);
}
