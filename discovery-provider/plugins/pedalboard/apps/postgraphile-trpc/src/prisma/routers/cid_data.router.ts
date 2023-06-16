import { t, publicProcedure } from "./helpers/createRouter";
import { cid_dataAggregateSchema } from "../schemas/aggregatecid_data.schema";
import { cid_dataCreateManySchema } from "../schemas/createManycid_data.schema";
import { cid_dataCreateOneSchema } from "../schemas/createOnecid_data.schema";
import { cid_dataDeleteManySchema } from "../schemas/deleteManycid_data.schema";
import { cid_dataDeleteOneSchema } from "../schemas/deleteOnecid_data.schema";
import { cid_dataFindFirstSchema } from "../schemas/findFirstcid_data.schema";
import { cid_dataFindManySchema } from "../schemas/findManycid_data.schema";
import { cid_dataFindUniqueSchema } from "../schemas/findUniquecid_data.schema";
import { cid_dataGroupBySchema } from "../schemas/groupBycid_data.schema";
import { cid_dataUpdateManySchema } from "../schemas/updateManycid_data.schema";
import { cid_dataUpdateOneSchema } from "../schemas/updateOnecid_data.schema";
import { cid_dataUpsertSchema } from "../schemas/upsertOnecid_data.schema";

export const cid_dataRouter = t.router({
  aggregatecid_data: publicProcedure
    .input(cid_dataAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatecid_data = await ctx.prisma.cid_data.aggregate(input);
      return aggregatecid_data;
    }),
  createManycid_data: publicProcedure
    .input(cid_dataCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManycid_data = await ctx.prisma.cid_data.createMany(input);
      return createManycid_data;
    }),
  createOnecid_data: publicProcedure
    .input(cid_dataCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnecid_data = await ctx.prisma.cid_data.create(input);
      return createOnecid_data;
    }),
  deleteManycid_data: publicProcedure
    .input(cid_dataDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManycid_data = await ctx.prisma.cid_data.deleteMany(input);
      return deleteManycid_data;
    }),
  deleteOnecid_data: publicProcedure
    .input(cid_dataDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnecid_data = await ctx.prisma.cid_data.delete(input);
      return deleteOnecid_data;
    }),
  findFirstcid_data: publicProcedure
    .input(cid_dataFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstcid_data = await ctx.prisma.cid_data.findFirst(input);
      return findFirstcid_data;
    }),
  findFirstcid_dataOrThrow: publicProcedure
    .input(cid_dataFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstcid_dataOrThrow = await ctx.prisma.cid_data.findFirstOrThrow(input);
      return findFirstcid_dataOrThrow;
    }),
  findManycid_data: publicProcedure
    .input(cid_dataFindManySchema).query(async ({ ctx, input }) => {
      const findManycid_data = await ctx.prisma.cid_data.findMany(input);
      return findManycid_data;
    }),
  findUniquecid_data: publicProcedure
    .input(cid_dataFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquecid_data = await ctx.prisma.cid_data.findUnique(input);
      return findUniquecid_data;
    }),
  findUniquecid_dataOrThrow: publicProcedure
    .input(cid_dataFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquecid_dataOrThrow = await ctx.prisma.cid_data.findUniqueOrThrow(input);
      return findUniquecid_dataOrThrow;
    }),
  groupBycid_data: publicProcedure
    .input(cid_dataGroupBySchema).query(async ({ ctx, input }) => {
      const groupBycid_data = await ctx.prisma.cid_data.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBycid_data;
    }),
  updateManycid_data: publicProcedure
    .input(cid_dataUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManycid_data = await ctx.prisma.cid_data.updateMany(input);
      return updateManycid_data;
    }),
  updateOnecid_data: publicProcedure
    .input(cid_dataUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnecid_data = await ctx.prisma.cid_data.update(input);
      return updateOnecid_data;
    }),
  upsertOnecid_data: publicProcedure
    .input(cid_dataUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnecid_data = await ctx.prisma.cid_data.upsert(input);
      return upsertOnecid_data;
    }),

}) 
