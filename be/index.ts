import { tavily } from '@tavily/core'
import express from "express"
const client = tavily({ apiKey: process.env.TAVILY_API });
import { Output, streamText } from 'ai'
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from './prompt';
import z from "zod"


const app = express()
app.use(express.json())

app.post('/convo', async (req, res) => {
     try {

          const query = req.body?.query

          if (!query) {
               res.status(400).json({ error: "Query missing" });
               return;
          }

          const webSearch = await client.search(query, {
               searchDepth: "basic"
          })
          const webSearchResult = webSearch.results

          const prompt = PROMPT_TEMPLATE.replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResult)).replace("{{USER_QUERY}}", query)


          const result = streamText({
               model: 'deepseek/deepseek-v4-flash',
               prompt: prompt,
               system: SYSTEM_PROMPT,
               //lets generate some structure data means locking th eformat of the res from the ai
               // output: Output.object({
               //      schema: z.object({
               //           followups: z.array(z.string()),
               //           ans : z.string()
               //      }),
               // }),
          });

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();

          let fullText = "";

          for await (const partialObject of result.textStream) {
               console.log(partialObject);

               fullText += partialObject;

               res.write(`data: ${partialObject}\n\n`);
          }

          const followUps = [...fullText.matchAll(/<question>(.*?)<\/question>/g)]
               .map(match => match[1]);

          res.write(`event: followups\n`);
          res.write(`data: ${JSON.stringify(followUps)}\n\n`);

          res.write(`event: sources\n`);
          res.write(`data: ${JSON.stringify(webSearchResult)}\n\n`);

          res.write(`event: done\n`);
          res.write(`data: end\n\n`);

          res.end()
     } catch (err) {
          console.log(err);
     }
})

app.listen(3000)