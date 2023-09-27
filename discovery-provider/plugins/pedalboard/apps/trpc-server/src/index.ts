import { app } from './server';


const main = async () => {
  const port = 2022
  app.listen(port, () => {
    console.log('listening on ', port)
  })

};

(async () => {
  await main();
})();
