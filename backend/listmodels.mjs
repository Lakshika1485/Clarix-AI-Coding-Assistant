import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GEMINI_API_KEY;
const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
const d = await r.json();
const names = d.models?.map(m => m.name).filter(n => n.includes('gemini'));
console.log(JSON.stringify(names, null, 2));
