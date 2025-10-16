import fs from 'fs';
import path from 'path';

const inputFile = path.resolve(process.cwd(), 'public/scraped_data.json');
const outputFile = path.resolve(process.cwd(), 'public/filtered_data.json');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    // Step 1: Read the file
    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const data = JSON.parse(rawData);

    // Step 2: Filter out blog URLs
    const filtered = data.filter(item => {
        return (
            typeof item.url === 'string' &&
            !item.url.includes('/blog/') &&
            !item.url.toLowerCase().includes('.pdf')
        );
    });


    // Step 3: Write filtered data to a new file
    fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2), 'utf-8');

    console.log(`✅ Filtered data saved to ${outputFile}`);

    return res.status(200).json({ message: 'Data filtered successfully', count: filtered.length });
}




