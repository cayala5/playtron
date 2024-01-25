import type { APIContext } from 'astro';
import { SP_ACC_URL } from '../constants';

function makeTokenRequest(code: string): Promise<Response> {
    const url = SP_ACC_URL + "/api/token";
    const auth_str = btoa(import.meta.env.PT_ID + ":" + import.meta.env.PT_SEC);
    const bodyParams = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "http://localhost:4321/callback"
    });
    const authOptions: RequestInit = {
        method: "POST",
        body: bodyParams.toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + auth_str
        }
    };
    console.log(authOptions);
    console.log(url);
    return fetch(url, authOptions);
}

export async function GET(context: APIContext) {
    const qparams = context.url.searchParams;
    if (qparams.has("error")) {
        return context.redirect("/error");
    } else if (qparams.has("code")) {
        const response = await makeTokenRequest(qparams.get("code")!)

        if (response.status !== 200) {
            console.log(await response.text());
            return context.redirect("/error");
        }

        const data = await response.json()
        context.cookies.set("session", data.access_token);
        return context.redirect("/");
    }
}