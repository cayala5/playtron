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

- if there's no snapshot, then just fail
- get action - for now if it's not "shuffle", just error

REORDER ALGORITHM
- let MAX_REQS be the max number of requests we want to make to reorder one playlist
- let window be the bigger between 1 and the len(playlist) divided by MAX_REQS
- let paste_location be 0
- let snapshot_id be the snapshot we started with
- while paste_location is more than a window away from the end of the playlist:
   - select a random int in
     [paste_location + 1, <the last location where you can grab a full window>]
   - send request where range_start is that int, insert_before is paste_location,
     range_length is window, snapshot_id is snapshot_id
   - if the request failed, error out
   - otherwise, update snapshot_id, advance paste_location by window
 */

// CHRISTIAN TODO: add eslint
const MAX_REQS = 20;
async function performHardShuffle(plId: string, token: string): Promise<any> {
    // CHRISTIAN TODO: call playlist request to determine length and get snapshot
    const plsLeng = 5;
    const snapshot = "#####";
    if (plsLeng < 2) {
        return;
    }

    const spotify = new SpotifyAPIHelper(token);
    const window = Math.ceil(plsLeng/MAX_REQS);
    let paste = 0;
    let currSnap = snapshot;
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
            plId, startIndex, paste, window, currSnap);
        
        if (!resp.snapshot_id || typeof resp.snapshot_id != "string") {
            throw new Error("Unexpected response when updating playlist");
        }

        currSnap = resp.snapshot_id;

        paste += window;
    }
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

    try {
        await performHardShuffle(params.pl_id!, token);
    } catch (error) {
        console.log(error);
        return makeErrorResponse("Error shuffling playlist", 500);
    }

    const success = new Response(null, {
        status: 200
    });
    return success;
};
