'use strict';
import ClanTask from './library/tasks/clans';

export default class App {
  constructor(database) {
    this.db = database;
  }

  run() {
    let task = new ClanTask(this.db);

    return task
      .run()
      .then(r => {
        console.log("EY WE WINNING BOIS");
        process.exit(0);
      })
      .catch(e => {
        console.log(e);
        process.exit(1);
      });
  }
}
