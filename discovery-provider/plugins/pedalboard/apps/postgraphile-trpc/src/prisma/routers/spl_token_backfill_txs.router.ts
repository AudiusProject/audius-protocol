import { t, publicProcedure } from "./helpers/createRouter";
import { spl_token_backfill_txsAggregateSchema } from "../schemas/aggregatespl_token_backfill_txs.schema";
import { spl_token_backfill_txsCreateManySchema } from "../schemas/createManyspl_token_backfill_txs.schema";
import { spl_token_backfill_txsCreateOneSchema } from "../schemas/createOnespl_token_backfill_txs.schema";
import { spl_token_backfill_txsDeleteManySchema } from "../schemas/deleteManyspl_token_backfill_txs.schema";
import { spl_token_backfill_txsDeleteOneSchema } from "../schemas/deleteOnespl_token_backfill_txs.schema";
import { spl_token_backfill_txsFindFirstSchema } from "../schemas/findFirstspl_token_backfill_txs.schema";
import { spl_token_backfill_txsFindManySchema } from "../schemas/findManyspl_token_backfill_txs.schema";
import { spl_token_backfill_txsFindUniqueSchema } from "../schemas/findUniquespl_token_backfill_txs.schema";
import { spl_token_backfill_txsGroupBySchema } from "../schemas/groupByspl_token_backfill_txs.schema";
import { spl_token_backfill_txsUpdateManySchema } from "../schemas/updateManyspl_token_backfill_txs.schema";
import { spl_token_backfill_txsUpdateOneSchema } from "../schemas/updateOnespl_token_backfill_txs.schema";
import { spl_token_backfill_txsUpsertSchema } from "../schemas/upsertOnespl_token_backfill_txs.schema";

export const spl_token_backfill_txsRouter = t.router({
  aggregatespl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatespl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.aggregate(input);
      return aggregatespl_token_backfill_txs;
    }),
  createManyspl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyspl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.createMany(input);
      return createManyspl_token_backfill_txs;
    }),
  createOnespl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnespl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.create(input);
      return createOnespl_token_backfill_txs;
    }),
  deleteManyspl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyspl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.deleteMany(input);
      return deleteManyspl_token_backfill_txs;
    }),
  deleteOnespl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnespl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.delete(input);
      return deleteOnespl_token_backfill_txs;
    }),
  findFirstspl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstspl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.findFirst(input);
      return findFirstspl_token_backfill_txs;
    }),
  findFirstspl_token_backfill_txsOrThrow: publicProcedure
    .input(spl_token_backfill_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstspl_token_backfill_txsOrThrow = await ctx.prisma.spl_token_backfill_txs.findFirstOrThrow(input);
      return findFirstspl_token_backfill_txsOrThrow;
    }),
  findManyspl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsFindManySchema).query(async ({ ctx, input }) => {
      const findManyspl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.findMany(input);
      return findManyspl_token_backfill_txs;
    }),
  findUniquespl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquespl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.findUnique(input);
      return findUniquespl_token_backfill_txs;
    }),
  findUniquespl_token_backfill_txsOrThrow: publicProcedure
    .input(spl_token_backfill_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquespl_token_backfill_txsOrThrow = await ctx.prisma.spl_token_backfill_txs.findUniqueOrThrow(input);
      return findUniquespl_token_backfill_txsOrThrow;
    }),
  groupByspl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByspl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByspl_token_backfill_txs;
    }),
  updateManyspl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyspl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.updateMany(input);
      return updateManyspl_token_backfill_txs;
    }),
  updateOnespl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnespl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.update(input);
      return updateOnespl_token_backfill_txs;
    }),
  upsertOnespl_token_backfill_txs: publicProcedure
    .input(spl_token_backfill_txsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnespl_token_backfill_txs = await ctx.prisma.spl_token_backfill_txs.upsert(input);
      return upsertOnespl_token_backfill_txs;
    }),

}) 
