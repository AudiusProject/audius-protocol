import { t, publicProcedure } from "./helpers/createRouter";
import { stemsAggregateSchema } from "../schemas/aggregatestems.schema";
import { stemsCreateManySchema } from "../schemas/createManystems.schema";
import { stemsCreateOneSchema } from "../schemas/createOnestems.schema";
import { stemsDeleteManySchema } from "../schemas/deleteManystems.schema";
import { stemsDeleteOneSchema } from "../schemas/deleteOnestems.schema";
import { stemsFindFirstSchema } from "../schemas/findFirststems.schema";
import { stemsFindManySchema } from "../schemas/findManystems.schema";
import { stemsFindUniqueSchema } from "../schemas/findUniquestems.schema";
import { stemsGroupBySchema } from "../schemas/groupBystems.schema";
import { stemsUpdateManySchema } from "../schemas/updateManystems.schema";
import { stemsUpdateOneSchema } from "../schemas/updateOnestems.schema";
import { stemsUpsertSchema } from "../schemas/upsertOnestems.schema";

export const stemsRouter = t.router({
  aggregatestems: publicProcedure
    .input(stemsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatestems = await ctx.prisma.stems.aggregate(input);
      return aggregatestems;
    }),
  createManystems: publicProcedure
    .input(stemsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManystems = await ctx.prisma.stems.createMany(input);
      return createManystems;
    }),
  createOnestems: publicProcedure
    .input(stemsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnestems = await ctx.prisma.stems.create(input);
      return createOnestems;
    }),
  deleteManystems: publicProcedure
    .input(stemsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManystems = await ctx.prisma.stems.deleteMany(input);
      return deleteManystems;
    }),
  deleteOnestems: publicProcedure
    .input(stemsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnestems = await ctx.prisma.stems.delete(input);
      return deleteOnestems;
    }),
  findFirststems: publicProcedure
    .input(stemsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirststems = await ctx.prisma.stems.findFirst(input);
      return findFirststems;
    }),
  findFirststemsOrThrow: publicProcedure
    .input(stemsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirststemsOrThrow = await ctx.prisma.stems.findFirstOrThrow(input);
      return findFirststemsOrThrow;
    }),
  findManystems: publicProcedure
    .input(stemsFindManySchema).query(async ({ ctx, input }) => {
      const findManystems = await ctx.prisma.stems.findMany(input);
      return findManystems;
    }),
  findUniquestems: publicProcedure
    .input(stemsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquestems = await ctx.prisma.stems.findUnique(input);
      return findUniquestems;
    }),
  findUniquestemsOrThrow: publicProcedure
    .input(stemsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquestemsOrThrow = await ctx.prisma.stems.findUniqueOrThrow(input);
      return findUniquestemsOrThrow;
    }),
  groupBystems: publicProcedure
    .input(stemsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBystems = await ctx.prisma.stems.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBystems;
    }),
  updateManystems: publicProcedure
    .input(stemsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManystems = await ctx.prisma.stems.updateMany(input);
      return updateManystems;
    }),
  updateOnestems: publicProcedure
    .input(stemsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnestems = await ctx.prisma.stems.update(input);
      return updateOnestems;
    }),
  upsertOnestems: publicProcedure
    .input(stemsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnestems = await ctx.prisma.stems.upsert(input);
      return upsertOnestems;
    }),

}) 
