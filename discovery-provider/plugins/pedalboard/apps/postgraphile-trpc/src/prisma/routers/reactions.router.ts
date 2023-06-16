import { t, publicProcedure } from "./helpers/createRouter";
import { reactionsAggregateSchema } from "../schemas/aggregatereactions.schema";
import { reactionsCreateManySchema } from "../schemas/createManyreactions.schema";
import { reactionsCreateOneSchema } from "../schemas/createOnereactions.schema";
import { reactionsDeleteManySchema } from "../schemas/deleteManyreactions.schema";
import { reactionsDeleteOneSchema } from "../schemas/deleteOnereactions.schema";
import { reactionsFindFirstSchema } from "../schemas/findFirstreactions.schema";
import { reactionsFindManySchema } from "../schemas/findManyreactions.schema";
import { reactionsFindUniqueSchema } from "../schemas/findUniquereactions.schema";
import { reactionsGroupBySchema } from "../schemas/groupByreactions.schema";
import { reactionsUpdateManySchema } from "../schemas/updateManyreactions.schema";
import { reactionsUpdateOneSchema } from "../schemas/updateOnereactions.schema";
import { reactionsUpsertSchema } from "../schemas/upsertOnereactions.schema";

export const reactionsRouter = t.router({
  aggregatereactions: publicProcedure
    .input(reactionsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatereactions = await ctx.prisma.reactions.aggregate(input);
      return aggregatereactions;
    }),
  createManyreactions: publicProcedure
    .input(reactionsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyreactions = await ctx.prisma.reactions.createMany(input);
      return createManyreactions;
    }),
  createOnereactions: publicProcedure
    .input(reactionsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnereactions = await ctx.prisma.reactions.create(input);
      return createOnereactions;
    }),
  deleteManyreactions: publicProcedure
    .input(reactionsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyreactions = await ctx.prisma.reactions.deleteMany(input);
      return deleteManyreactions;
    }),
  deleteOnereactions: publicProcedure
    .input(reactionsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnereactions = await ctx.prisma.reactions.delete(input);
      return deleteOnereactions;
    }),
  findFirstreactions: publicProcedure
    .input(reactionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstreactions = await ctx.prisma.reactions.findFirst(input);
      return findFirstreactions;
    }),
  findFirstreactionsOrThrow: publicProcedure
    .input(reactionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstreactionsOrThrow = await ctx.prisma.reactions.findFirstOrThrow(input);
      return findFirstreactionsOrThrow;
    }),
  findManyreactions: publicProcedure
    .input(reactionsFindManySchema).query(async ({ ctx, input }) => {
      const findManyreactions = await ctx.prisma.reactions.findMany(input);
      return findManyreactions;
    }),
  findUniquereactions: publicProcedure
    .input(reactionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquereactions = await ctx.prisma.reactions.findUnique(input);
      return findUniquereactions;
    }),
  findUniquereactionsOrThrow: publicProcedure
    .input(reactionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquereactionsOrThrow = await ctx.prisma.reactions.findUniqueOrThrow(input);
      return findUniquereactionsOrThrow;
    }),
  groupByreactions: publicProcedure
    .input(reactionsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByreactions = await ctx.prisma.reactions.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByreactions;
    }),
  updateManyreactions: publicProcedure
    .input(reactionsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyreactions = await ctx.prisma.reactions.updateMany(input);
      return updateManyreactions;
    }),
  updateOnereactions: publicProcedure
    .input(reactionsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnereactions = await ctx.prisma.reactions.update(input);
      return updateOnereactions;
    }),
  upsertOnereactions: publicProcedure
    .input(reactionsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnereactions = await ctx.prisma.reactions.upsert(input);
      return upsertOnereactions;
    }),

}) 
