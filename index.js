import sqlize   from './src/library/database/sqlize.js';
import App from './src/app';


let app = new App(sqlize);

let data = app.run().then(data => {
  console.log(JSON.stringify(data));
});
