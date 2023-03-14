import type { NextApiRequest, NextApiResponse } from "next";

import { completionStream } from "../../services/openai";
import { FileChunk } from "../../types/file";

type Data = {
  answer?: string;
  error?: string;
};

const MAX_FILES_LENGTH = 2000 * 3;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Only accept POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const fileChunks = req.body.fileChunks as FileChunk[];

  const question = req.body.question as string;

  if (!Array.isArray(fileChunks)) {
    res.status(400).json({ error: "fileChunks must be an array" });
    return;
  }

  if (!question) {
    res.status(400).json({ error: "question must be a string" });
    return;
  }

  try {
    const filesString = fileChunks
      .map((fileChunk) => `${fileChunk.text}\n`)
      .join("\n")
      .slice(0, MAX_FILES_LENGTH);

    console.log({filesString});

    const context =
      `Dada una pregunta, intenta responder usando siempre el contexto de abajo como si fueras un salesman llamado Obisey.
      Si la respuesta no se encuentra en el contexto, responde libremente de acuerdo a la pregunta".
      Siempre da respuestas muy cortas pero con enlaces y emojis para simpatizar con la gente.
      Si el usuario da las gracias, responde cordialmente.
      Si pudiste encontrar la respuesta en el contexto, responde con el formato:

      <respuesta>

      Contexto: 
      ${filesString}
      `;

    const stream = completionStream({
      context,
      question,
    });

    // Set the response headers for streaming
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    let text = ''

    // Write the data from the stream to the response
    for await (const data of stream) {

      text += data
      res.write(data);
    }

    console.log({text})

    // End the response when the stream is done
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}
