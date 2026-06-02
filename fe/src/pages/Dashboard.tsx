import { BE_URL } from "@/lib/config"
import { supabase } from "@/lib/supabase/client"
import type { AuthUser, User } from "@supabase/supabase-js"
import axios from "axios"
import { FunctionSquare } from "lucide-react"
// import { User } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"



export default function Dashboard(){
    const [user, setUser] = useState<User | null>(null)
    const navigate = useNavigate()

useEffect(()=>{
    async function getUserInfo(){
        const { data, error} = await supabase.auth.getUser()
        if(data.user){
            setUser(data.user)
            console.log(data.user);
            
        }
    }
    getUserInfo()
},[])

    return <>
    {(!user && <button onClick={()=>{
        navigate('/Auth')
    }}>sign in</button>)}

    {useEffect(()=>{
        async function getConvo() {
            if(user){
                const {data: {session}} = await supabase.auth.getSession()
                const jwt = session?.access_token
                const response = await axios.get(`${BE_URL}/convo`,
                    {
                       headers: {
                            Authorization : jwt
                        }
                    }
                )
                console.log(response.data);
                
            }
        }
        getConvo()
    },[user])}



    {user && <div>
        {user?.email}
        <button onClick={()=>{
            supabase.auth.signOut({scope: "local"})
            setUser(null)
        }}>Log out</button>
        </div>}
    </>
}