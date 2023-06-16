import { t, publicProcedure } from "./helpers/createRouter";
import { grantsAggregateSchema } from "../schemas/aggregategrants.schema";
import { grantsCreateManySchema } from "../schemas/createManygrants.schema";
import { grantsCreateOneSchema } from "../schemas/createOnegrants.schema";
import { grantsDeleteManySchema } from "../schemas/deleteManygrants.schema";
import { grantsDeleteOneSchema } from "../schemas/deleteOnegrants.schema";
import { grantsFindFirstSchema } from "../schemas/findFirstgrants.schema";
import { grantsFindManySchema } from "../schemas/findManygrants.schema";
import { grantsFindUniqueSchema } from "../schemas/findUniquegrants.schema";
import { grantsGroupBySchema } from "../schemas/groupBygrants.schema";
import { grantsUpdateManySchema } from "../schemas/updateManygrants.schema";
import { grantsUpdateOneSchema } from "../schemas/updateOnegrants.schema";
import { grantsUpsertSchema } from "../schemas/upsertOnegrants.schema";

export const grantsRouter = t.router({
  aggregategrants: publicProcedure
    .input(grantsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregategrants = await ctx.prisma.grants.aggregate(input);
      return aggregategrants;
    }),
  createManygrants: publicProcedure
    .input(grantsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManygrants = await ctx.prisma.grants.createMany(input);
      return createManygrants;
    }),
  createOnegrants: publicProcedure
    .input(grantsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnegrants = await ctx.prisma.grants.create(input);
      return createOnegrants;
    }),
  deleteManygrants: publicProcedure
    .input(grantsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManygrants = await ctx.prisma.grants.deleteMany(input);
      return deleteManygrants;
    }),
  deleteOnegrants: publicProcedure
    .input(grantsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnegrants = await ctx.prisma.grants.delete(input);
      return deleteOnegrants;
    }),
  findFirstgrants: publicProcedure
    .input(grantsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstgrants = await ctx.prisma.grants.findFirst(input);
      return findFirstgrants;
    }),
  findFirstgrantsOrThrow: publicProcedure
    .input(grantsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstgrantsOrThrow = await ctx.prisma.grants.findFirstOrThrow(input);
      return findFirstgrantsOrThrow;
    }),
  findManygrants: publicProcedure
    .input(grantsFindManySchema).query(async ({ ctx, input }) => {
      const findManygrants = await ctx.prisma.grants.findMany(input);
      return findManygrants;
    }),
  findUniquegrants: publicProcedure
    .input(grantsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquegrants = await ctx.prisma.grants.findUnique(input);
      return findUniquegrants;
    }),
  findUniquegrantsOrThrow: publicProcedure
    .input(grantsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquegrantsOrThrow = await ctx.prisma.grants.findUniqueOrThrow(input);
      return findUniquegrantsOrThrow;
    }),
  groupBygrants: publicProcedure
    .input(grantsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBygrants = await ctx.prisma.grants.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBygrants;
    }),
  updateManygrants: publicProcedure
    .input(grantsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManygrants = await ctx.prisma.grants.updateMany(input);
      return updateManygrants;
    }),
  updateOnegrants: publicProcedure
    .input(grantsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnegrants = await ctx.prisma.grants.update(input);
      return updateOnegrants;
    }),
  upsertOnegrants: publicProcedure
    .input(grantsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnegrants = await ctx.prisma.grants.upsert(input);
      return upsertOnegrants;
    }),

}) 
