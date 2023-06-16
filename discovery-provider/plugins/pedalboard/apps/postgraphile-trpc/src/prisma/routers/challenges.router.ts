import { t, publicProcedure } from "./helpers/createRouter";
import { challengesAggregateSchema } from "../schemas/aggregatechallenges.schema";
import { challengesCreateManySchema } from "../schemas/createManychallenges.schema";
import { challengesCreateOneSchema } from "../schemas/createOnechallenges.schema";
import { challengesDeleteManySchema } from "../schemas/deleteManychallenges.schema";
import { challengesDeleteOneSchema } from "../schemas/deleteOnechallenges.schema";
import { challengesFindFirstSchema } from "../schemas/findFirstchallenges.schema";
import { challengesFindManySchema } from "../schemas/findManychallenges.schema";
import { challengesFindUniqueSchema } from "../schemas/findUniquechallenges.schema";
import { challengesGroupBySchema } from "../schemas/groupBychallenges.schema";
import { challengesUpdateManySchema } from "../schemas/updateManychallenges.schema";
import { challengesUpdateOneSchema } from "../schemas/updateOnechallenges.schema";
import { challengesUpsertSchema } from "../schemas/upsertOnechallenges.schema";

export const challengesRouter = t.router({
  aggregatechallenges: publicProcedure
    .input(challengesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechallenges = await ctx.prisma.challenges.aggregate(input);
      return aggregatechallenges;
    }),
  createManychallenges: publicProcedure
    .input(challengesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychallenges = await ctx.prisma.challenges.createMany(input);
      return createManychallenges;
    }),
  createOnechallenges: publicProcedure
    .input(challengesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechallenges = await ctx.prisma.challenges.create(input);
      return createOnechallenges;
    }),
  deleteManychallenges: publicProcedure
    .input(challengesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychallenges = await ctx.prisma.challenges.deleteMany(input);
      return deleteManychallenges;
    }),
  deleteOnechallenges: publicProcedure
    .input(challengesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechallenges = await ctx.prisma.challenges.delete(input);
      return deleteOnechallenges;
    }),
  findFirstchallenges: publicProcedure
    .input(challengesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallenges = await ctx.prisma.challenges.findFirst(input);
      return findFirstchallenges;
    }),
  findFirstchallengesOrThrow: publicProcedure
    .input(challengesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallengesOrThrow = await ctx.prisma.challenges.findFirstOrThrow(input);
      return findFirstchallengesOrThrow;
    }),
  findManychallenges: publicProcedure
    .input(challengesFindManySchema).query(async ({ ctx, input }) => {
      const findManychallenges = await ctx.prisma.challenges.findMany(input);
      return findManychallenges;
    }),
  findUniquechallenges: publicProcedure
    .input(challengesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallenges = await ctx.prisma.challenges.findUnique(input);
      return findUniquechallenges;
    }),
  findUniquechallengesOrThrow: publicProcedure
    .input(challengesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallengesOrThrow = await ctx.prisma.challenges.findUniqueOrThrow(input);
      return findUniquechallengesOrThrow;
    }),
  groupBychallenges: publicProcedure
    .input(challengesGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychallenges = await ctx.prisma.challenges.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychallenges;
    }),
  updateManychallenges: publicProcedure
    .input(challengesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychallenges = await ctx.prisma.challenges.updateMany(input);
      return updateManychallenges;
    }),
  updateOnechallenges: publicProcedure
    .input(challengesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechallenges = await ctx.prisma.challenges.update(input);
      return updateOnechallenges;
    }),
  upsertOnechallenges: publicProcedure
    .input(challengesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechallenges = await ctx.prisma.challenges.upsert(input);
      return upsertOnechallenges;
    }),

}) 
