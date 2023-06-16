import { t, publicProcedure } from "./helpers/createRouter";
import { supporter_rank_upsAggregateSchema } from "../schemas/aggregatesupporter_rank_ups.schema";
import { supporter_rank_upsCreateManySchema } from "../schemas/createManysupporter_rank_ups.schema";
import { supporter_rank_upsCreateOneSchema } from "../schemas/createOnesupporter_rank_ups.schema";
import { supporter_rank_upsDeleteManySchema } from "../schemas/deleteManysupporter_rank_ups.schema";
import { supporter_rank_upsDeleteOneSchema } from "../schemas/deleteOnesupporter_rank_ups.schema";
import { supporter_rank_upsFindFirstSchema } from "../schemas/findFirstsupporter_rank_ups.schema";
import { supporter_rank_upsFindManySchema } from "../schemas/findManysupporter_rank_ups.schema";
import { supporter_rank_upsFindUniqueSchema } from "../schemas/findUniquesupporter_rank_ups.schema";
import { supporter_rank_upsGroupBySchema } from "../schemas/groupBysupporter_rank_ups.schema";
import { supporter_rank_upsUpdateManySchema } from "../schemas/updateManysupporter_rank_ups.schema";
import { supporter_rank_upsUpdateOneSchema } from "../schemas/updateOnesupporter_rank_ups.schema";
import { supporter_rank_upsUpsertSchema } from "../schemas/upsertOnesupporter_rank_ups.schema";

export const supporter_rank_upsRouter = t.router({
  aggregatesupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatesupporter_rank_ups = await ctx.prisma.supporter_rank_ups.aggregate(input);
      return aggregatesupporter_rank_ups;
    }),
  createManysupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManysupporter_rank_ups = await ctx.prisma.supporter_rank_ups.createMany(input);
      return createManysupporter_rank_ups;
    }),
  createOnesupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnesupporter_rank_ups = await ctx.prisma.supporter_rank_ups.create(input);
      return createOnesupporter_rank_ups;
    }),
  deleteManysupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManysupporter_rank_ups = await ctx.prisma.supporter_rank_ups.deleteMany(input);
      return deleteManysupporter_rank_ups;
    }),
  deleteOnesupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnesupporter_rank_ups = await ctx.prisma.supporter_rank_ups.delete(input);
      return deleteOnesupporter_rank_ups;
    }),
  findFirstsupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstsupporter_rank_ups = await ctx.prisma.supporter_rank_ups.findFirst(input);
      return findFirstsupporter_rank_ups;
    }),
  findFirstsupporter_rank_upsOrThrow: publicProcedure
    .input(supporter_rank_upsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstsupporter_rank_upsOrThrow = await ctx.prisma.supporter_rank_ups.findFirstOrThrow(input);
      return findFirstsupporter_rank_upsOrThrow;
    }),
  findManysupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsFindManySchema).query(async ({ ctx, input }) => {
      const findManysupporter_rank_ups = await ctx.prisma.supporter_rank_ups.findMany(input);
      return findManysupporter_rank_ups;
    }),
  findUniquesupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquesupporter_rank_ups = await ctx.prisma.supporter_rank_ups.findUnique(input);
      return findUniquesupporter_rank_ups;
    }),
  findUniquesupporter_rank_upsOrThrow: publicProcedure
    .input(supporter_rank_upsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquesupporter_rank_upsOrThrow = await ctx.prisma.supporter_rank_ups.findUniqueOrThrow(input);
      return findUniquesupporter_rank_upsOrThrow;
    }),
  groupBysupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBysupporter_rank_ups = await ctx.prisma.supporter_rank_ups.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBysupporter_rank_ups;
    }),
  updateManysupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManysupporter_rank_ups = await ctx.prisma.supporter_rank_ups.updateMany(input);
      return updateManysupporter_rank_ups;
    }),
  updateOnesupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnesupporter_rank_ups = await ctx.prisma.supporter_rank_ups.update(input);
      return updateOnesupporter_rank_ups;
    }),
  upsertOnesupporter_rank_ups: publicProcedure
    .input(supporter_rank_upsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnesupporter_rank_ups = await ctx.prisma.supporter_rank_ups.upsert(input);
      return upsertOnesupporter_rank_ups;
    }),

}) 
