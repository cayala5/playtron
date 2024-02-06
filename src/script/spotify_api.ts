
import { SP_API_URL } from "../constants";

// CHRISTIAN TODO: refactor this module to handle validation and error responses and failures
// and more consistently use async/await over promises. Also print helpful stuff in console log
// from what we get back from the API and from what we know in the code
export interface PlaylistData {
    name: string,
    tracks: {
        href: string,
        total: number
    },
    images: [
        {
            url: string
        }
    ]
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

    private async makeGetRequest(endpoint: string) {
        const url = SP_API_URL + endpoint;
        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.token}`
            }
        });
        return getJsonResponseData(resp);
    }
    
    private async makePutRequest(endpoint: string, body: string) {
        const url = SP_API_URL + endpoint;
        console.error("CHRISTIAN: body is " + body);
        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json"
            },
            method: "PUT",
            body
        });
        return getJsonResponseData(resp);
    }

    makeCurrentUserRequest() {
        return this.makeGetRequest("/me");
    }

    makeCurrentUserPlaylistRequest() {
        return this.makeGetRequest("/me/playlists");
    }

    makeUpdatePlaylistItemsRequest(playlistId: string, rangeStart: number, insertBefore: number, rangeLength: number, snapshotId: string) {
        const body = JSON.stringify({
            range_start: rangeStart,
            insert_before: insertBefore,
            range_length: rangeLength,
            snapshot_id: snapshotId
        });
        return this.makePutRequest(`/playlists/${playlistId}/tracks`, body);
    }

    validatePlaylistData(obj: any): obj is PlaylistData {
        const nameC = typeof obj.name === "string";
        const tracksC = obj.tracks &&
            typeof obj.tracks.href === "string" &&
            typeof obj.tracks.total === "number";
        const imagesC = Array.isArray(obj.images);

        return nameC && tracksC && imagesC;
    }

    validateMePlaylistsResponse(data: any): data is MePlaylistsResponse {
        if (!data.items) {
            return false;
        }

        if (typeof data.total !== "number") {
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
