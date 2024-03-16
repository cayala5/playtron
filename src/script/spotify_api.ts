import { SP_API_URL } from "../constants";

// TODO: refactor this module to handle validation and error responses and failures
// and more consistently use async/await over promises. Also print helpful stuff in console log
// from what we get back from the API and from what we know in the code
export interface PlaylistData {
    name: string;
    id: string;
    tracks: {
        href: string;
        total: number;
    };
    images: [
        {
            url: string;
        },
    ];
}

export interface MePlaylistsResponse {
    total: number;
    items: PlaylistData[];
}

function getJsonResponseData(response: Response) {
    if (response.status !== 200) {
        throw new Error(`Request failed with code ${response.status}`);
    }

    return response.json();
}
export class SpotifyAPIHelper {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    // TODO: deprecate this and make everyone use handleRequest
    private async makeGetRequest(endpoint: string) {
        const url = SP_API_URL + endpoint;
        console.log("GET request to " + url);
        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });
        return getJsonResponseData(resp);
    }

    private makeGetRequestRaw(endpoint: string) {
        const url = SP_API_URL + endpoint;
        console.log("GET request to " + url);
        return fetch(url, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });
    }

    private async makePutRequest(endpoint: string, body: string) {
        const url = SP_API_URL + endpoint;
        console.log(`PUT request to ${url} -- body: ${body}`);
        return fetch(url, {
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            method: "PUT",
            body,
        });
    }

    private async handleRequest(req: Promise<Response>): Promise<unknown> {
        try {
            const resp = await req;
            const data = await resp.json();
            if (resp.status !== 200) {
                const error = data.error;
                throw new Error(
                    `Request returned error code ${error.status}: "${error.message}"`,
                );
            }
            console.log("RECEIVED data: " + JSON.stringify(data));
            return data;
        } catch (error) {
            console.error("REQUEST FAILED");
            console.error(error);
        }
    }

    async makeCurrentUserRequest() {
        return this.makeGetRequest("/me");
    }

    async makeCurrentUserPlaylistRequest() {
        return this.makeGetRequest("/me/playlists");
    }

    async makeGetPlaylistRequest(playlistId: string, fields?: string[]) {
        let endpoint = "/playlists/" + playlistId;
        if (fields) {
            endpoint += "?fields=" + fields.join(",");
        }
        const req = this.makeGetRequestRaw(endpoint);
        return this.handleRequest(req);
    }

    async makeUpdatePlaylistItemsRequest(
        playlistId: string,
        rangeStart: number,
        insertBefore: number,
        rangeLength: number,
    ) {
        const body = JSON.stringify({
            range_start: rangeStart,
            insert_before: insertBefore,
            range_length: rangeLength,
        });
        const req = this.makePutRequest(
            `/playlists/${playlistId}/tracks`,
            body,
        );
        return this.handleRequest(req);
    }

    // CHRISTIAN TODO: consider a proper validation library for further changes to these functions
    validatePlaylistData(obj: unknown): obj is PlaylistData {
        if (typeof obj !== "object" || obj == null){
            return false;
        }

        if (!("name" in obj) || typeof obj.name !== "string" || !("tracks" in obj) || typeof obj.tracks !== "object"  || obj.tracks == null || !("images" in obj) || typeof obj.images !== "object" || obj.images == null) {
            return false;
        }

        if (!("href" in obj.tracks) || !("total" in obj.tracks)) {
            return false;
        }

        const tracksC =
            obj.tracks &&
            typeof obj.tracks.href === "string" &&
            typeof obj.tracks.total === "number";
        const imagesC = Array.isArray(obj.images);

        return tracksC && imagesC;
    }

    validateMePlaylistsResponse(data: unknown): data is MePlaylistsResponse {
        if (typeof data !== "object" || data == null){
            return false;
        }
        if (!("items" in data)) {
            return false;
        }

        if (!("total" in data) || typeof data.total !== "number") {
            return false;
        }

        if (!Array.isArray(data.items)) {
            return false;
        }

        if (data.items.length > 0) {
            const pl = data.items[0];
            return this.validatePlaylistData(pl);
        } else {
            return true;
        }
    }
}
