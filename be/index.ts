import 'dotenv/config';
import { tavily } from '@tavily/core'
import express from "express"
import { Output, streamText } from 'ai'
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from './prompt';
import { prisma } from './db';
import { middleware } from './middleware';
import  cors  from 'cors';
import { Prisma } from './generated/prisma/client';
// import z from "zod"

const tavilyKey = process.env.TAVILY_API

const client = tavily({ apiKey: tavilyKey });

const app = express()
app.use(cors())
app.use(express.json())



// console.log(res);

app.get('/convos', middleware, async(req,res)=>{
     const convo = await prisma.conversation.findMany({
          where: {userId: req.userId},
          select: {id: true, title: true, slug: true},
     });
     res.json({convo})
})
app.get('/convos/:convoId', middleware, async(req, res)=>{
     const convoId = req.params.conversationId
     const convo = await prisma.conversation.findFirst(
          {
               where:{
                    cId: convoId,
                    userId: req.userId
               }, include:{
                    messages: { orderBy: {createdAt: "asc"}}
               }
          }
     )
})
app.post('/ask', async (req, res) => {
     try {

          const query = req.body.query

          const webSearch = await client.search(query, {
               searchDepth: "basic"
          })
          const webSearchResult = webSearch.results

          const conversation = await prisma.conversation.create({
               data:{
                    id: req.userId,
                    title: query.slice(0,80),
                    messages: {
                         create: {content: query, role: "User"}
                    }
               }
          })
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

          res.header('Cache-Control', 'no-cache')
          res.header('Content-Type', 'text/event-stream')
          res.header('X-Conversation-Id', 'convoId')
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
// 
          res.write("\n <trustmebro> \n")

          res.write(JSON.stringify(webSearchResult.map(result=>({
               url: result.url
          }))))

          // res.write("\n<trustmebro/>\n")

          res.end()

          await prisma.message.create({
               data: {
                    content: JSON.stringify(webSearchResult.map(result=>({
               url: result.url
          }))),
          role: "Assistant",
          convoId: conversation.id
               }
          })
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

