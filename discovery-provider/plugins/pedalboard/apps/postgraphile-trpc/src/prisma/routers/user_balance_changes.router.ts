import { t, publicProcedure } from "./helpers/createRouter";
import { user_balance_changesAggregateSchema } from "../schemas/aggregateuser_balance_changes.schema";
import { user_balance_changesCreateManySchema } from "../schemas/createManyuser_balance_changes.schema";
import { user_balance_changesCreateOneSchema } from "../schemas/createOneuser_balance_changes.schema";
import { user_balance_changesDeleteManySchema } from "../schemas/deleteManyuser_balance_changes.schema";
import { user_balance_changesDeleteOneSchema } from "../schemas/deleteOneuser_balance_changes.schema";
import { user_balance_changesFindFirstSchema } from "../schemas/findFirstuser_balance_changes.schema";
import { user_balance_changesFindManySchema } from "../schemas/findManyuser_balance_changes.schema";
import { user_balance_changesFindUniqueSchema } from "../schemas/findUniqueuser_balance_changes.schema";
import { user_balance_changesGroupBySchema } from "../schemas/groupByuser_balance_changes.schema";
import { user_balance_changesUpdateManySchema } from "../schemas/updateManyuser_balance_changes.schema";
import { user_balance_changesUpdateOneSchema } from "../schemas/updateOneuser_balance_changes.schema";
import { user_balance_changesUpsertSchema } from "../schemas/upsertOneuser_balance_changes.schema";

export const user_balance_changesRouter = t.router({
  aggregateuser_balance_changes: publicProcedure
    .input(user_balance_changesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_balance_changes = await ctx.prisma.user_balance_changes.aggregate(input);
      return aggregateuser_balance_changes;
    }),
  createManyuser_balance_changes: publicProcedure
    .input(user_balance_changesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_balance_changes = await ctx.prisma.user_balance_changes.createMany(input);
      return createManyuser_balance_changes;
    }),
  createOneuser_balance_changes: publicProcedure
    .input(user_balance_changesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_balance_changes = await ctx.prisma.user_balance_changes.create(input);
      return createOneuser_balance_changes;
    }),
  deleteManyuser_balance_changes: publicProcedure
    .input(user_balance_changesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_balance_changes = await ctx.prisma.user_balance_changes.deleteMany(input);
      return deleteManyuser_balance_changes;
    }),
  deleteOneuser_balance_changes: publicProcedure
    .input(user_balance_changesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_balance_changes = await ctx.prisma.user_balance_changes.delete(input);
      return deleteOneuser_balance_changes;
    }),
  findFirstuser_balance_changes: publicProcedure
    .input(user_balance_changesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_balance_changes = await ctx.prisma.user_balance_changes.findFirst(input);
      return findFirstuser_balance_changes;
    }),
  findFirstuser_balance_changesOrThrow: publicProcedure
    .input(user_balance_changesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_balance_changesOrThrow = await ctx.prisma.user_balance_changes.findFirstOrThrow(input);
      return findFirstuser_balance_changesOrThrow;
    }),
  findManyuser_balance_changes: publicProcedure
    .input(user_balance_changesFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_balance_changes = await ctx.prisma.user_balance_changes.findMany(input);
      return findManyuser_balance_changes;
    }),
  findUniqueuser_balance_changes: publicProcedure
    .input(user_balance_changesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_balance_changes = await ctx.prisma.user_balance_changes.findUnique(input);
      return findUniqueuser_balance_changes;
    }),
  findUniqueuser_balance_changesOrThrow: publicProcedure
    .input(user_balance_changesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_balance_changesOrThrow = await ctx.prisma.user_balance_changes.findUniqueOrThrow(input);
      return findUniqueuser_balance_changesOrThrow;
    }),
  groupByuser_balance_changes: publicProcedure
    .input(user_balance_changesGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_balance_changes = await ctx.prisma.user_balance_changes.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_balance_changes;
    }),
  updateManyuser_balance_changes: publicProcedure
    .input(user_balance_changesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_balance_changes = await ctx.prisma.user_balance_changes.updateMany(input);
      return updateManyuser_balance_changes;
    }),
  updateOneuser_balance_changes: publicProcedure
    .input(user_balance_changesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_balance_changes = await ctx.prisma.user_balance_changes.update(input);
      return updateOneuser_balance_changes;
    }),
  upsertOneuser_balance_changes: publicProcedure
    .input(user_balance_changesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_balance_changes = await ctx.prisma.user_balance_changes.upsert(input);
      return upsertOneuser_balance_changes;
    }),

}) 
