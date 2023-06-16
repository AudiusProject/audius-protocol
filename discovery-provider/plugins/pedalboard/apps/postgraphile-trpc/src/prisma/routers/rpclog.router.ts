import { t, publicProcedure } from "./helpers/createRouter";
import { rpclogAggregateSchema } from "../schemas/aggregaterpclog.schema";
import { rpclogCreateManySchema } from "../schemas/createManyrpclog.schema";
import { rpclogCreateOneSchema } from "../schemas/createOnerpclog.schema";
import { rpclogDeleteManySchema } from "../schemas/deleteManyrpclog.schema";
import { rpclogDeleteOneSchema } from "../schemas/deleteOnerpclog.schema";
import { rpclogFindFirstSchema } from "../schemas/findFirstrpclog.schema";
import { rpclogFindManySchema } from "../schemas/findManyrpclog.schema";
import { rpclogFindUniqueSchema } from "../schemas/findUniquerpclog.schema";
import { rpclogGroupBySchema } from "../schemas/groupByrpclog.schema";
import { rpclogUpdateManySchema } from "../schemas/updateManyrpclog.schema";
import { rpclogUpdateOneSchema } from "../schemas/updateOnerpclog.schema";
import { rpclogUpsertSchema } from "../schemas/upsertOnerpclog.schema";

export const rpclogsRouter = t.router({
  aggregaterpclog: publicProcedure
    .input(rpclogAggregateSchema).query(async ({ ctx, input }) => {
      const aggregaterpclog = await ctx.prisma.rpclog.aggregate(input);
      return aggregaterpclog;
    }),
  createManyrpclog: publicProcedure
    .input(rpclogCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyrpclog = await ctx.prisma.rpclog.createMany(input);
      return createManyrpclog;
    }),
  createOnerpclog: publicProcedure
    .input(rpclogCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnerpclog = await ctx.prisma.rpclog.create(input);
      return createOnerpclog;
    }),
  deleteManyrpclog: publicProcedure
    .input(rpclogDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyrpclog = await ctx.prisma.rpclog.deleteMany(input);
      return deleteManyrpclog;
    }),
  deleteOnerpclog: publicProcedure
    .input(rpclogDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnerpclog = await ctx.prisma.rpclog.delete(input);
      return deleteOnerpclog;
    }),
  findFirstrpclog: publicProcedure
    .input(rpclogFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrpclog = await ctx.prisma.rpclog.findFirst(input);
      return findFirstrpclog;
    }),
  findFirstrpclogOrThrow: publicProcedure
    .input(rpclogFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrpclogOrThrow = await ctx.prisma.rpclog.findFirstOrThrow(input);
      return findFirstrpclogOrThrow;
    }),
  findManyrpclog: publicProcedure
    .input(rpclogFindManySchema).query(async ({ ctx, input }) => {
      const findManyrpclog = await ctx.prisma.rpclog.findMany(input);
      return findManyrpclog;
    }),
  findUniquerpclog: publicProcedure
    .input(rpclogFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerpclog = await ctx.prisma.rpclog.findUnique(input);
      return findUniquerpclog;
    }),
  findUniquerpclogOrThrow: publicProcedure
    .input(rpclogFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerpclogOrThrow = await ctx.prisma.rpclog.findUniqueOrThrow(input);
      return findUniquerpclogOrThrow;
    }),
  groupByrpclog: publicProcedure
    .input(rpclogGroupBySchema).query(async ({ ctx, input }) => {
      const groupByrpclog = await ctx.prisma.rpclog.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByrpclog;
    }),
  updateManyrpclog: publicProcedure
    .input(rpclogUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyrpclog = await ctx.prisma.rpclog.updateMany(input);
      return updateManyrpclog;
    }),
  updateOnerpclog: publicProcedure
    .input(rpclogUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnerpclog = await ctx.prisma.rpclog.update(input);
      return updateOnerpclog;
    }),
  upsertOnerpclog: publicProcedure
    .input(rpclogUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnerpclog = await ctx.prisma.rpclog.upsert(input);
      return upsertOnerpclog;
    }),

}) 
