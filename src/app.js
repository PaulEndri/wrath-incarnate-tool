'use strict';
import ClanTask from './library/tasks/clans';
import MemberTask from './library/tasks/members';

export default class App {
  constructor(database) {
    this.db    = database;
    this.tasks = {
        ClanTask   : ClanTask,
        MemberTask : MemberTask 
    };
  }

  run(types) {
      let tasks = [];

      for(var type of types) {
          if(this.tasks[type] !== undefined && this.tasks[type] !== null) {
              tasks.push(new this.tasks[type](this.db).run());
          }
      }
      return Promise.all(tasks);
  }
}