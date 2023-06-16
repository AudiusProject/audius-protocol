import { t, publicProcedure } from "./helpers/createRouter";
import { followsAggregateSchema } from "../schemas/aggregatefollows.schema";
import { followsCreateManySchema } from "../schemas/createManyfollows.schema";
import { followsCreateOneSchema } from "../schemas/createOnefollows.schema";
import { followsDeleteManySchema } from "../schemas/deleteManyfollows.schema";
import { followsDeleteOneSchema } from "../schemas/deleteOnefollows.schema";
import { followsFindFirstSchema } from "../schemas/findFirstfollows.schema";
import { followsFindManySchema } from "../schemas/findManyfollows.schema";
import { followsFindUniqueSchema } from "../schemas/findUniquefollows.schema";
import { followsGroupBySchema } from "../schemas/groupByfollows.schema";
import { followsUpdateManySchema } from "../schemas/updateManyfollows.schema";
import { followsUpdateOneSchema } from "../schemas/updateOnefollows.schema";
import { followsUpsertSchema } from "../schemas/upsertOnefollows.schema";

export const followsRouter = t.router({
  aggregatefollows: publicProcedure
    .input(followsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatefollows = await ctx.prisma.follows.aggregate(input);
      return aggregatefollows;
    }),
  createManyfollows: publicProcedure
    .input(followsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyfollows = await ctx.prisma.follows.createMany(input);
      return createManyfollows;
    }),
  createOnefollows: publicProcedure
    .input(followsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnefollows = await ctx.prisma.follows.create(input);
      return createOnefollows;
    }),
  deleteManyfollows: publicProcedure
    .input(followsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyfollows = await ctx.prisma.follows.deleteMany(input);
      return deleteManyfollows;
    }),
  deleteOnefollows: publicProcedure
    .input(followsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnefollows = await ctx.prisma.follows.delete(input);
      return deleteOnefollows;
    }),
  findFirstfollows: publicProcedure
    .input(followsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstfollows = await ctx.prisma.follows.findFirst(input);
      return findFirstfollows;
    }),
  findFirstfollowsOrThrow: publicProcedure
    .input(followsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstfollowsOrThrow = await ctx.prisma.follows.findFirstOrThrow(input);
      return findFirstfollowsOrThrow;
    }),
  findManyfollows: publicProcedure
    .input(followsFindManySchema).query(async ({ ctx, input }) => {
      const findManyfollows = await ctx.prisma.follows.findMany(input);
      return findManyfollows;
    }),
  findUniquefollows: publicProcedure
    .input(followsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquefollows = await ctx.prisma.follows.findUnique(input);
      return findUniquefollows;
    }),
  findUniquefollowsOrThrow: publicProcedure
    .input(followsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquefollowsOrThrow = await ctx.prisma.follows.findUniqueOrThrow(input);
      return findUniquefollowsOrThrow;
    }),
  groupByfollows: publicProcedure
    .input(followsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByfollows = await ctx.prisma.follows.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByfollows;
    }),
  updateManyfollows: publicProcedure
    .input(followsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyfollows = await ctx.prisma.follows.updateMany(input);
      return updateManyfollows;
    }),
  updateOnefollows: publicProcedure
    .input(followsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnefollows = await ctx.prisma.follows.update(input);
      return updateOnefollows;
    }),
  upsertOnefollows: publicProcedure
    .input(followsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnefollows = await ctx.prisma.follows.upsert(input);
      return upsertOnefollows;
    }),

}) 
