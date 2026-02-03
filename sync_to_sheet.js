import fs from 'fs';

async function syncToSheet() {
    const DATA_FILE = './my_terms.json';
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzllfwPAbicgXA1KnpL0bho4nM6joRoigVEZBEkC0tluuYpEjOBK5YkuBuRW-mWAHE8/exec';

    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const terms = JSON.parse(data);

        console.log(`Uploading ${terms.length} terms to Google Sheets...`);

        // We use a simple POST request to a Google Apps Script "Web App"
        // This is the standard way to write to a Sheet without complex OAuth/Service Accounts.
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(terms),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        if (result.status === 'success') {
            console.log('--- SYNC COMPLETE ---');
            console.log(`Google Sheet now contains all ${terms.length} terms.`);
        } else {
            console.error('Sync failed:', result.message);
        }
    } catch (e) {
        console.error('Error syncing to sheet:', e.message);
        console.log('\nNOTE: To enable this, you need to deploy a small Google Apps Script.');
    }
}

syncToSheet();
