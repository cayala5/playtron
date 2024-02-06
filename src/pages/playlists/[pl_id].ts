import type { APIRoute } from "astro";
import { SpotifyAPIHelper } from "../../script/spotify_api";

/*
SCHEMA
- playtron/playlists/<id>
  - GET: 
  - PUT:
     - action: "shuffle"|"sort"
     - params <optional>: 
        - For shuffle, nothing for now
        - For sort: {field: string}
*/

const MAX_REQS = 20;

async function performHardShuffle(plId: string, token: string): Promise<boolean> {
    const spotify = new SpotifyAPIHelper(token);
    const data = await spotify.makeGetPlaylistRequest(plId, ["tracks.total"]);
    if (!data) {
        return false;
    }

    const plsLeng = data.tracks.total;
    if (plsLeng < 2) {
        return true;
    }
    const window = Math.ceil(plsLeng/MAX_REQS);
    let paste = 0;
    for (let i=0; i<MAX_REQS; ++i) {
        const lastPossibleStartIndex = plsLeng - window;
        if (paste > lastPossibleStartIndex) {
            // there's fewer tracks left to shuffle than a full window
            break;
        }

        // pick an int randomly from [paste, lastPossibleStartIndex]
        const startIndex =
            Math.floor(Math.random() * (lastPossibleStartIndex - paste + 1)) + paste

        const resp = await spotify.makeUpdatePlaylistItemsRequest(
            plId, startIndex, paste, window);
        if(!resp) {
            return false;
        }

        paste += window;
    }

    return true;
}

function makeErrorResponse(message: string, code: number) {
    const bodyData = {
        errorMessage: message
    };
    return new Response(JSON.stringify(bodyData), {
        status: code
    });
}

export const PUT: APIRoute = async ({params, request, url, cookies, redirect}) => {
    const token = cookies.get("session")?.value;
    if (token === undefined) {
        return redirect("/auth");
    }

    let reqData;
    try {
        reqData = await request.json();
        if (!reqData.action || reqData.action != "shuffle") {
            throw new Error();
        }
    } catch(error) {
        return makeErrorResponse("Bad request body", 400);
    }

    if(await performHardShuffle(params.pl_id!, token)) {
        return new Response(null, {
            status: 200
        });
    } else {
        return makeErrorResponse("Error shuffling playlist", 500);
    }
};
