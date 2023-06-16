import { t, publicProcedure } from "./helpers/createRouter";
import { repostsAggregateSchema } from "../schemas/aggregatereposts.schema";
import { repostsCreateManySchema } from "../schemas/createManyreposts.schema";
import { repostsCreateOneSchema } from "../schemas/createOnereposts.schema";
import { repostsDeleteManySchema } from "../schemas/deleteManyreposts.schema";
import { repostsDeleteOneSchema } from "../schemas/deleteOnereposts.schema";
import { repostsFindFirstSchema } from "../schemas/findFirstreposts.schema";
import { repostsFindManySchema } from "../schemas/findManyreposts.schema";
import { repostsFindUniqueSchema } from "../schemas/findUniquereposts.schema";
import { repostsGroupBySchema } from "../schemas/groupByreposts.schema";
import { repostsUpdateManySchema } from "../schemas/updateManyreposts.schema";
import { repostsUpdateOneSchema } from "../schemas/updateOnereposts.schema";
import { repostsUpsertSchema } from "../schemas/upsertOnereposts.schema";

export const repostsRouter = t.router({
  aggregatereposts: publicProcedure
    .input(repostsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatereposts = await ctx.prisma.reposts.aggregate(input);
      return aggregatereposts;
    }),
  createManyreposts: publicProcedure
    .input(repostsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyreposts = await ctx.prisma.reposts.createMany(input);
      return createManyreposts;
    }),
  createOnereposts: publicProcedure
    .input(repostsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnereposts = await ctx.prisma.reposts.create(input);
      return createOnereposts;
    }),
  deleteManyreposts: publicProcedure
    .input(repostsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyreposts = await ctx.prisma.reposts.deleteMany(input);
      return deleteManyreposts;
    }),
  deleteOnereposts: publicProcedure
    .input(repostsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnereposts = await ctx.prisma.reposts.delete(input);
      return deleteOnereposts;
    }),
  findFirstreposts: publicProcedure
    .input(repostsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstreposts = await ctx.prisma.reposts.findFirst(input);
      return findFirstreposts;
    }),
  findFirstrepostsOrThrow: publicProcedure
    .input(repostsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrepostsOrThrow = await ctx.prisma.reposts.findFirstOrThrow(input);
      return findFirstrepostsOrThrow;
    }),
  findManyreposts: publicProcedure
    .input(repostsFindManySchema).query(async ({ ctx, input }) => {
      const findManyreposts = await ctx.prisma.reposts.findMany(input);
      return findManyreposts;
    }),
  findUniquereposts: publicProcedure
    .input(repostsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquereposts = await ctx.prisma.reposts.findUnique(input);
      return findUniquereposts;
    }),
  findUniquerepostsOrThrow: publicProcedure
    .input(repostsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerepostsOrThrow = await ctx.prisma.reposts.findUniqueOrThrow(input);
      return findUniquerepostsOrThrow;
    }),
  groupByreposts: publicProcedure
    .input(repostsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByreposts = await ctx.prisma.reposts.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByreposts;
    }),
  updateManyreposts: publicProcedure
    .input(repostsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyreposts = await ctx.prisma.reposts.updateMany(input);
      return updateManyreposts;
    }),
  updateOnereposts: publicProcedure
    .input(repostsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnereposts = await ctx.prisma.reposts.update(input);
      return updateOnereposts;
    }),
  upsertOnereposts: publicProcedure
    .input(repostsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnereposts = await ctx.prisma.reposts.upsert(input);
      return upsertOnereposts;
    }),

}) 
