'use strict';
import Https from 'https';
import clanList from './data/clans';
import Clan from './library/clan/clan';

export default class App {
  run() {
    return new Promise(async (resolve, reject) => {
      let id   = clanList[0];
      let clan = new Clan(id);
      let data = await clan.getData();

      resolve(data);
    });
  }
}
