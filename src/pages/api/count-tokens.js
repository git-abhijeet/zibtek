import fs from 'fs';
import path from 'path';

function estimateNomicTokens(text) {
    if (!text) return 0;
    const wordCount = text.trim().split(/\s+/).length;
    if (Math.ceil(wordCount * 2) > 7000) {

        console.log("🚀 ~ estimateNomicTokens ~ Math.ceil(wordCount * 2):", Math.ceil(wordCount * 2))
    }
    return Math.ceil(wordCount * 2);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const filePath = path.join(process.cwd(), 'trash/filtered_data.json');
        // const filePath = path.join(process.cwd(), 'trash/scraped_data.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileData);

        // Return just an array of token counts for each chunk
        const tokenCounts = data.map(item => estimateNomicTokens(item.extractedText));

        return res.status(200).json({ tokenCounts });
    } catch (error) {
        console.error('Error reading or parsing scraped_data.json:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
