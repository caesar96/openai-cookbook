import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'

export const chromeClient = new ChromaClient();

const embedder = new OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY as string)


export const collectionChroma = (async () => {
    
    try {
        // await chromeClient.reset()
        return await chromeClient.createCollection("documentos", {}, embedder)
    } catch (error) {
        return await chromeClient.getCollection("documentos", embedder)
    }
    
    
})