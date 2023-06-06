import dotenv from 'dotenv'
import { main } from "./main";

(async () => {
  dotenv.config()
  await main().catch(console.error);
})();
