
import { SP_API_URL } from "../constants";

export type PlaylistData = {
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
};

export type MePlaylistsResponse = {
    total: number,
    items: PlaylistData[]
}

export default {

SpotifyAPIHelper: class {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private makeGetRequest(endpoint: string) {
        const url = SP_API_URL + endpoint;
        return fetch(url, {
            headers: {
                Authorization: `Bearer ${this.token}`
            }
        });
    }

    makeCurrentUserRequest() {
        return this.makeGetRequest("/me");
    }

    makeCurrentUserPlaylistRequest() {
        return this.makeGetRequest("/me/playlists");
    }

    validatePlaylistData(obj: any): obj is PlaylistData {
        const nameC = typeof obj.name === "string";
        const tracksC = obj.tracks &&
            typeof obj.tracks.href === "string" &&
            typeof obj.tracks.total === "number";
        const imagesC = Array.isArray(obj.images);

        if (!(nameC && tracksC && imagesC)) {
            console.log("Playlist data didn't validate");

        }
        return nameC && tracksC && imagesC;
    }

    validateMePlaylistsResponse(data: any): data is MePlaylistsResponse {
        if (!data.items) {
            return false;
        }

        if (typeof data.tracks !== "number") {
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

};