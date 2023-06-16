import * as trpc from "@trpc/server";

//import type { Context } from '../../../context';

import trpcOptions from '../../../trpcOptions';

export const t = trpc.initTRPC.create(trpcOptions);

export const publicProcedure = t.procedure;



