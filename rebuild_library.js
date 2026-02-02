import fs from 'fs';

async function rebuild() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/1WVWzz7CT_o2GA9bAlPkVf0sS--l4iHioYCZySs3O0-U/export?format=csv&gid=0');
        const csvText = await response.text();
        
        const lines = csvText.split('\n');
        const result = [];
        const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const matches = line.match(regex) || [];
            const row = matches.map(m => m.replace(/^"|"$/g, '').trim());

            if (row.length >= 4) {
                result.push({
                    category: row[0],
                    term: row[1],
                    explanation: row[2],
                    analogy: row[3]
                });
            }
        }

        // De-duplicate by term name (keeping the first one we find)
        const uniqueTerms = [];
        const seen = new Set();
        for (const item of result) {
            const key = item.term.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueTerms.push(item);
            } else {
                console.log('Duplicate filtered out:', item.term);
            }
        }

        fs.writeFileSync('/Users/shutingz/Documents/TechAnalogyApp/my_terms.json', JSON.stringify(uniqueTerms, null, 2));
        console.log(`\n--- REBUILD COMPLETE ---`);
        console.log(`Total rows in Sheet (minus header): ${result.length}`);
        console.log(`Unique terms saved: ${uniqueTerms.length}`);
    } catch (e) {
        console.error(e);
    }
}

rebuild();
