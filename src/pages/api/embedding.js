// import fs from "fs";
// import path from "path";
// import dotenv from "dotenv";
// import { NomicEmbeddings } from "@langchain/nomic";

// dotenv.config();

// const INPUT_FILE = path.join(process.cwd(), "trash", "filtered_data.json");
// const OUTPUT_FILE = path.join(process.cwd(), "trash", "embeddings.json");

// async function generateEmbeddings() {
//     if (!fs.existsSync(INPUT_FILE)) {
//         throw new Error("Input file not found: " + INPUT_FILE);
//     }

//     // 1️⃣ Load your scraped data
//     const fileData = fs.readFileSync(INPUT_FILE, "utf-8");
//     const data = JSON.parse(fileData);
//     console.log(`🧾 Loaded ${data.length} documents from ${INPUT_FILE}`);

//     // 2️⃣ Initialize Nomic embeddings
//     const embeddings = new NomicEmbeddings({
//         apiKey: process.env.NOMIC_API_KEY,
//         model: "nomic-embed-text-v1",
//     });

//     const results = [];

//     // 3️⃣ Loop through each item and embed directly
//     for (let i = 0; i < data.length; i++) {
//         const { url, extractedText } = data[i];
//         if (!extractedText || extractedText.trim() === "") continue;

//         try {
//             const vector = await embeddings.embedQuery(extractedText);
//             results.push({ url, text: extractedText, embedding: vector });
//             console.log(`✅ [${i + 1}/${data.length}] Embedded: ${url}`);
//         } catch (err) {
//             console.error(`❌ Error embedding ${url}:`, err.message);
//         }
//     }

//     // 4️⃣ Save all embeddings locally
//     fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf-8");
//     console.log(`💾 Saved ${results.length} embeddings to ${OUTPUT_FILE}`);
// }

// export default async function handler(req, res) {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ error: 'Method not allowed' });
//     }

//     try {
//         await generateEmbeddings();
//         return res.status(200).json({ message: 'Embeddings generated successfully' });
//     } catch (err) {
//         console.error("❌ Fatal error:", err);
//         return res.status(500).json({ error: err.message });
//     }
// }
