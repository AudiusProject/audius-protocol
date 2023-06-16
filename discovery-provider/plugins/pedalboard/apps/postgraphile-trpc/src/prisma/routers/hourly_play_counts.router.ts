import { t, publicProcedure } from "./helpers/createRouter";
import { hourly_play_countsAggregateSchema } from "../schemas/aggregatehourly_play_counts.schema";
import { hourly_play_countsCreateManySchema } from "../schemas/createManyhourly_play_counts.schema";
import { hourly_play_countsCreateOneSchema } from "../schemas/createOnehourly_play_counts.schema";
import { hourly_play_countsDeleteManySchema } from "../schemas/deleteManyhourly_play_counts.schema";
import { hourly_play_countsDeleteOneSchema } from "../schemas/deleteOnehourly_play_counts.schema";
import { hourly_play_countsFindFirstSchema } from "../schemas/findFirsthourly_play_counts.schema";
import { hourly_play_countsFindManySchema } from "../schemas/findManyhourly_play_counts.schema";
import { hourly_play_countsFindUniqueSchema } from "../schemas/findUniquehourly_play_counts.schema";
import { hourly_play_countsGroupBySchema } from "../schemas/groupByhourly_play_counts.schema";
import { hourly_play_countsUpdateManySchema } from "../schemas/updateManyhourly_play_counts.schema";
import { hourly_play_countsUpdateOneSchema } from "../schemas/updateOnehourly_play_counts.schema";
import { hourly_play_countsUpsertSchema } from "../schemas/upsertOnehourly_play_counts.schema";

export const hourly_play_countsRouter = t.router({
  aggregatehourly_play_counts: publicProcedure
    .input(hourly_play_countsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatehourly_play_counts = await ctx.prisma.hourly_play_counts.aggregate(input);
      return aggregatehourly_play_counts;
    }),
  createManyhourly_play_counts: publicProcedure
    .input(hourly_play_countsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyhourly_play_counts = await ctx.prisma.hourly_play_counts.createMany(input);
      return createManyhourly_play_counts;
    }),
  createOnehourly_play_counts: publicProcedure
    .input(hourly_play_countsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnehourly_play_counts = await ctx.prisma.hourly_play_counts.create(input);
      return createOnehourly_play_counts;
    }),
  deleteManyhourly_play_counts: publicProcedure
    .input(hourly_play_countsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyhourly_play_counts = await ctx.prisma.hourly_play_counts.deleteMany(input);
      return deleteManyhourly_play_counts;
    }),
  deleteOnehourly_play_counts: publicProcedure
    .input(hourly_play_countsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnehourly_play_counts = await ctx.prisma.hourly_play_counts.delete(input);
      return deleteOnehourly_play_counts;
    }),
  findFirsthourly_play_counts: publicProcedure
    .input(hourly_play_countsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsthourly_play_counts = await ctx.prisma.hourly_play_counts.findFirst(input);
      return findFirsthourly_play_counts;
    }),
  findFirsthourly_play_countsOrThrow: publicProcedure
    .input(hourly_play_countsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsthourly_play_countsOrThrow = await ctx.prisma.hourly_play_counts.findFirstOrThrow(input);
      return findFirsthourly_play_countsOrThrow;
    }),
  findManyhourly_play_counts: publicProcedure
    .input(hourly_play_countsFindManySchema).query(async ({ ctx, input }) => {
      const findManyhourly_play_counts = await ctx.prisma.hourly_play_counts.findMany(input);
      return findManyhourly_play_counts;
    }),
  findUniquehourly_play_counts: publicProcedure
    .input(hourly_play_countsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquehourly_play_counts = await ctx.prisma.hourly_play_counts.findUnique(input);
      return findUniquehourly_play_counts;
    }),
  findUniquehourly_play_countsOrThrow: publicProcedure
    .input(hourly_play_countsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquehourly_play_countsOrThrow = await ctx.prisma.hourly_play_counts.findUniqueOrThrow(input);
      return findUniquehourly_play_countsOrThrow;
    }),
  groupByhourly_play_counts: publicProcedure
    .input(hourly_play_countsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByhourly_play_counts = await ctx.prisma.hourly_play_counts.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByhourly_play_counts;
    }),
  updateManyhourly_play_counts: publicProcedure
    .input(hourly_play_countsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyhourly_play_counts = await ctx.prisma.hourly_play_counts.updateMany(input);
      return updateManyhourly_play_counts;
    }),
  updateOnehourly_play_counts: publicProcedure
    .input(hourly_play_countsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnehourly_play_counts = await ctx.prisma.hourly_play_counts.update(input);
      return updateOnehourly_play_counts;
    }),
  upsertOnehourly_play_counts: publicProcedure
    .input(hourly_play_countsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnehourly_play_counts = await ctx.prisma.hourly_play_counts.upsert(input);
      return upsertOnehourly_play_counts;
    }),

}) 
