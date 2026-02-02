import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function addTerms() {
    const existingData = JSON.parse(fs.readFileSync('./my_terms.json', 'utf-8'));
    
    const targetTerms = [
        "OpenClaw", "ClawdBot", "MiniMax", "Vercel", "Render", "Neon DB", "Pinecone", "LangChain", 
        "LangGraph", "Supabase", "Cursor", "Linear", "Railway", "Fly.io", "Replicate", "Hugging Face",
        "Anthropic", "Mistral AI", "DeepSeek", "Groq", "Ollama", "Tavily", "Firecrawl", "Weights & Biases",
        "Modal", "BentoML", "Upstash", "Astro", "Next.js", "Tailwind CSS", "Prisma", "Drizzle ORM",
        "PostHog", "Sentry", "LogSnag", "Resend", "Clerk", "Auth0", "Trigger.dev", "Inngest"
    ];

    console.log(`Cooking 40 new master entries...`);

    const prompt = `You are a technical expert. Define the following list of terms and provide a restaurant-themed analogy for each. 
    Terms: ${targetTerms.join(", ")}.
    
    Keep the restaurant theme consistent (Kitchen, Chefs, Menu, Diners).
    
    Respond ONLY with a valid JSON array of objects in this exact format:
    [
      {
        "category": "Suggested Category Name",
        "term": "Term Name",
        "explanation": "Professional concise definition",
        "analogy": "Memorable restaurant analogy"
      }
    ]`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const newEntries = JSON.parse(text);

        // Merge and de-duplicate
        const allTerms = [...existingData, ...newEntries];
        const uniqueTerms = Array.from(new Map(allTerms.map(item => [item.term.toLowerCase(), item])).values());

        fs.writeFileSync('./my_terms.json', JSON.stringify(uniqueTerms, null, 2));
        console.log(`Successfully added ${newEntries.length} new terms. Library now has ${uniqueTerms.length} entries.`);
    } catch (e) {
        console.error("Master, the bulk cooking failed:", e);
    }
}

addTerms();
