/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';
import { z } from 'zod';
import App from "basekit/src/app";
import moment from "moment";

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  greeting: publicProcedure
    // This is the input schema of your procedure
    // 💡 Tip: Try changing this and see type errors on the client straight away
    .input(
      z
        .object({
          name: z.string().nullish(),
        })
        .nullish(),
    )
    .query(({ input }) => {
      // This is what you're returning to your client
      return {
        text: `hello ${input?.name ?? 'world'}`,
        // 💡 Tip: Try adding a new property here and see it propagate to the client straight-away
      };
    }),
  userFollowersList: publicProcedure.input(z.number())
    .query((userId) => {
      return {
        userId
      }
    }),
});

// export only the type definition of the API
// None of the actual implementation is exposed to the client
export type AppRouter = typeof appRouter;

// create server
createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext() {
    console.log('context 3');
    return {};
  },
}).listen(2022);

// type SharedData = {};

// const main = async () => {
//   createHTTPServer({
//     middleware: cors(),
//     router: appRouter,
//     createContext() {
//       console.log('context 3');
//       return {};
//     },
//   }).listen(2022);

//   await new App<SharedData>({})
//     .tick({ seconds: 5 }, async (_app) => {
//       console.log(`tick ${moment().calendar()}`);
//     })
//     .run();
// };

// (async () => {
//   await main();
// })();
