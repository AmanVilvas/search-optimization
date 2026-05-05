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


          const query = req.body.query

          const webSearch = await client.search(query, {
               searchDepth: "basic"
          })
          const webSearchResult = webSearch.results

          const prompt = PROMPT_TEMPLATE.replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResult)).replace("{{USER_QUERY}}", query)


          const result = streamText({
               model: 'openai/gpt-5.4',
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

          res.header('Cache-Control', 'no-cache')
          res.header('Content-Type', 'text/event-stream')


          for await (const partialObject of result.textStream) {
               console.log(partialObject);
               
               res.write(partialObject);
          }

          res.write("-----trust me bro and ------")

          webSearchResult.forEach(result => res.write(JSON.stringify(result)))

          res.end()
     }catch(err){
          console.log(err);
          
          
     }
})

app.listen(3000)