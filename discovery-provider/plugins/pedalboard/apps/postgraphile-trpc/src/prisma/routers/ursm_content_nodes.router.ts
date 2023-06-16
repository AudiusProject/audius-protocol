import { t, publicProcedure } from "./helpers/createRouter";
import { ursm_content_nodesAggregateSchema } from "../schemas/aggregateursm_content_nodes.schema";
import { ursm_content_nodesCreateManySchema } from "../schemas/createManyursm_content_nodes.schema";
import { ursm_content_nodesCreateOneSchema } from "../schemas/createOneursm_content_nodes.schema";
import { ursm_content_nodesDeleteManySchema } from "../schemas/deleteManyursm_content_nodes.schema";
import { ursm_content_nodesDeleteOneSchema } from "../schemas/deleteOneursm_content_nodes.schema";
import { ursm_content_nodesFindFirstSchema } from "../schemas/findFirstursm_content_nodes.schema";
import { ursm_content_nodesFindManySchema } from "../schemas/findManyursm_content_nodes.schema";
import { ursm_content_nodesFindUniqueSchema } from "../schemas/findUniqueursm_content_nodes.schema";
import { ursm_content_nodesGroupBySchema } from "../schemas/groupByursm_content_nodes.schema";
import { ursm_content_nodesUpdateManySchema } from "../schemas/updateManyursm_content_nodes.schema";
import { ursm_content_nodesUpdateOneSchema } from "../schemas/updateOneursm_content_nodes.schema";
import { ursm_content_nodesUpsertSchema } from "../schemas/upsertOneursm_content_nodes.schema";

export const ursm_content_nodesRouter = t.router({
  aggregateursm_content_nodes: publicProcedure
    .input(ursm_content_nodesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateursm_content_nodes = await ctx.prisma.ursm_content_nodes.aggregate(input);
      return aggregateursm_content_nodes;
    }),
  createManyursm_content_nodes: publicProcedure
    .input(ursm_content_nodesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyursm_content_nodes = await ctx.prisma.ursm_content_nodes.createMany(input);
      return createManyursm_content_nodes;
    }),
  createOneursm_content_nodes: publicProcedure
    .input(ursm_content_nodesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneursm_content_nodes = await ctx.prisma.ursm_content_nodes.create(input);
      return createOneursm_content_nodes;
    }),
  deleteManyursm_content_nodes: publicProcedure
    .input(ursm_content_nodesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyursm_content_nodes = await ctx.prisma.ursm_content_nodes.deleteMany(input);
      return deleteManyursm_content_nodes;
    }),
  deleteOneursm_content_nodes: publicProcedure
    .input(ursm_content_nodesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneursm_content_nodes = await ctx.prisma.ursm_content_nodes.delete(input);
      return deleteOneursm_content_nodes;
    }),
  findFirstursm_content_nodes: publicProcedure
    .input(ursm_content_nodesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstursm_content_nodes = await ctx.prisma.ursm_content_nodes.findFirst(input);
      return findFirstursm_content_nodes;
    }),
  findFirstursm_content_nodesOrThrow: publicProcedure
    .input(ursm_content_nodesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstursm_content_nodesOrThrow = await ctx.prisma.ursm_content_nodes.findFirstOrThrow(input);
      return findFirstursm_content_nodesOrThrow;
    }),
  findManyursm_content_nodes: publicProcedure
    .input(ursm_content_nodesFindManySchema).query(async ({ ctx, input }) => {
      const findManyursm_content_nodes = await ctx.prisma.ursm_content_nodes.findMany(input);
      return findManyursm_content_nodes;
    }),
  findUniqueursm_content_nodes: publicProcedure
    .input(ursm_content_nodesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueursm_content_nodes = await ctx.prisma.ursm_content_nodes.findUnique(input);
      return findUniqueursm_content_nodes;
    }),
  findUniqueursm_content_nodesOrThrow: publicProcedure
    .input(ursm_content_nodesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueursm_content_nodesOrThrow = await ctx.prisma.ursm_content_nodes.findUniqueOrThrow(input);
      return findUniqueursm_content_nodesOrThrow;
    }),
  groupByursm_content_nodes: publicProcedure
    .input(ursm_content_nodesGroupBySchema).query(async ({ ctx, input }) => {
      const groupByursm_content_nodes = await ctx.prisma.ursm_content_nodes.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByursm_content_nodes;
    }),
  updateManyursm_content_nodes: publicProcedure
    .input(ursm_content_nodesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyursm_content_nodes = await ctx.prisma.ursm_content_nodes.updateMany(input);
      return updateManyursm_content_nodes;
    }),
  updateOneursm_content_nodes: publicProcedure
    .input(ursm_content_nodesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneursm_content_nodes = await ctx.prisma.ursm_content_nodes.update(input);
      return updateOneursm_content_nodes;
    }),
  upsertOneursm_content_nodes: publicProcedure
    .input(ursm_content_nodesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneursm_content_nodes = await ctx.prisma.ursm_content_nodes.upsert(input);
      return upsertOneursm_content_nodes;
    }),

}) 
