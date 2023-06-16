import { t, publicProcedure } from "./helpers/createRouter";
import { rpc_logAggregateSchema } from "../schemas/aggregaterpc_log.schema";
import { rpc_logCreateManySchema } from "../schemas/createManyrpc_log.schema";
import { rpc_logCreateOneSchema } from "../schemas/createOnerpc_log.schema";
import { rpc_logDeleteManySchema } from "../schemas/deleteManyrpc_log.schema";
import { rpc_logDeleteOneSchema } from "../schemas/deleteOnerpc_log.schema";
import { rpc_logFindFirstSchema } from "../schemas/findFirstrpc_log.schema";
import { rpc_logFindManySchema } from "../schemas/findManyrpc_log.schema";
import { rpc_logFindUniqueSchema } from "../schemas/findUniquerpc_log.schema";
import { rpc_logGroupBySchema } from "../schemas/groupByrpc_log.schema";
import { rpc_logUpdateManySchema } from "../schemas/updateManyrpc_log.schema";
import { rpc_logUpdateOneSchema } from "../schemas/updateOnerpc_log.schema";
import { rpc_logUpsertSchema } from "../schemas/upsertOnerpc_log.schema";

export const rpc_logsRouter = t.router({
  aggregaterpc_log: publicProcedure
    .input(rpc_logAggregateSchema).query(async ({ ctx, input }) => {
      const aggregaterpc_log = await ctx.prisma.rpc_log.aggregate(input);
      return aggregaterpc_log;
    }),
  createManyrpc_log: publicProcedure
    .input(rpc_logCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyrpc_log = await ctx.prisma.rpc_log.createMany(input);
      return createManyrpc_log;
    }),
  createOnerpc_log: publicProcedure
    .input(rpc_logCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnerpc_log = await ctx.prisma.rpc_log.create(input);
      return createOnerpc_log;
    }),
  deleteManyrpc_log: publicProcedure
    .input(rpc_logDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyrpc_log = await ctx.prisma.rpc_log.deleteMany(input);
      return deleteManyrpc_log;
    }),
  deleteOnerpc_log: publicProcedure
    .input(rpc_logDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnerpc_log = await ctx.prisma.rpc_log.delete(input);
      return deleteOnerpc_log;
    }),
  findFirstrpc_log: publicProcedure
    .input(rpc_logFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrpc_log = await ctx.prisma.rpc_log.findFirst(input);
      return findFirstrpc_log;
    }),
  findFirstrpc_logOrThrow: publicProcedure
    .input(rpc_logFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrpc_logOrThrow = await ctx.prisma.rpc_log.findFirstOrThrow(input);
      return findFirstrpc_logOrThrow;
    }),
  findManyrpc_log: publicProcedure
    .input(rpc_logFindManySchema).query(async ({ ctx, input }) => {
      const findManyrpc_log = await ctx.prisma.rpc_log.findMany(input);
      return findManyrpc_log;
    }),
  findUniquerpc_log: publicProcedure
    .input(rpc_logFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerpc_log = await ctx.prisma.rpc_log.findUnique(input);
      return findUniquerpc_log;
    }),
  findUniquerpc_logOrThrow: publicProcedure
    .input(rpc_logFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerpc_logOrThrow = await ctx.prisma.rpc_log.findUniqueOrThrow(input);
      return findUniquerpc_logOrThrow;
    }),
  groupByrpc_log: publicProcedure
    .input(rpc_logGroupBySchema).query(async ({ ctx, input }) => {
      const groupByrpc_log = await ctx.prisma.rpc_log.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByrpc_log;
    }),
  updateManyrpc_log: publicProcedure
    .input(rpc_logUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyrpc_log = await ctx.prisma.rpc_log.updateMany(input);
      return updateManyrpc_log;
    }),
  updateOnerpc_log: publicProcedure
    .input(rpc_logUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnerpc_log = await ctx.prisma.rpc_log.update(input);
      return updateOnerpc_log;
    }),
  upsertOnerpc_log: publicProcedure
    .input(rpc_logUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnerpc_log = await ctx.prisma.rpc_log.upsert(input);
      return upsertOnerpc_log;
    }),

}) 
