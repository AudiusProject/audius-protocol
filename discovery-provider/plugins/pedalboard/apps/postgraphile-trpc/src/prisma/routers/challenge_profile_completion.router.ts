import { t, publicProcedure } from "./helpers/createRouter";
import { challenge_profile_completionAggregateSchema } from "../schemas/aggregatechallenge_profile_completion.schema";
import { challenge_profile_completionCreateManySchema } from "../schemas/createManychallenge_profile_completion.schema";
import { challenge_profile_completionCreateOneSchema } from "../schemas/createOnechallenge_profile_completion.schema";
import { challenge_profile_completionDeleteManySchema } from "../schemas/deleteManychallenge_profile_completion.schema";
import { challenge_profile_completionDeleteOneSchema } from "../schemas/deleteOnechallenge_profile_completion.schema";
import { challenge_profile_completionFindFirstSchema } from "../schemas/findFirstchallenge_profile_completion.schema";
import { challenge_profile_completionFindManySchema } from "../schemas/findManychallenge_profile_completion.schema";
import { challenge_profile_completionFindUniqueSchema } from "../schemas/findUniquechallenge_profile_completion.schema";
import { challenge_profile_completionGroupBySchema } from "../schemas/groupBychallenge_profile_completion.schema";
import { challenge_profile_completionUpdateManySchema } from "../schemas/updateManychallenge_profile_completion.schema";
import { challenge_profile_completionUpdateOneSchema } from "../schemas/updateOnechallenge_profile_completion.schema";
import { challenge_profile_completionUpsertSchema } from "../schemas/upsertOnechallenge_profile_completion.schema";

export const challenge_profile_completionsRouter = t.router({
  aggregatechallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechallenge_profile_completion = await ctx.prisma.challenge_profile_completion.aggregate(input);
      return aggregatechallenge_profile_completion;
    }),
  createManychallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychallenge_profile_completion = await ctx.prisma.challenge_profile_completion.createMany(input);
      return createManychallenge_profile_completion;
    }),
  createOnechallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechallenge_profile_completion = await ctx.prisma.challenge_profile_completion.create(input);
      return createOnechallenge_profile_completion;
    }),
  deleteManychallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychallenge_profile_completion = await ctx.prisma.challenge_profile_completion.deleteMany(input);
      return deleteManychallenge_profile_completion;
    }),
  deleteOnechallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechallenge_profile_completion = await ctx.prisma.challenge_profile_completion.delete(input);
      return deleteOnechallenge_profile_completion;
    }),
  findFirstchallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallenge_profile_completion = await ctx.prisma.challenge_profile_completion.findFirst(input);
      return findFirstchallenge_profile_completion;
    }),
  findFirstchallenge_profile_completionOrThrow: publicProcedure
    .input(challenge_profile_completionFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallenge_profile_completionOrThrow = await ctx.prisma.challenge_profile_completion.findFirstOrThrow(input);
      return findFirstchallenge_profile_completionOrThrow;
    }),
  findManychallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionFindManySchema).query(async ({ ctx, input }) => {
      const findManychallenge_profile_completion = await ctx.prisma.challenge_profile_completion.findMany(input);
      return findManychallenge_profile_completion;
    }),
  findUniquechallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallenge_profile_completion = await ctx.prisma.challenge_profile_completion.findUnique(input);
      return findUniquechallenge_profile_completion;
    }),
  findUniquechallenge_profile_completionOrThrow: publicProcedure
    .input(challenge_profile_completionFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallenge_profile_completionOrThrow = await ctx.prisma.challenge_profile_completion.findUniqueOrThrow(input);
      return findUniquechallenge_profile_completionOrThrow;
    }),
  groupBychallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychallenge_profile_completion = await ctx.prisma.challenge_profile_completion.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychallenge_profile_completion;
    }),
  updateManychallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychallenge_profile_completion = await ctx.prisma.challenge_profile_completion.updateMany(input);
      return updateManychallenge_profile_completion;
    }),
  updateOnechallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechallenge_profile_completion = await ctx.prisma.challenge_profile_completion.update(input);
      return updateOnechallenge_profile_completion;
    }),
  upsertOnechallenge_profile_completion: publicProcedure
    .input(challenge_profile_completionUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechallenge_profile_completion = await ctx.prisma.challenge_profile_completion.upsert(input);
      return upsertOnechallenge_profile_completion;
    }),

}) 
