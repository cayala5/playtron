import type { APIRoute } from 'astro';
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
    // CHRISTIAN TODO: implement refreshing token
}

export const GET: APIRoute = async ({redirect, cookies, url}) => {
    const qparams = url.searchParams;
    if (qparams.has("error")) {
        return redirect("/error");
    } else if (!qparams.has("code")) {
        return redirect("/error");
    } else {
        const response = await makeTokenRequest(qparams.get("code")!)

        if (response.status !== 200) {
            console.log(await response.text());
            return redirect("/error");
        }

        const data = await response.json()
        cookies.set("session", data.access_token, {
            httpOnly: true,
            maxAge: 60*60
        });
        return redirect("/");
    }
}