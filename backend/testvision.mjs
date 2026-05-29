import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.sambanova.ai/v1',
  apiKey: process.env.SAMBANOVA_API_KEY,
});

try {
  const res = await client.chat.completions.create({
    model: 'Llama-3.2-11B-Vision-Instruct',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image_url', image_url: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png' } }
      ]
    }],
  });
  console.log('SUCCESS:', res.choices[0].message.content);
} catch(e) {
  console.log('ERROR:', e.message);
}
