import { collectionChroma } from "@/services/chromaClient";
import { flatten } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";

import { searchFileChunks } from "../../services/searchFileChunks";
import { FileChunk, FileLite } from "../../types/file";

type Data = {
  searchResults?: FileChunk[];
  error?: string;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const searchQuery = req.body.searchQuery as string;

    const files = req.body.files as FileLite[];

    const maxResults = req.body.maxResults as number;

    if (!searchQuery) {
      res.status(400).json({ error: "searchQuery must be a string" });
      return;
    }

    // if (!Array.isArray(files) || files.length === 0) {
    //   res.status(400).json({ error: "files must be a non-empty array" });
    //   return;
    // }

    if (!maxResults || maxResults < 1) {
      res
        .status(400)
        .json({ error: "maxResults must be a number greater than 0" });
      return;
    }

    const fileChunk =  {
      filename: '',
      text: ''
    } as FileChunk

    const collection = await collectionChroma()

    const result = await collection.query(
      undefined, // query_embeddings
      1, // n_results
      undefined, // where
      [searchQuery], // query_text
    ).then( (value) => {
      // console.log({value: JSON.stringify(value, undefined)})
      
      console.log(value)

      return value?.['documents'].map( (array: any) => ({
        text: flatten(array)
      }))
    })

    console.log({result})

    // const searchResults = await searchFileChunks({
    //   searchQuery,
    //   files,
    //   maxResults,
    // });

    res.status(200).json({ searchResults: result });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: "Something went wrong" });
  }
}
