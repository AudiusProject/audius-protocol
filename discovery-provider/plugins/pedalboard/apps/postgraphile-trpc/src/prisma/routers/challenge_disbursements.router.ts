import { t, publicProcedure } from "./helpers/createRouter";
import { challenge_disbursementsAggregateSchema } from "../schemas/aggregatechallenge_disbursements.schema";
import { challenge_disbursementsCreateManySchema } from "../schemas/createManychallenge_disbursements.schema";
import { challenge_disbursementsCreateOneSchema } from "../schemas/createOnechallenge_disbursements.schema";
import { challenge_disbursementsDeleteManySchema } from "../schemas/deleteManychallenge_disbursements.schema";
import { challenge_disbursementsDeleteOneSchema } from "../schemas/deleteOnechallenge_disbursements.schema";
import { challenge_disbursementsFindFirstSchema } from "../schemas/findFirstchallenge_disbursements.schema";
import { challenge_disbursementsFindManySchema } from "../schemas/findManychallenge_disbursements.schema";
import { challenge_disbursementsFindUniqueSchema } from "../schemas/findUniquechallenge_disbursements.schema";
import { challenge_disbursementsGroupBySchema } from "../schemas/groupBychallenge_disbursements.schema";
import { challenge_disbursementsUpdateManySchema } from "../schemas/updateManychallenge_disbursements.schema";
import { challenge_disbursementsUpdateOneSchema } from "../schemas/updateOnechallenge_disbursements.schema";
import { challenge_disbursementsUpsertSchema } from "../schemas/upsertOnechallenge_disbursements.schema";

export const challenge_disbursementsRouter = t.router({
  aggregatechallenge_disbursements: publicProcedure
    .input(challenge_disbursementsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechallenge_disbursements = await ctx.prisma.challenge_disbursements.aggregate(input);
      return aggregatechallenge_disbursements;
    }),
  createManychallenge_disbursements: publicProcedure
    .input(challenge_disbursementsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychallenge_disbursements = await ctx.prisma.challenge_disbursements.createMany(input);
      return createManychallenge_disbursements;
    }),
  createOnechallenge_disbursements: publicProcedure
    .input(challenge_disbursementsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechallenge_disbursements = await ctx.prisma.challenge_disbursements.create(input);
      return createOnechallenge_disbursements;
    }),
  deleteManychallenge_disbursements: publicProcedure
    .input(challenge_disbursementsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychallenge_disbursements = await ctx.prisma.challenge_disbursements.deleteMany(input);
      return deleteManychallenge_disbursements;
    }),
  deleteOnechallenge_disbursements: publicProcedure
    .input(challenge_disbursementsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechallenge_disbursements = await ctx.prisma.challenge_disbursements.delete(input);
      return deleteOnechallenge_disbursements;
    }),
  findFirstchallenge_disbursements: publicProcedure
    .input(challenge_disbursementsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallenge_disbursements = await ctx.prisma.challenge_disbursements.findFirst(input);
      return findFirstchallenge_disbursements;
    }),
  findFirstchallenge_disbursementsOrThrow: publicProcedure
    .input(challenge_disbursementsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchallenge_disbursementsOrThrow = await ctx.prisma.challenge_disbursements.findFirstOrThrow(input);
      return findFirstchallenge_disbursementsOrThrow;
    }),
  findManychallenge_disbursements: publicProcedure
    .input(challenge_disbursementsFindManySchema).query(async ({ ctx, input }) => {
      const findManychallenge_disbursements = await ctx.prisma.challenge_disbursements.findMany(input);
      return findManychallenge_disbursements;
    }),
  findUniquechallenge_disbursements: publicProcedure
    .input(challenge_disbursementsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallenge_disbursements = await ctx.prisma.challenge_disbursements.findUnique(input);
      return findUniquechallenge_disbursements;
    }),
  findUniquechallenge_disbursementsOrThrow: publicProcedure
    .input(challenge_disbursementsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechallenge_disbursementsOrThrow = await ctx.prisma.challenge_disbursements.findUniqueOrThrow(input);
      return findUniquechallenge_disbursementsOrThrow;
    }),
  groupBychallenge_disbursements: publicProcedure
    .input(challenge_disbursementsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychallenge_disbursements = await ctx.prisma.challenge_disbursements.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychallenge_disbursements;
    }),
  updateManychallenge_disbursements: publicProcedure
    .input(challenge_disbursementsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychallenge_disbursements = await ctx.prisma.challenge_disbursements.updateMany(input);
      return updateManychallenge_disbursements;
    }),
  updateOnechallenge_disbursements: publicProcedure
    .input(challenge_disbursementsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechallenge_disbursements = await ctx.prisma.challenge_disbursements.update(input);
      return updateOnechallenge_disbursements;
    }),
  upsertOnechallenge_disbursements: publicProcedure
    .input(challenge_disbursementsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechallenge_disbursements = await ctx.prisma.challenge_disbursements.upsert(input);
      return upsertOnechallenge_disbursements;
    }),

}) 
