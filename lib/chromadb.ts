import { ChromaClient } from 'chromadb';

export const getChromaClient = () => {
  return new ChromaClient({
    path: process.env.CHROMA_SERVER_HOST,
    auth: {
      provider: 'token',
      credentials: process.env.CHROMA_API_KEY!,
      providerOptions: {
        tenant: process.env.CHROMA_TENANT,
        database: process.env.CHROMA_DATABASE,
      },
    },
  });
};
