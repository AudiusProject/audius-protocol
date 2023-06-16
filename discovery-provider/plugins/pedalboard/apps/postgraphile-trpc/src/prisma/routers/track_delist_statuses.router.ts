import { t, publicProcedure } from "./helpers/createRouter";
import { track_delist_statusesAggregateSchema } from "../schemas/aggregatetrack_delist_statuses.schema";
import { track_delist_statusesCreateManySchema } from "../schemas/createManytrack_delist_statuses.schema";
import { track_delist_statusesCreateOneSchema } from "../schemas/createOnetrack_delist_statuses.schema";
import { track_delist_statusesDeleteManySchema } from "../schemas/deleteManytrack_delist_statuses.schema";
import { track_delist_statusesDeleteOneSchema } from "../schemas/deleteOnetrack_delist_statuses.schema";
import { track_delist_statusesFindFirstSchema } from "../schemas/findFirsttrack_delist_statuses.schema";
import { track_delist_statusesFindManySchema } from "../schemas/findManytrack_delist_statuses.schema";
import { track_delist_statusesFindUniqueSchema } from "../schemas/findUniquetrack_delist_statuses.schema";
import { track_delist_statusesGroupBySchema } from "../schemas/groupBytrack_delist_statuses.schema";
import { track_delist_statusesUpdateManySchema } from "../schemas/updateManytrack_delist_statuses.schema";
import { track_delist_statusesUpdateOneSchema } from "../schemas/updateOnetrack_delist_statuses.schema";
import { track_delist_statusesUpsertSchema } from "../schemas/upsertOnetrack_delist_statuses.schema";

export const track_delist_statusesRouter = t.router({
  aggregatetrack_delist_statuses: publicProcedure
    .input(track_delist_statusesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatetrack_delist_statuses = await ctx.prisma.track_delist_statuses.aggregate(input);
      return aggregatetrack_delist_statuses;
    }),
  createManytrack_delist_statuses: publicProcedure
    .input(track_delist_statusesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManytrack_delist_statuses = await ctx.prisma.track_delist_statuses.createMany(input);
      return createManytrack_delist_statuses;
    }),
  createOnetrack_delist_statuses: publicProcedure
    .input(track_delist_statusesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnetrack_delist_statuses = await ctx.prisma.track_delist_statuses.create(input);
      return createOnetrack_delist_statuses;
    }),
  deleteManytrack_delist_statuses: publicProcedure
    .input(track_delist_statusesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManytrack_delist_statuses = await ctx.prisma.track_delist_statuses.deleteMany(input);
      return deleteManytrack_delist_statuses;
    }),
  deleteOnetrack_delist_statuses: publicProcedure
    .input(track_delist_statusesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnetrack_delist_statuses = await ctx.prisma.track_delist_statuses.delete(input);
      return deleteOnetrack_delist_statuses;
    }),
  findFirsttrack_delist_statuses: publicProcedure
    .input(track_delist_statusesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrack_delist_statuses = await ctx.prisma.track_delist_statuses.findFirst(input);
      return findFirsttrack_delist_statuses;
    }),
  findFirsttrack_delist_statusesOrThrow: publicProcedure
    .input(track_delist_statusesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrack_delist_statusesOrThrow = await ctx.prisma.track_delist_statuses.findFirstOrThrow(input);
      return findFirsttrack_delist_statusesOrThrow;
    }),
  findManytrack_delist_statuses: publicProcedure
    .input(track_delist_statusesFindManySchema).query(async ({ ctx, input }) => {
      const findManytrack_delist_statuses = await ctx.prisma.track_delist_statuses.findMany(input);
      return findManytrack_delist_statuses;
    }),
  findUniquetrack_delist_statuses: publicProcedure
    .input(track_delist_statusesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrack_delist_statuses = await ctx.prisma.track_delist_statuses.findUnique(input);
      return findUniquetrack_delist_statuses;
    }),
  findUniquetrack_delist_statusesOrThrow: publicProcedure
    .input(track_delist_statusesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrack_delist_statusesOrThrow = await ctx.prisma.track_delist_statuses.findUniqueOrThrow(input);
      return findUniquetrack_delist_statusesOrThrow;
    }),
  groupBytrack_delist_statuses: publicProcedure
    .input(track_delist_statusesGroupBySchema).query(async ({ ctx, input }) => {
      const groupBytrack_delist_statuses = await ctx.prisma.track_delist_statuses.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBytrack_delist_statuses;
    }),
  updateManytrack_delist_statuses: publicProcedure
    .input(track_delist_statusesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManytrack_delist_statuses = await ctx.prisma.track_delist_statuses.updateMany(input);
      return updateManytrack_delist_statuses;
    }),
  updateOnetrack_delist_statuses: publicProcedure
    .input(track_delist_statusesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnetrack_delist_statuses = await ctx.prisma.track_delist_statuses.update(input);
      return updateOnetrack_delist_statuses;
    }),
  upsertOnetrack_delist_statuses: publicProcedure
    .input(track_delist_statusesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnetrack_delist_statuses = await ctx.prisma.track_delist_statuses.upsert(input);
      return upsertOnetrack_delist_statuses;
    }),

}) 
