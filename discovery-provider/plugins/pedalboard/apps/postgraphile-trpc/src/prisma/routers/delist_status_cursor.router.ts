import { t, publicProcedure } from "./helpers/createRouter";
import { delist_status_cursorAggregateSchema } from "../schemas/aggregatedelist_status_cursor.schema";
import { delist_status_cursorCreateManySchema } from "../schemas/createManydelist_status_cursor.schema";
import { delist_status_cursorCreateOneSchema } from "../schemas/createOnedelist_status_cursor.schema";
import { delist_status_cursorDeleteManySchema } from "../schemas/deleteManydelist_status_cursor.schema";
import { delist_status_cursorDeleteOneSchema } from "../schemas/deleteOnedelist_status_cursor.schema";
import { delist_status_cursorFindFirstSchema } from "../schemas/findFirstdelist_status_cursor.schema";
import { delist_status_cursorFindManySchema } from "../schemas/findManydelist_status_cursor.schema";
import { delist_status_cursorFindUniqueSchema } from "../schemas/findUniquedelist_status_cursor.schema";
import { delist_status_cursorGroupBySchema } from "../schemas/groupBydelist_status_cursor.schema";
import { delist_status_cursorUpdateManySchema } from "../schemas/updateManydelist_status_cursor.schema";
import { delist_status_cursorUpdateOneSchema } from "../schemas/updateOnedelist_status_cursor.schema";
import { delist_status_cursorUpsertSchema } from "../schemas/upsertOnedelist_status_cursor.schema";

export const delist_status_cursorsRouter = t.router({
  aggregatedelist_status_cursor: publicProcedure
    .input(delist_status_cursorAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatedelist_status_cursor = await ctx.prisma.delist_status_cursor.aggregate(input);
      return aggregatedelist_status_cursor;
    }),
  createManydelist_status_cursor: publicProcedure
    .input(delist_status_cursorCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManydelist_status_cursor = await ctx.prisma.delist_status_cursor.createMany(input);
      return createManydelist_status_cursor;
    }),
  createOnedelist_status_cursor: publicProcedure
    .input(delist_status_cursorCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnedelist_status_cursor = await ctx.prisma.delist_status_cursor.create(input);
      return createOnedelist_status_cursor;
    }),
  deleteManydelist_status_cursor: publicProcedure
    .input(delist_status_cursorDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManydelist_status_cursor = await ctx.prisma.delist_status_cursor.deleteMany(input);
      return deleteManydelist_status_cursor;
    }),
  deleteOnedelist_status_cursor: publicProcedure
    .input(delist_status_cursorDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnedelist_status_cursor = await ctx.prisma.delist_status_cursor.delete(input);
      return deleteOnedelist_status_cursor;
    }),
  findFirstdelist_status_cursor: publicProcedure
    .input(delist_status_cursorFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstdelist_status_cursor = await ctx.prisma.delist_status_cursor.findFirst(input);
      return findFirstdelist_status_cursor;
    }),
  findFirstdelist_status_cursorOrThrow: publicProcedure
    .input(delist_status_cursorFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstdelist_status_cursorOrThrow = await ctx.prisma.delist_status_cursor.findFirstOrThrow(input);
      return findFirstdelist_status_cursorOrThrow;
    }),
  findManydelist_status_cursor: publicProcedure
    .input(delist_status_cursorFindManySchema).query(async ({ ctx, input }) => {
      const findManydelist_status_cursor = await ctx.prisma.delist_status_cursor.findMany(input);
      return findManydelist_status_cursor;
    }),
  findUniquedelist_status_cursor: publicProcedure
    .input(delist_status_cursorFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquedelist_status_cursor = await ctx.prisma.delist_status_cursor.findUnique(input);
      return findUniquedelist_status_cursor;
    }),
  findUniquedelist_status_cursorOrThrow: publicProcedure
    .input(delist_status_cursorFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquedelist_status_cursorOrThrow = await ctx.prisma.delist_status_cursor.findUniqueOrThrow(input);
      return findUniquedelist_status_cursorOrThrow;
    }),
  groupBydelist_status_cursor: publicProcedure
    .input(delist_status_cursorGroupBySchema).query(async ({ ctx, input }) => {
      const groupBydelist_status_cursor = await ctx.prisma.delist_status_cursor.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBydelist_status_cursor;
    }),
  updateManydelist_status_cursor: publicProcedure
    .input(delist_status_cursorUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManydelist_status_cursor = await ctx.prisma.delist_status_cursor.updateMany(input);
      return updateManydelist_status_cursor;
    }),
  updateOnedelist_status_cursor: publicProcedure
    .input(delist_status_cursorUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnedelist_status_cursor = await ctx.prisma.delist_status_cursor.update(input);
      return updateOnedelist_status_cursor;
    }),
  upsertOnedelist_status_cursor: publicProcedure
    .input(delist_status_cursorUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnedelist_status_cursor = await ctx.prisma.delist_status_cursor.upsert(input);
      return upsertOnedelist_status_cursor;
    }),

}) 
