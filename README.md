# Zibtek AI Assistant

Next.js 15 app that provides an authenticated chat experience grounded on Zibtek website content. It retrieves relevant chunks from Pinecone (ingested via Nomic embeddings), and answers strictly using Gemini (Google Generative AI). User and session data are stored in MongoDB. Includes an admin view for chat logs and a simple ingestion pipeline (scrape → filter → embed → upsert to Pinecone).

## Features

- Next.js App Router UI with Tailwind (dark UI chat experience)
- Email/password auth with secure, HttpOnly session cookie (MongoDB backed)
- Admin login and chat logs viewer at `/chat-logs`
- RAG pipeline: Nomic embeddings + Pinecone vector store + Gemini LLM
- Ingestion helpers: sitemap scraping (Puppeteer), content filtering, token estimate, vector upsert

## Stack

- Next.js 15, React 19
- MongoDB (users, sessions, chat logs)
- Pinecone (vector DB)
- LangChain with:
	- Nomic Embeddings (default: `nomic-embed-text-v1`)
	- Google Generative AI (Gemini, default: `gemini-1.5-pro`)
- Puppeteer (optional: sitemap scraping)
- Tailwind CSS v4

## Prerequisites

- Node.js 18.18+ or 20+
- A MongoDB connection string (Atlas or local)
- Pinecone account and an index
	- If using `nomic-embed-text-v1`, create the index with dimension 768
- Google Generative AI API key (environment variable `GOOGLE_API_KEY`)
- Nomic API key for embeddings

## Quick start

1) Clone and install dependencies

```bash
git clone <this-repo>
cd zibtek
npm install
```

2) Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables are described below.

3) Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Environment variables

The app reads environment variables via Next.js/Node. Set these in `.env.local` during development and as environment variables in production.

- MONGO_DB: MongoDB connection string (e.g., mongodb+srv://...)
- GOOGLE_API_KEY: Google Generative AI API key for Gemini
- GOOGLE_GEMINI_MODEL: Gemini model name (default: gemini-1.5-pro)
- NOMIC_API_KEY: Nomic API key for embeddings
- EMBEDDING_MODEL: Embedding model name (e.g., nomic-embed-text-v1)
- PINECONE_API_KEY: Pinecone API key
- PINECONE_INDEX: Pinecone index name (must exist and match embedding dimension)
- RETRIEVE_K: Number of documents to retrieve (default: 4)

Optional, inferred by code:

- NODE_ENV: development | production (used for cookie security)

## How authentication works

- Users can sign up (`/signup`) and log in (`/login`). Passwords are salted and scrypt-hashed server-side.
- A secure, HttpOnly `session` cookie is issued and stored in MongoDB `sessions` collection.
- The chat UI at `/home` requires a valid session; otherwise users are redirected to `/login`.
- Admins can access `/chat-logs` after logging in at `/admin-login`.

To promote any existing user to admin, set `isAdmin: true` in MongoDB:

```js
// Using mongosh
use <your-db-name>
db.users.updateOne({ email: "admin@example.com" }, { $set: { isAdmin: true } })
```

## Data ingestion pipeline (scrape → filter → tokens → embeddings)

You can build your vector store from a website sitemap. The following endpoints are simple helpers to orchestrate this locally.

Important: The scraping step uses Puppeteer and is best run locally (not on serverless). The endpoints write files under `public/` or `trash/`.

1) Scrape from sitemap to `public/scraped_data.json`

```bash
curl -X POST http://localhost:3000/api/ingestion \
	-H 'Content-Type: application/json' \
	-d '{ "sitemapUrl": "https://www.zibtek.com/sitemap.xml" }'
```

2) Filter out unwanted URLs to `public/filtered_data.json`

```bash
curl -X POST http://localhost:3000/api/filter-data
```

3) Estimate token usage (expects `trash/filtered_data.json`)

Note: `count-tokens` and `save-embedding` currently read from `trash/filtered_data.json`, while the filter step writes to `public/filtered_data.json`. Copy the filtered file before running these endpoints:

```bash
mkdir -p trash
cp public/filtered_data.json trash/filtered_data.json

curl -X POST http://localhost:3000/api/count-tokens
```

4) Generate embeddings and upsert to Pinecone (reads `trash/filtered_data.json`)

```bash
curl -X POST http://localhost:3000/api/save-embedding
```

After this, the chat route will query Pinecone and respond using only retrieved context.

## Running the chat

With the server running:

- Visit `/signup` to create a user, or `/login` to sign in
- Navigate to `/home` for the chat UI
- Admins: `/admin-login` then `/chat-logs` to view per-user chat history

## Scripts

- dev: Start Next.js in dev mode with Turbopack
- build: Build production bundle with Turbopack
- start: Start production server
- lint: Run ESLint

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## API endpoints

Auth and user:

- POST `/api/signup` { name, email, password }
- POST `/api/login` { email, password }
- POST `/api/logout`
- GET `/api/me`
- POST `/api/admin-login` { email, password } (requires user with isAdmin: true)

Chat and retrieval:

- POST `/api/chat` { message, userId? } → streams a text/plain response
	- Uses Pinecone retriever with Nomic embeddings and answers via Gemini

Ingestion utilities:

- POST `/api/ingestion` { sitemapUrl } → writes `public/scraped_data.json`
- POST `/api/filter-data` → reads `public/scraped_data.json`, writes `public/filtered_data.json`
- POST `/api/count-tokens` → reads `trash/filtered_data.json`
- POST `/api/save-embedding` → reads `trash/filtered_data.json`, upserts to Pinecone

## Project structure (high level)

```
src/
	app/                 # App Router pages (home, login, signup, admin)
	components/          # Chat and admin UI components
	lib/                 # db, auth, sessions, config
	pages/api/           # API routes (auth, chat, ingestion)
public/                # static files + scraped/filtered data outputs
trash/                 # working directory for filtered data used by embeddings
```

Path alias: you can import from `@/*` which maps to `src/*` (see `jsconfig.json`).

## Deployment notes

- Ensure all environment variables are set in your hosting platform
- Puppeteer-based scraping (`/api/ingestion`) may not run on serverless without additional configuration—run locally for ingestion and commit/upload the resulting JSON if needed
- Pinecone index must exist and match the embedding model dimension (e.g., 768 for `nomic-embed-text-v1`)
- For production, run `npm run build` then `npm run start`

## Troubleshooting

- Mongo connection error: confirm `MONGO_DB` is set and reachable
- Pinecone errors: verify `PINECONE_API_KEY` and `PINECONE_INDEX` (and index dimension)
- Gemini errors: ensure `GOOGLE_API_KEY` is set; optionally set `GOOGLE_GEMINI_MODEL`
- 500s in chat: check server logs; often due to missing env vars or empty/unavailable Pinecone index
- Ingestion path mismatch: remember to copy `public/filtered_data.json` to `trash/filtered_data.json` before `/api/save-embedding`

---

Made with Next.js, LangChain, Pinecone, Gemini, and MongoDB.
