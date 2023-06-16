import { t, publicProcedure } from "./helpers/createRouter";
import { spl_token_txAggregateSchema } from "../schemas/aggregatespl_token_tx.schema";
import { spl_token_txCreateManySchema } from "../schemas/createManyspl_token_tx.schema";
import { spl_token_txCreateOneSchema } from "../schemas/createOnespl_token_tx.schema";
import { spl_token_txDeleteManySchema } from "../schemas/deleteManyspl_token_tx.schema";
import { spl_token_txDeleteOneSchema } from "../schemas/deleteOnespl_token_tx.schema";
import { spl_token_txFindFirstSchema } from "../schemas/findFirstspl_token_tx.schema";
import { spl_token_txFindManySchema } from "../schemas/findManyspl_token_tx.schema";
import { spl_token_txFindUniqueSchema } from "../schemas/findUniquespl_token_tx.schema";
import { spl_token_txGroupBySchema } from "../schemas/groupByspl_token_tx.schema";
import { spl_token_txUpdateManySchema } from "../schemas/updateManyspl_token_tx.schema";
import { spl_token_txUpdateOneSchema } from "../schemas/updateOnespl_token_tx.schema";
import { spl_token_txUpsertSchema } from "../schemas/upsertOnespl_token_tx.schema";

export const spl_token_txesRouter = t.router({
  aggregatespl_token_tx: publicProcedure
    .input(spl_token_txAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatespl_token_tx = await ctx.prisma.spl_token_tx.aggregate(input);
      return aggregatespl_token_tx;
    }),
  createManyspl_token_tx: publicProcedure
    .input(spl_token_txCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyspl_token_tx = await ctx.prisma.spl_token_tx.createMany(input);
      return createManyspl_token_tx;
    }),
  createOnespl_token_tx: publicProcedure
    .input(spl_token_txCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnespl_token_tx = await ctx.prisma.spl_token_tx.create(input);
      return createOnespl_token_tx;
    }),
  deleteManyspl_token_tx: publicProcedure
    .input(spl_token_txDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyspl_token_tx = await ctx.prisma.spl_token_tx.deleteMany(input);
      return deleteManyspl_token_tx;
    }),
  deleteOnespl_token_tx: publicProcedure
    .input(spl_token_txDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnespl_token_tx = await ctx.prisma.spl_token_tx.delete(input);
      return deleteOnespl_token_tx;
    }),
  findFirstspl_token_tx: publicProcedure
    .input(spl_token_txFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstspl_token_tx = await ctx.prisma.spl_token_tx.findFirst(input);
      return findFirstspl_token_tx;
    }),
  findFirstspl_token_txOrThrow: publicProcedure
    .input(spl_token_txFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstspl_token_txOrThrow = await ctx.prisma.spl_token_tx.findFirstOrThrow(input);
      return findFirstspl_token_txOrThrow;
    }),
  findManyspl_token_tx: publicProcedure
    .input(spl_token_txFindManySchema).query(async ({ ctx, input }) => {
      const findManyspl_token_tx = await ctx.prisma.spl_token_tx.findMany(input);
      return findManyspl_token_tx;
    }),
  findUniquespl_token_tx: publicProcedure
    .input(spl_token_txFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquespl_token_tx = await ctx.prisma.spl_token_tx.findUnique(input);
      return findUniquespl_token_tx;
    }),
  findUniquespl_token_txOrThrow: publicProcedure
    .input(spl_token_txFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquespl_token_txOrThrow = await ctx.prisma.spl_token_tx.findUniqueOrThrow(input);
      return findUniquespl_token_txOrThrow;
    }),
  groupByspl_token_tx: publicProcedure
    .input(spl_token_txGroupBySchema).query(async ({ ctx, input }) => {
      const groupByspl_token_tx = await ctx.prisma.spl_token_tx.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByspl_token_tx;
    }),
  updateManyspl_token_tx: publicProcedure
    .input(spl_token_txUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyspl_token_tx = await ctx.prisma.spl_token_tx.updateMany(input);
      return updateManyspl_token_tx;
    }),
  updateOnespl_token_tx: publicProcedure
    .input(spl_token_txUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnespl_token_tx = await ctx.prisma.spl_token_tx.update(input);
      return updateOnespl_token_tx;
    }),
  upsertOnespl_token_tx: publicProcedure
    .input(spl_token_txUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnespl_token_tx = await ctx.prisma.spl_token_tx.upsert(input);
      return upsertOnespl_token_tx;
    }),

}) 
