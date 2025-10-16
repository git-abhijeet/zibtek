import fs from 'fs/promises';
import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from "@langchain/pinecone";
import { Document } from 'langchain/document';
import { NomicEmbeddings } from "@langchain/nomic";

dotenv.config();

async function main() {
    console.log('📥 Loading chunks from file...');
    const rawData = await fs.readFile('./trash/filtered_data.json', 'utf-8');
    const chunks = JSON.parse(rawData);
    console.log(`📄 Loaded ${chunks.length} chunks`);

    // Initialize Nomic embeddings
    const embeddingModel = new NomicEmbeddings({
        apiKey: process.env.NOMIC_API_KEY,
        model: process.env.EMBEDDING_MODEL,
    });

    const docs = chunks.map(chunk => {
        // Destructure to separate text from rest of metadata
        const { extractedText, ...metadata } = chunk;

        return new Document({
            pageContent: extractedText,
            metadata,  // contains everything except extractedText
        });
    });

    console.log('🔗 Setting up Pinecone client...');
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        // environment: process.env.PINECONE_ENVIRONMENT,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX);
    console.log(`📌 Using Pinecone index: ${process.env.PINECONE_INDEX}`);

    console.log('⚙️  Uploading documents and embeddings to Pinecone...');
    await PineconeStore.fromDocuments(docs, embeddingModel, {
        pineconeIndex: index,
        textKey: 'pageContent',
    });

    console.log('✅ Successfully uploaded embeddings and documents to Pinecone!');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await main();
        return res.status(200).json({ message: 'Embeddings uploaded to Pinecone successfully' });
    } catch (err) {
        console.error('❌ Error uploading embeddings:', err);
        return res.status(500).json({ error: err.message });
    }
}
