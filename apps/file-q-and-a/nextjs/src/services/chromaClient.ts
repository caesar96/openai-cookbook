import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'

export const chromeClient = new ChromaClient();

const embedder = new OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY as string)


export const collectionChroma = (async () => {
    
    try {
        // await chromeClient.reset()
        return await chromeClient.createCollection("multiverso_diademuertos", {}, embedder)
    } catch (error) {
        return await chromeClient.getCollection("multiverso_diademuertos", embedder)
    }
    
    
})