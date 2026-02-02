# 🏮 Sensei's Kitchen - Autonomous Tech Library

This app is an **autonomous knowledge curator**. It serves tech definitions with restaurant-themed analogies and **learns in real-time**.

## 🚀 How it Works
1. **Search:** Enter any tech term in the search bar.
2. **Library Check:** The app first checks `my_terms.json` (your library).
3. **AI Learning:** If the term isn't found, the server asks **Gemini** to create a professional definition and a matching restaurant analogy.
4. **Permanent Storage:** The new entry is **automatically saved** back to `my_terms.json`, so it's ready for the next time you (or anyone) searches for it.

## 🛠️ Local Setup
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **API Key:** Add your Gemini API key to a `.env` file:
   ```text
   GEMINI_API_KEY=your_key_here
   ```
3. **Launch:**
   ```bash
   node server.js
   ```
4. **Open:** Visit `http://localhost:3000`

## ☁️ Cloud Strategy (Render)
To host this for free on Render:
1. Push this folder to a **GitHub Repository**.
2. Connect the repo to **Render** as a "Web Service".
3. **The Challenge:** Render's free tier has an "ephemeral" file system, meaning `my_terms.json` won't permanently save edits. 
4. **The Solution:** For true cloud permanence, we would eventually connect this to a simple cloud database (like MongoDB or Replit DB).
