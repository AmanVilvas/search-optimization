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

          res.header('Cache-Control', 'no-cache')
          res.header('Content-Type', 'text/event-stream')
          res.header('Connection', 'keep-alive')

          const prompt = PROMPT_TEMPLATE.replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResult)).replace("{{USER_QUERY}}", query)


          const result = streamText({
               model: 'deepseek/deepseek-v4-pro',
               prompt: prompt,
               system: SYSTEM_PROMPT,
               //lets generate some structure data means locking th eformat of the res from the ai
               // output: Output.object({
               //      schema: z.object({
               //           followups: z.array(z.string()),
               //           ans : z.string()
               //      }),
               // }),
          //
          });

        
          let buffer = ""

          for await (const partialObject of result.textStream) {

               buffer += partialObject

               let lines = buffer.split("\n")

               buffer = lines.pop()

               for (const line of lines) {
                    console.log(line);
                    res.write(`data: ${line}\n\n`);
               }
          }

          if (buffer.trim()) {
               res.write(`data: ${buffer}\n\n`);
          }

          res.write("\n <trustmebro> \n")

          res.write(JSON.stringify(webSearchResult.map(result=>({
               url: result.url
          }))))

          res.write("\n<trustmebro/>\n")

          res.end()
     }catch(err){
          console.log(err);
          
          
     }
})
//37:57

app.listen(3000)