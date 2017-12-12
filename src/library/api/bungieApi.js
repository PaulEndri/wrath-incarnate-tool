import axios from 'axios';

const API_ROOT = "https://www.bungie.net/Platform";
const HEADER   = {
    'X-API-KEY'    : "e5198b48b5504e828e2daefe47cfad5c",
    'Content-Type' : 'application/json'
}

export default class BungieApi {
    static get(route) {
        return new Promise((resolve, reject) => {
            axios({
                baseURL : API_ROOT,
                headers : HEADER,
                url     : route
            })
                .then(response => {
                    resolve(response.data.Response);
                })
                .catch(e => {
                    reject(e);
                })
        })
    }

    static async getAsync(route) {
        let promise = BungieApi.get(route);

        return await promise;
    }
}
