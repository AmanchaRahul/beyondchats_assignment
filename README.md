## StudyMate AI

An AI-powered study companion that lets you upload a PDF coursebook, parse and embed its content, chat with retrieval-augmented answers and citations, generate quizzes, track progress, and discover related YouTube videos. Built with Next.js App Router, React, Tailwind CSS, OpenAI, ChromaDB Cloud, Supabase Storage, and Unstructured.

### Tech stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS 4, Radix UI, Lucide icons
- **AI**: OpenAI `gpt-4o-mini` (chat, topic extraction), `text-embedding-3-small`
- **Vector DB**: ChromaDB Cloud
- **Storage/DB**: Supabase (storage bucket `pdfs`, table `quiz_attempts`)
- **Parsing**: Unstructured API for PDF -> text elements with page numbers
- **PDF viewer**: react-pdf v9 (pdf.js 4.x)

### Main features
- Upload/select PDFs from Supabase storage and preview alongside chat
- Parse PDFs via Unstructured; chunk and embed into ChromaDB Cloud
- Chat with RAG over embedded content, including page-cited quotes
- Generate a 30-question quiz (10 MCQ, 10 SAQ, 10 LAQ) and save attempts
- Progress dashboard with average/best scores and recent attempts
- YouTube recommendations by topic (mock results if API key missing)

## Setup

### Prerequisites
- Node.js 18+
- Accounts/keys for: OpenAI, Supabase, ChromaDB Cloud, Unstructured.io
- Optional: YouTube Data API v3 key

### Environment variables
Create a `.env.local` at project root:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_key

# ChromaDB Cloud
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_tenant_id
CHROMA_DATABASE=your_database_name

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Unstructured
UNSTRUCTURED_API_URL=https://api.unstructuredapp.io/general/v0/general
UNSTRUCTURED_API_KEY=your_unstructured_api_key

# YouTube (optional)
YOUTUBE_API_KEY=your_youtube_api_key
```

### Supabase setup
1. Create a storage bucket named `pdfs` and make it public (or use signed URLs + proper CORS if private).
2. Create a table `quiz_attempts` with columns:
   - `id` uuid default gen_random_uuid() primary key
   - `pdf_id` text
   - `questions` jsonb
   - `user_answers` jsonb
   - `score` numeric
   - `timestamp` timestamptz

### Install dependencies
```bash
npm install
```

## How to run locally

```bash
# development
npm run dev

# type-check
npm run lint

# production build
npm run build
npm start
```

Open `http://localhost:3000` in your browser.

## How the project is built

### Data flow at a glance
1. User uploads/selects a PDF (`components/source-selector.tsx`) → stored in Supabase, public URL retrieved.
2. Client fetches PDF, posts the file to `/api/parse-pdf` → Unstructured returns elements with page numbers.
3. Client chunks text (~500 chars) and calls `/api/embed` → OpenAI embeddings + stored in ChromaDB Cloud with metadata (`pdfId`, `pageNumber`, `chunkIndex`).
4. Chat: client posts message + `pdfId` to `/api/chat` → query embedding → ChromaDB top-k → context → OpenAI answer with citation instructions → response + citations returned.
5. Quiz: client posts content to `/api/generate-quiz` → OpenAI returns 30 Qs JSON → attempt saved via `/api/save-attempt` to Supabase.
6. Progress: `/api/get-progress` reads attempts for dashboard.
7. Videos: `/api/youtube-search` extracts topic (OpenAI) and queries YouTube (or returns mock results if key missing).

### Notable implementation details
- `react-pdf` uses pdf.js 4.x worker via CDN in `components/pdf-viewer-client.tsx` to avoid bundling issues.
- `next.config.ts` adds `fs/path` fallbacks to satisfy pdf.js v4 requirements.
- All API routes are under `app/api/*/route.ts` and are server-only.
- ChromaDB Cloud access is via `lib/chromadb.ts` using `CloudClient`.

## What’s done
- End-to-end PDF ingestion, RAG chat with citations, quiz generation and scoring, progress dashboard, YouTube recommendations, and responsive dark UI.
- Cleanup: removed non-essential console logs and debug prints while retaining errors.

## What’s missing / future improvements
- Auth/multi-user isolation (current storage is public, `pdfId` identifies scope).
- PDF text normalization and language support improvements.
- Better quiz validation and per-question explanations sourced directly from the PDF.
- Robust error boundaries and explicit retries/feedback for each step.
- Replace mock YouTube results with live API in production (set `YOUTUBE_API_KEY`).

## LLM tools used
- OpenAI models (`gpt-4o-mini`, `text-embedding-3-small`) for chat, topic extraction, and quiz generation.
- The developer also used **Claude** to assist with coding during implementation.

## Deployment to Vercel

### One-time configuration
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel, import the project.
3. Set the following Environment Variables in the Vercel dashboard (Project → Settings → Environment Variables):
   - `OPENAI_API_KEY`
   - `CHROMA_API_KEY`
   - `CHROMA_TENANT`
   - `CHROMA_DATABASE`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `UNSTRUCTURED_API_URL`
   - `UNSTRUCTURED_API_KEY`
   - `YOUTUBE_API_KEY` (optional)
4. Build & Output settings: use defaults (Framework Preset: Next.js). No custom build command needed.

### CORS and storage
- If using public Supabase storage for PDFs, ensure the bucket policy permits public read and that the PDF URL is accessible from the deployed domain.
- If private, generate signed URLs on the server and pass them to the client, and configure appropriate CORS.

### Deploy
- Trigger a deployment by pushing to `main` (or click Deploy in Vercel). Once complete, open the assigned URL.

## Notes/Troubleshooting
- If the PDF viewer fails due to worker issues, confirm the `pdfjs` worker URL in `components/pdf-viewer-client.tsx` matches the installed `pdfjs-dist` version.
- If YouTube API quota is exceeded or key is missing, the app will return mock videos.
- If ChromaDB authentication fails, verify tenant/database names and API key; ensure the collection can be created.

---
