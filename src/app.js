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
        return new Promise((resolve, reject) => {
            let chain = false;
            
            for(var type of types) {
                if(this.tasks[type] !== undefined && this.tasks[type] !== null) {
                    let task = new this.tasks[type](this.db);
    
                    if(chain === false) {
                        chain = task.run();
                        continue;
                    }
    
                    chain
                        .then(() => task.run());
                }
            }

            chain
                .then(() => resolve())
                .catch(e => reject(e));
        });
    }
}