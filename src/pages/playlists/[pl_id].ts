import type { APIRoute } from "astro";

/*
SCHEMA
- playtron/playlists/<id>?snapshot=<>
  - GET: 
  - PUT:
     - action: "shuffle"|"sort"
     - params: JSON
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

const MAX_REQS = 20;
async function performHardShuffle(plId: string, plLeng: number, snapshot: string): Promise<any> {
    if (plLeng < 2) {
        return;
    }

    const window = Math.ceil(plLeng/MAX_REQS);
    let paste = 0;
    let currSnap = snapshot;
    for (let i=0; i<MAX_REQS; ++i) {
        const lastPossibleStartIndex = plLeng - window;
        if (lastPossibleStartIndex < paste) {
            // there's fewer tracks left to shuffle than a full window
            break;
        }

        // pick a random int uniformly from [paste, lastPossibleStartIndex]
        const startIndex =
            Math.floor(Math.random() * (lastPossibleStartIndex - paste + 1)) + paste

        // make request

        paste += window;
    }
}

export const PUT: APIRoute = ({params, request, url}) => {
    if (!url.searchParams.has("snapshot")) {
        const bodyData = {
            errorMessage: "Missing snapshot"
        };
        return new Response(JSON.stringify(bodyData), {
            status: 400
        });
    }
    return new Response();
};
