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
- get action
- get
 */

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
