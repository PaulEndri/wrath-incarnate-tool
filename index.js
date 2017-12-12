import App from './src/app';

let app = new App();

let data = app.run().then(data => {
  console.log(JSON.stringify(data));
});
