import 'dotenv/config';
import { tavily } from '@tavily/core'
import express from "express"
import { Output, streamText } from 'ai'
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from './prompt';
import { prisma } from './db';
import { middleware } from './middleware';
import  cors  from 'cors';
// import z from "zod"

const tavilyKey = process.env.TAVILY_API

const client = tavily({ apiKey: tavilyKey });

const app = express()
app.use(cors())
app.use(express.json())



// console.log(res);

app.get('/convo', middleware, async(req,res)=>{
     res.json({
          userId: req.userId
     })
})
app.post('/ask', async (req, res) => {
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
               model: 'stepfun/step-3.7-flash',
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
app.post('/followups', async(req, res)=>{
          const follow = req.body.query
          const webSearch = await client.search(follow,{
               searchDepth:'basic'
          })
          const webresult = webSearch.results;

          res.header('Cache-Control', 'no-cache')
          res.header('Content-Type', 'text/event-stream')
          res.header('Connection', 'keep-alive')

          const prompt = PROMPT_TEMPLATE.replace("{{FOLLOW_UPS_PROMPT}}", JSON.stringify(webresult)).replace("{{USER_QUERY}}", follow);

          streamText({
               model: 'deepseek/deepseek-v4-pro',
               prompt: prompt,
               system: SYSTEM_PROMPT,
          })

     })
//37:57

app.listen(3001, ()=>{
     console.log('server is cooking smthg');
     
});

