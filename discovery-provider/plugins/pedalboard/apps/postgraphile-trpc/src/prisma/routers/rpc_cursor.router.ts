import { t, publicProcedure } from "./helpers/createRouter";
import { rpc_cursorAggregateSchema } from "../schemas/aggregaterpc_cursor.schema";
import { rpc_cursorCreateManySchema } from "../schemas/createManyrpc_cursor.schema";
import { rpc_cursorCreateOneSchema } from "../schemas/createOnerpc_cursor.schema";
import { rpc_cursorDeleteManySchema } from "../schemas/deleteManyrpc_cursor.schema";
import { rpc_cursorDeleteOneSchema } from "../schemas/deleteOnerpc_cursor.schema";
import { rpc_cursorFindFirstSchema } from "../schemas/findFirstrpc_cursor.schema";
import { rpc_cursorFindManySchema } from "../schemas/findManyrpc_cursor.schema";
import { rpc_cursorFindUniqueSchema } from "../schemas/findUniquerpc_cursor.schema";
import { rpc_cursorGroupBySchema } from "../schemas/groupByrpc_cursor.schema";
import { rpc_cursorUpdateManySchema } from "../schemas/updateManyrpc_cursor.schema";
import { rpc_cursorUpdateOneSchema } from "../schemas/updateOnerpc_cursor.schema";
import { rpc_cursorUpsertSchema } from "../schemas/upsertOnerpc_cursor.schema";

export const rpc_cursorsRouter = t.router({
  aggregaterpc_cursor: publicProcedure
    .input(rpc_cursorAggregateSchema).query(async ({ ctx, input }) => {
      const aggregaterpc_cursor = await ctx.prisma.rpc_cursor.aggregate(input);
      return aggregaterpc_cursor;
    }),
  createManyrpc_cursor: publicProcedure
    .input(rpc_cursorCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyrpc_cursor = await ctx.prisma.rpc_cursor.createMany(input);
      return createManyrpc_cursor;
    }),
  createOnerpc_cursor: publicProcedure
    .input(rpc_cursorCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnerpc_cursor = await ctx.prisma.rpc_cursor.create(input);
      return createOnerpc_cursor;
    }),
  deleteManyrpc_cursor: publicProcedure
    .input(rpc_cursorDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyrpc_cursor = await ctx.prisma.rpc_cursor.deleteMany(input);
      return deleteManyrpc_cursor;
    }),
  deleteOnerpc_cursor: publicProcedure
    .input(rpc_cursorDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnerpc_cursor = await ctx.prisma.rpc_cursor.delete(input);
      return deleteOnerpc_cursor;
    }),
  findFirstrpc_cursor: publicProcedure
    .input(rpc_cursorFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrpc_cursor = await ctx.prisma.rpc_cursor.findFirst(input);
      return findFirstrpc_cursor;
    }),
  findFirstrpc_cursorOrThrow: publicProcedure
    .input(rpc_cursorFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrpc_cursorOrThrow = await ctx.prisma.rpc_cursor.findFirstOrThrow(input);
      return findFirstrpc_cursorOrThrow;
    }),
  findManyrpc_cursor: publicProcedure
    .input(rpc_cursorFindManySchema).query(async ({ ctx, input }) => {
      const findManyrpc_cursor = await ctx.prisma.rpc_cursor.findMany(input);
      return findManyrpc_cursor;
    }),
  findUniquerpc_cursor: publicProcedure
    .input(rpc_cursorFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerpc_cursor = await ctx.prisma.rpc_cursor.findUnique(input);
      return findUniquerpc_cursor;
    }),
  findUniquerpc_cursorOrThrow: publicProcedure
    .input(rpc_cursorFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerpc_cursorOrThrow = await ctx.prisma.rpc_cursor.findUniqueOrThrow(input);
      return findUniquerpc_cursorOrThrow;
    }),
  groupByrpc_cursor: publicProcedure
    .input(rpc_cursorGroupBySchema).query(async ({ ctx, input }) => {
      const groupByrpc_cursor = await ctx.prisma.rpc_cursor.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByrpc_cursor;
    }),
  updateManyrpc_cursor: publicProcedure
    .input(rpc_cursorUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyrpc_cursor = await ctx.prisma.rpc_cursor.updateMany(input);
      return updateManyrpc_cursor;
    }),
  updateOnerpc_cursor: publicProcedure
    .input(rpc_cursorUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnerpc_cursor = await ctx.prisma.rpc_cursor.update(input);
      return updateOnerpc_cursor;
    }),
  upsertOnerpc_cursor: publicProcedure
    .input(rpc_cursorUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnerpc_cursor = await ctx.prisma.rpc_cursor.upsert(input);
      return upsertOnerpc_cursor;
    }),

}) 
