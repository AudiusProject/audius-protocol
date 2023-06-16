import { t, publicProcedure } from "./helpers/createRouter";
import { remixesAggregateSchema } from "../schemas/aggregateremixes.schema";
import { remixesCreateManySchema } from "../schemas/createManyremixes.schema";
import { remixesCreateOneSchema } from "../schemas/createOneremixes.schema";
import { remixesDeleteManySchema } from "../schemas/deleteManyremixes.schema";
import { remixesDeleteOneSchema } from "../schemas/deleteOneremixes.schema";
import { remixesFindFirstSchema } from "../schemas/findFirstremixes.schema";
import { remixesFindManySchema } from "../schemas/findManyremixes.schema";
import { remixesFindUniqueSchema } from "../schemas/findUniqueremixes.schema";
import { remixesGroupBySchema } from "../schemas/groupByremixes.schema";
import { remixesUpdateManySchema } from "../schemas/updateManyremixes.schema";
import { remixesUpdateOneSchema } from "../schemas/updateOneremixes.schema";
import { remixesUpsertSchema } from "../schemas/upsertOneremixes.schema";

export const remixesRouter = t.router({
  aggregateremixes: publicProcedure
    .input(remixesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateremixes = await ctx.prisma.remixes.aggregate(input);
      return aggregateremixes;
    }),
  createManyremixes: publicProcedure
    .input(remixesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyremixes = await ctx.prisma.remixes.createMany(input);
      return createManyremixes;
    }),
  createOneremixes: publicProcedure
    .input(remixesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneremixes = await ctx.prisma.remixes.create(input);
      return createOneremixes;
    }),
  deleteManyremixes: publicProcedure
    .input(remixesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyremixes = await ctx.prisma.remixes.deleteMany(input);
      return deleteManyremixes;
    }),
  deleteOneremixes: publicProcedure
    .input(remixesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneremixes = await ctx.prisma.remixes.delete(input);
      return deleteOneremixes;
    }),
  findFirstremixes: publicProcedure
    .input(remixesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstremixes = await ctx.prisma.remixes.findFirst(input);
      return findFirstremixes;
    }),
  findFirstremixesOrThrow: publicProcedure
    .input(remixesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstremixesOrThrow = await ctx.prisma.remixes.findFirstOrThrow(input);
      return findFirstremixesOrThrow;
    }),
  findManyremixes: publicProcedure
    .input(remixesFindManySchema).query(async ({ ctx, input }) => {
      const findManyremixes = await ctx.prisma.remixes.findMany(input);
      return findManyremixes;
    }),
  findUniqueremixes: publicProcedure
    .input(remixesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueremixes = await ctx.prisma.remixes.findUnique(input);
      return findUniqueremixes;
    }),
  findUniqueremixesOrThrow: publicProcedure
    .input(remixesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueremixesOrThrow = await ctx.prisma.remixes.findUniqueOrThrow(input);
      return findUniqueremixesOrThrow;
    }),
  groupByremixes: publicProcedure
    .input(remixesGroupBySchema).query(async ({ ctx, input }) => {
      const groupByremixes = await ctx.prisma.remixes.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByremixes;
    }),
  updateManyremixes: publicProcedure
    .input(remixesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyremixes = await ctx.prisma.remixes.updateMany(input);
      return updateManyremixes;
    }),
  updateOneremixes: publicProcedure
    .input(remixesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneremixes = await ctx.prisma.remixes.update(input);
      return updateOneremixes;
    }),
  upsertOneremixes: publicProcedure
    .input(remixesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneremixes = await ctx.prisma.remixes.upsert(input);
      return upsertOneremixes;
    }),

}) 
