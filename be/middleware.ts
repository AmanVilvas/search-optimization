import type{ NextFunction, Request, Response } from "express";
import { supabaseClient } from "./client";
import { prisma } from "./db";

// const client = supabaseClient
export async function middleware(req: Request, res: Response, next: NextFunction){
    const token = req.headers.authorization
    const data = await supabaseClient.auth.getUser(token)
    const userIdData = data.data.user?.id
    if(userIdData){
        try{
            await prisma.user.create({
                data:{
                    id: data.data.user?.id,
                    
                    email: data.data.user?.email!,
                    provider: data.data.user?.app_metadata.provider === 'google' ? "Google" : "Github",
                    name: data.data.user?.user_metadata.name
                }
            })
        }catch(err){
            res.send(err)
        }
        req.userId = userIdData
        next()
        }else {
            res.status(403).json({
                message: "incorrect inputs for siginig in"
            })
        }
}