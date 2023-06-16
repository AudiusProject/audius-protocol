import { t, publicProcedure } from "./helpers/createRouter";
import { SequelizeMetaAggregateSchema } from "../schemas/aggregateSequelizeMeta.schema";
import { SequelizeMetaCreateManySchema } from "../schemas/createManySequelizeMeta.schema";
import { SequelizeMetaCreateOneSchema } from "../schemas/createOneSequelizeMeta.schema";
import { SequelizeMetaDeleteManySchema } from "../schemas/deleteManySequelizeMeta.schema";
import { SequelizeMetaDeleteOneSchema } from "../schemas/deleteOneSequelizeMeta.schema";
import { SequelizeMetaFindFirstSchema } from "../schemas/findFirstSequelizeMeta.schema";
import { SequelizeMetaFindManySchema } from "../schemas/findManySequelizeMeta.schema";
import { SequelizeMetaFindUniqueSchema } from "../schemas/findUniqueSequelizeMeta.schema";
import { SequelizeMetaGroupBySchema } from "../schemas/groupBySequelizeMeta.schema";
import { SequelizeMetaUpdateManySchema } from "../schemas/updateManySequelizeMeta.schema";
import { SequelizeMetaUpdateOneSchema } from "../schemas/updateOneSequelizeMeta.schema";
import { SequelizeMetaUpsertSchema } from "../schemas/upsertOneSequelizeMeta.schema";

export const sequelizemetasRouter = t.router({
  aggregateSequelizeMeta: publicProcedure
    .input(SequelizeMetaAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateSequelizeMeta = await ctx.prisma.sequelizeMeta.aggregate(input);
      return aggregateSequelizeMeta;
    }),
  createManySequelizeMeta: publicProcedure
    .input(SequelizeMetaCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManySequelizeMeta = await ctx.prisma.sequelizeMeta.createMany(input);
      return createManySequelizeMeta;
    }),
  createOneSequelizeMeta: publicProcedure
    .input(SequelizeMetaCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneSequelizeMeta = await ctx.prisma.sequelizeMeta.create(input);
      return createOneSequelizeMeta;
    }),
  deleteManySequelizeMeta: publicProcedure
    .input(SequelizeMetaDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManySequelizeMeta = await ctx.prisma.sequelizeMeta.deleteMany(input);
      return deleteManySequelizeMeta;
    }),
  deleteOneSequelizeMeta: publicProcedure
    .input(SequelizeMetaDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneSequelizeMeta = await ctx.prisma.sequelizeMeta.delete(input);
      return deleteOneSequelizeMeta;
    }),
  findFirstSequelizeMeta: publicProcedure
    .input(SequelizeMetaFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstSequelizeMeta = await ctx.prisma.sequelizeMeta.findFirst(input);
      return findFirstSequelizeMeta;
    }),
  findFirstSequelizeMetaOrThrow: publicProcedure
    .input(SequelizeMetaFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstSequelizeMetaOrThrow = await ctx.prisma.sequelizeMeta.findFirstOrThrow(input);
      return findFirstSequelizeMetaOrThrow;
    }),
  findManySequelizeMeta: publicProcedure
    .input(SequelizeMetaFindManySchema).query(async ({ ctx, input }) => {
      const findManySequelizeMeta = await ctx.prisma.sequelizeMeta.findMany(input);
      return findManySequelizeMeta;
    }),
  findUniqueSequelizeMeta: publicProcedure
    .input(SequelizeMetaFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueSequelizeMeta = await ctx.prisma.sequelizeMeta.findUnique(input);
      return findUniqueSequelizeMeta;
    }),
  findUniqueSequelizeMetaOrThrow: publicProcedure
    .input(SequelizeMetaFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueSequelizeMetaOrThrow = await ctx.prisma.sequelizeMeta.findUniqueOrThrow(input);
      return findUniqueSequelizeMetaOrThrow;
    }),
  groupBySequelizeMeta: publicProcedure
    .input(SequelizeMetaGroupBySchema).query(async ({ ctx, input }) => {
      const groupBySequelizeMeta = await ctx.prisma.sequelizeMeta.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBySequelizeMeta;
    }),
  updateManySequelizeMeta: publicProcedure
    .input(SequelizeMetaUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManySequelizeMeta = await ctx.prisma.sequelizeMeta.updateMany(input);
      return updateManySequelizeMeta;
    }),
  updateOneSequelizeMeta: publicProcedure
    .input(SequelizeMetaUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneSequelizeMeta = await ctx.prisma.sequelizeMeta.update(input);
      return updateOneSequelizeMeta;
    }),
  upsertOneSequelizeMeta: publicProcedure
    .input(SequelizeMetaUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneSequelizeMeta = await ctx.prisma.sequelizeMeta.upsert(input);
      return upsertOneSequelizeMeta;
    }),

}) 
