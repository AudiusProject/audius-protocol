import { t, publicProcedure } from "./helpers/createRouter";
import { challenge_listen_streakAggregateSchema } from "../schemas/aggregatechallenge_listen_streak.schema";
import { challenge_listen_streakCreateManySchema } from "../schemas/createManychallenge_listen_streak.schema";
import { challenge_listen_streakCreateOneSchema } from "../schemas/createOnechallenge_listen_streak.schema";
import { challenge_listen_streakDeleteManySchema } from "../schemas/deleteManychallenge_listen_streak.schema";
import { challenge_listen_streakDeleteOneSchema } from "../schemas/deleteOnechallenge_listen_streak.schema";
import { challenge_listen_streakFindFirstSchema } from "../schemas/findFirstchallenge_listen_streak.schema";
import { challenge_listen_streakFindManySchema } from "../schemas/findManychallenge_listen_streak.schema";
import { challenge_listen_streakFindUniqueSchema } from "../schemas/findUniquechallenge_listen_streak.schema";
import { challenge_listen_streakGroupBySchema } from "../schemas/groupBychallenge_listen_streak.schema";
import { challenge_listen_streakUpdateManySchema } from "../schemas/updateManychallenge_listen_streak.schema";
import { challenge_listen_streakUpdateOneSchema } from "../schemas/updateOnechallenge_listen_streak.schema";
import { challenge_listen_streakUpsertSchema } from "../schemas/upsertOnechallenge_listen_streak.schema";

export const challenge_listen_streaksRouter = t.router({
  aggregatechallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechallenge_listen_streak = await ctx.prisma.challenge_listen_streak.aggregate(input);
      return aggregatechallenge_listen_streak;
    }),
  createManychallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychallenge_listen_streak = await ctx.prisma.challenge_listen_streak.createMany(input);
      return createManychallenge_listen_streak;
    }),
  createOnechallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechallenge_listen_streak = await ctx.prisma.challenge_listen_streak.create(input);
      return createOnechallenge_listen_streak;
    }),
  deleteManychallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychallenge_listen_streak = await ctx.prisma.challenge_listen_streak.deleteMany(input);
      return deleteManychallenge_listen_streak;
    }),
  deleteOnechallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechallenge_listen_streak = await ctx.prisma.challenge_listen_streak.delete(input);
      return deleteOnechallenge_listen_streak;
    }),
  findFirstchallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallenge_listen_streak = await ctx.prisma.challenge_listen_streak.findFirst(input);
      return findFirstchallenge_listen_streak;
    }),
  findFirstchallenge_listen_streakOrThrow: publicProcedure
    .input(challenge_listen_streakFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallenge_listen_streakOrThrow = await ctx.prisma.challenge_listen_streak.findFirstOrThrow(input);
      return findFirstchallenge_listen_streakOrThrow;
    }),
  findManychallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakFindManySchema).query(async ({ ctx, input }) => {
      const findManychallenge_listen_streak = await ctx.prisma.challenge_listen_streak.findMany(input);
      return findManychallenge_listen_streak;
    }),
  findUniquechallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallenge_listen_streak = await ctx.prisma.challenge_listen_streak.findUnique(input);
      return findUniquechallenge_listen_streak;
    }),
  findUniquechallenge_listen_streakOrThrow: publicProcedure
    .input(challenge_listen_streakFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallenge_listen_streakOrThrow = await ctx.prisma.challenge_listen_streak.findUniqueOrThrow(input);
      return findUniquechallenge_listen_streakOrThrow;
    }),
  groupBychallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychallenge_listen_streak = await ctx.prisma.challenge_listen_streak.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychallenge_listen_streak;
    }),
  updateManychallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychallenge_listen_streak = await ctx.prisma.challenge_listen_streak.updateMany(input);
      return updateManychallenge_listen_streak;
    }),
  updateOnechallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechallenge_listen_streak = await ctx.prisma.challenge_listen_streak.update(input);
      return updateOnechallenge_listen_streak;
    }),
  upsertOnechallenge_listen_streak: publicProcedure
    .input(challenge_listen_streakUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechallenge_listen_streak = await ctx.prisma.challenge_listen_streak.upsert(input);
      return upsertOnechallenge_listen_streak;
    }),

}) 
