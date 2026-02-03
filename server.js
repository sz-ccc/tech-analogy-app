import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static('.'));

const DATA_FILE = './my_terms.json';
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1WVWzz7CT_o2GA9bAlPkVf0sS--l4iHioYCZySs3O0-U/export?format=csv&gid=0';

async function getTerms() {
    try {
        // First, try to fetch fresh data from Google Sheets
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        const sheetTerms = [];
        const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const matches = line.match(regex) || [];
            const row = matches.map(m => m.replace(/^"|"$/g, '').trim());
            if (row.length >= 4) {
                sheetTerms.push({
                    category: row[0],
                    term: row[1],
                    explanation: row[2],
                    analogy: row[3]
                });
            }
        }
        
        if (sheetTerms.length > 0) return sheetTerms;
    } catch (e) {
        console.error('Cloud storage fetch failed, falling back to local JSON:', e);
    }

    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

async function saveTerms(terms) {
    await fs.writeFile(DATA_FILE, JSON.stringify(terms, null, 2));
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

app.post('/api/search', async (req, res) => {
    const { query, forceNew } = req.body;
    const termLower = query.toLowerCase().trim();
    
    let terms = await getTerms();
    
    // 1. Check local database (unless forceNew is true)
    if (!forceNew) {
        let found = terms.find(t => t.term.toLowerCase() === termLower);
        if (found) {
            return res.json({ source: 'database', ...found });
        }
    }

    // 2. Not found or forceNew, ask Gemini
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    try {
        const prompt = `You are a technical expert. Define the term "${query}". 
        ${forceNew ? `IMPORTANT: The user already saw one definition and wants a DIFFERENT technical context or meaning for "${query}". 
        For example, if it's a technical algorithm, they might want to know about a company or tool with the same name.` : ''}
        
        IMPORTANT: If this is NOT a technical or professional software/infrastructure/IT term, respond with ONLY the word "REJECTED".
        A technical term usually involves programming languages, software architectures, infrastructure tools, algorithms, or computer science concepts.
        
        If it is a tech term, provide a restaurant-themed analogy. 
        Keep the restaurant theme consistent (Kitchen, Chefs, Menu, Diners).
        
        Respond ONLY with a JSON object in this exact format:
        {
          "category": "Suggested Category Name",
          "term": "${query}",
          "explanation": "Professional concise definition",
          "analogy": "Memorable restaurant analogy"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (text.trim().toUpperCase() === "REJECTED") {
            return res.status(400).json({ error: "Master, that doesn't look like a tech term suitable for our kitchen library." });
        }

        // Clean up JSON if Gemini includes markdown blocks
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const newEntry = JSON.parse(cleanJson);

        // 3. Save to database for future use
        terms.push(newEntry);
        await saveTerms(terms);

        // 4. Update Cloud Storage (Google Sheets) automatically
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzllfwPAbicgXA1KnpL0bho4nM6joRoigVEZBEkC0tluuYpEjOBK5YkuBuRW-mWAHE8/exec';
        try {
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(terms),
                headers: { 'Content-Type': 'application/json' }
            }).catch(e => console.error('Cloud sync background error:', e));
        } catch (e) {
            console.error('Cloud sync attempt failed:', e);
        }

        res.json({ source: 'ai', ...newEntry });
    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({ error: 'Master, the AI kitchen is experiencing a glitch.' });
    }
});

app.post('/api/delete', async (req, res) => {
    const { term } = req.body;
    let terms = await getTerms();
    const newTerms = terms.filter(t => t.term !== term);
    
    if (terms.length === newTerms.length) {
        return res.status(404).json({ error: 'Term not found in library.' });
    }

    await saveTerms(newTerms);
    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`🏮 Sensei's Kitchen is open at http://localhost:${port}`);
});
