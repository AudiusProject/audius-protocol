import { t, publicProcedure } from "./helpers/createRouter";
import { playsAggregateSchema } from "../schemas/aggregateplays.schema";
import { playsCreateManySchema } from "../schemas/createManyplays.schema";
import { playsCreateOneSchema } from "../schemas/createOneplays.schema";
import { playsDeleteManySchema } from "../schemas/deleteManyplays.schema";
import { playsDeleteOneSchema } from "../schemas/deleteOneplays.schema";
import { playsFindFirstSchema } from "../schemas/findFirstplays.schema";
import { playsFindManySchema } from "../schemas/findManyplays.schema";
import { playsFindUniqueSchema } from "../schemas/findUniqueplays.schema";
import { playsGroupBySchema } from "../schemas/groupByplays.schema";
import { playsUpdateManySchema } from "../schemas/updateManyplays.schema";
import { playsUpdateOneSchema } from "../schemas/updateOneplays.schema";
import { playsUpsertSchema } from "../schemas/upsertOneplays.schema";

export const playsRouter = t.router({
  aggregateplays: publicProcedure
    .input(playsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateplays = await ctx.prisma.plays.aggregate(input);
      return aggregateplays;
    }),
  createManyplays: publicProcedure
    .input(playsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyplays = await ctx.prisma.plays.createMany(input);
      return createManyplays;
    }),
  createOneplays: publicProcedure
    .input(playsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneplays = await ctx.prisma.plays.create(input);
      return createOneplays;
    }),
  deleteManyplays: publicProcedure
    .input(playsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyplays = await ctx.prisma.plays.deleteMany(input);
      return deleteManyplays;
    }),
  deleteOneplays: publicProcedure
    .input(playsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneplays = await ctx.prisma.plays.delete(input);
      return deleteOneplays;
    }),
  findFirstplays: publicProcedure
    .input(playsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplays = await ctx.prisma.plays.findFirst(input);
      return findFirstplays;
    }),
  findFirstplaysOrThrow: publicProcedure
    .input(playsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplaysOrThrow = await ctx.prisma.plays.findFirstOrThrow(input);
      return findFirstplaysOrThrow;
    }),
  findManyplays: publicProcedure
    .input(playsFindManySchema).query(async ({ ctx, input }) => {
      const findManyplays = await ctx.prisma.plays.findMany(input);
      return findManyplays;
    }),
  findUniqueplays: publicProcedure
    .input(playsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplays = await ctx.prisma.plays.findUnique(input);
      return findUniqueplays;
    }),
  findUniqueplaysOrThrow: publicProcedure
    .input(playsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplaysOrThrow = await ctx.prisma.plays.findUniqueOrThrow(input);
      return findUniqueplaysOrThrow;
    }),
  groupByplays: publicProcedure
    .input(playsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByplays = await ctx.prisma.plays.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByplays;
    }),
  updateManyplays: publicProcedure
    .input(playsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyplays = await ctx.prisma.plays.updateMany(input);
      return updateManyplays;
    }),
  updateOneplays: publicProcedure
    .input(playsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneplays = await ctx.prisma.plays.update(input);
      return updateOneplays;
    }),
  upsertOneplays: publicProcedure
    .input(playsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneplays = await ctx.prisma.plays.upsert(input);
      return upsertOneplays;
    }),

}) 
