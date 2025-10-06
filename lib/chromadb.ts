import { CloudClient } from 'chromadb';

// Initialize ChromaDB Cloud Client
export const chromaClient = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY!,
  tenant: process.env.CHROMA_TENANT!,
  database: process.env.CHROMA_DATABASE!,
});

// Helper function to get or create collection
export const getOrCreateCollection = async (collectionName: string = 'pdf_embeddings') => {
  return await chromaClient.getOrCreateCollection({
    name: collectionName,
  });
};
