import axios from 'axios';
import dotenv from 'dotenv';

const env = dotenv.config();
const API_ROOT = "https://www.bungie.net/Platform";
const HEADER   = {
    'X-API-KEY'    : env.parsed.BUNGIE_API_KEY,
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
                    if(response.data.Message !== "Ok") {
                       // console.log(response.data);
                    }
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
