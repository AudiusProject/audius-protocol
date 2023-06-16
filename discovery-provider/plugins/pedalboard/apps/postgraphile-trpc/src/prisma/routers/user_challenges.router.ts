import { t, publicProcedure } from "./helpers/createRouter";
import { user_challengesAggregateSchema } from "../schemas/aggregateuser_challenges.schema";
import { user_challengesCreateManySchema } from "../schemas/createManyuser_challenges.schema";
import { user_challengesCreateOneSchema } from "../schemas/createOneuser_challenges.schema";
import { user_challengesDeleteManySchema } from "../schemas/deleteManyuser_challenges.schema";
import { user_challengesDeleteOneSchema } from "../schemas/deleteOneuser_challenges.schema";
import { user_challengesFindFirstSchema } from "../schemas/findFirstuser_challenges.schema";
import { user_challengesFindManySchema } from "../schemas/findManyuser_challenges.schema";
import { user_challengesFindUniqueSchema } from "../schemas/findUniqueuser_challenges.schema";
import { user_challengesGroupBySchema } from "../schemas/groupByuser_challenges.schema";
import { user_challengesUpdateManySchema } from "../schemas/updateManyuser_challenges.schema";
import { user_challengesUpdateOneSchema } from "../schemas/updateOneuser_challenges.schema";
import { user_challengesUpsertSchema } from "../schemas/upsertOneuser_challenges.schema";

export const user_challengesRouter = t.router({
  aggregateuser_challenges: publicProcedure
    .input(user_challengesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_challenges = await ctx.prisma.user_challenges.aggregate(input);
      return aggregateuser_challenges;
    }),
  createManyuser_challenges: publicProcedure
    .input(user_challengesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_challenges = await ctx.prisma.user_challenges.createMany(input);
      return createManyuser_challenges;
    }),
  createOneuser_challenges: publicProcedure
    .input(user_challengesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_challenges = await ctx.prisma.user_challenges.create(input);
      return createOneuser_challenges;
    }),
  deleteManyuser_challenges: publicProcedure
    .input(user_challengesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_challenges = await ctx.prisma.user_challenges.deleteMany(input);
      return deleteManyuser_challenges;
    }),
  deleteOneuser_challenges: publicProcedure
    .input(user_challengesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_challenges = await ctx.prisma.user_challenges.delete(input);
      return deleteOneuser_challenges;
    }),
  findFirstuser_challenges: publicProcedure
    .input(user_challengesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_challenges = await ctx.prisma.user_challenges.findFirst(input);
      return findFirstuser_challenges;
    }),
  findFirstuser_challengesOrThrow: publicProcedure
    .input(user_challengesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_challengesOrThrow = await ctx.prisma.user_challenges.findFirstOrThrow(input);
      return findFirstuser_challengesOrThrow;
    }),
  findManyuser_challenges: publicProcedure
    .input(user_challengesFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_challenges = await ctx.prisma.user_challenges.findMany(input);
      return findManyuser_challenges;
    }),
  findUniqueuser_challenges: publicProcedure
    .input(user_challengesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_challenges = await ctx.prisma.user_challenges.findUnique(input);
      return findUniqueuser_challenges;
    }),
  findUniqueuser_challengesOrThrow: publicProcedure
    .input(user_challengesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_challengesOrThrow = await ctx.prisma.user_challenges.findUniqueOrThrow(input);
      return findUniqueuser_challengesOrThrow;
    }),
  groupByuser_challenges: publicProcedure
    .input(user_challengesGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_challenges = await ctx.prisma.user_challenges.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_challenges;
    }),
  updateManyuser_challenges: publicProcedure
    .input(user_challengesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_challenges = await ctx.prisma.user_challenges.updateMany(input);
      return updateManyuser_challenges;
    }),
  updateOneuser_challenges: publicProcedure
    .input(user_challengesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_challenges = await ctx.prisma.user_challenges.update(input);
      return updateOneuser_challenges;
    }),
  upsertOneuser_challenges: publicProcedure
    .input(user_challengesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_challenges = await ctx.prisma.user_challenges.upsert(input);
      return upsertOneuser_challenges;
    }),

}) 
