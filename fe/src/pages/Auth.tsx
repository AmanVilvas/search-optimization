import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'

// const supabase = createClient()

    export default function Auth(){
        async function  Login(provider: "github" | "google"){
            const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider

            })
            if(error){
                alert('error in signin')
            }else {
                alert('sigin success')
            }
        }
        return <div>
            <button onClick={()=> Login("google")}>Login with google</button>
            <button onClick={()=> Login("github")}>login with github</button>
        </div>

    }