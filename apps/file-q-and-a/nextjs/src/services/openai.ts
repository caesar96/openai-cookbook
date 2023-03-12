import { IncomingMessage } from "http";
import {
  Configuration,
  CreateCompletionRequest,
  CreateCompletionResponse,
  CreateChatCompletionResponse,
  OpenAIApi,
} from "openai";

// This file contains utility functions for interacting with the OpenAI API

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
export const openai = new OpenAIApi(configuration);

type CompletionOptions = Partial<CreateCompletionRequest> & {
  prompt?: string;
  context: string;
  fallback?: string;
  question: string;
};

type EmbeddingOptions = {
  input: string | string[];
  model?: string;
};

export async function completion({
  prompt,
  fallback,
  max_tokens = 800,
  temperature = 0,
  model = "text-davinci-003",
  ...otherOptions
}: CompletionOptions) {
  try {
    const result = await openai.createCompletion({
      prompt,
      max_tokens,
      temperature,
      model,
      ...otherOptions,
    });

    if (!result.data.choices[0].text) {
      throw new Error("No text returned from the completions endpoint.");
    }
    return result.data.choices[0].text;
  } catch (error) {
    if (fallback) return fallback;
    else throw error;
  }
}

export async function* completionStream({
  question,
  context,
  fallback,
  max_tokens = 1000,
  temperature = 0.2,
  model = "gpt-3.5-turbo",
}: CompletionOptions) {
  try {
    const result = await openai.createChatCompletion(
      {
        
        max_tokens: max_tokens as number,
        messages: [
          {
            role: 'system',
            content: context
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature,
        model,
        stream: true,
        
      },
      { responseType: "stream" }
    );

    const stream = result.data as any as IncomingMessage;

    for await (const chunk of stream) {
      const line = chunk.toString().trim();
      const message = line.split("data: ")[1];

      // console.log({line})

      if (message === "[DONE]") {
        break;
      }

      // console.log({message})

      const data = JSON.parse(message)

      const mensaje = data.choices?.[0]?.delta?.content as string ?? ""
      // console.log({mensaje})
      yield mensaje
    }
  } catch (error) {
    if (fallback) yield fallback;
    else throw error;
  }
}

export async function embedding({
  input,
  model = "text-embedding-ada-002",
}: EmbeddingOptions): Promise<number[][]> {
  const result = await openai.createEmbedding({
    model,
    input,
  });

  if (!result.data.data[0].embedding) {
    throw new Error("No embedding returned from the completions endpoint");
  }

  // Otherwise, return the embeddings
  return result.data.data.map((d) => d.embedding);
}
