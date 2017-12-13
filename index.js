import sqlize   from './src/library/database/sqlize.js';
import App from './src/app';

let app   = new App(sqlize);
let tasks = [
    //'ClanTask',
    'MemberTask'
];

let data = app
    .run(tasks)
    .then(data => {
        console.log("WE DONE BOIZ");
        process.exit(0);
    })
    .catch(e => {
        console.log(e);
        process.exit(1)
    });
