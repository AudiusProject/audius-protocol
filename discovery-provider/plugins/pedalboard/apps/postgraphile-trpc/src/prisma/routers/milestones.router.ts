import { t, publicProcedure } from "./helpers/createRouter";
import { milestonesAggregateSchema } from "../schemas/aggregatemilestones.schema";
import { milestonesCreateManySchema } from "../schemas/createManymilestones.schema";
import { milestonesCreateOneSchema } from "../schemas/createOnemilestones.schema";
import { milestonesDeleteManySchema } from "../schemas/deleteManymilestones.schema";
import { milestonesDeleteOneSchema } from "../schemas/deleteOnemilestones.schema";
import { milestonesFindFirstSchema } from "../schemas/findFirstmilestones.schema";
import { milestonesFindManySchema } from "../schemas/findManymilestones.schema";
import { milestonesFindUniqueSchema } from "../schemas/findUniquemilestones.schema";
import { milestonesGroupBySchema } from "../schemas/groupBymilestones.schema";
import { milestonesUpdateManySchema } from "../schemas/updateManymilestones.schema";
import { milestonesUpdateOneSchema } from "../schemas/updateOnemilestones.schema";
import { milestonesUpsertSchema } from "../schemas/upsertOnemilestones.schema";

export const milestonesRouter = t.router({
  aggregatemilestones: publicProcedure
    .input(milestonesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatemilestones = await ctx.prisma.milestones.aggregate(input);
      return aggregatemilestones;
    }),
  createManymilestones: publicProcedure
    .input(milestonesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManymilestones = await ctx.prisma.milestones.createMany(input);
      return createManymilestones;
    }),
  createOnemilestones: publicProcedure
    .input(milestonesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnemilestones = await ctx.prisma.milestones.create(input);
      return createOnemilestones;
    }),
  deleteManymilestones: publicProcedure
    .input(milestonesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManymilestones = await ctx.prisma.milestones.deleteMany(input);
      return deleteManymilestones;
    }),
  deleteOnemilestones: publicProcedure
    .input(milestonesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnemilestones = await ctx.prisma.milestones.delete(input);
      return deleteOnemilestones;
    }),
  findFirstmilestones: publicProcedure
    .input(milestonesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstmilestones = await ctx.prisma.milestones.findFirst(input);
      return findFirstmilestones;
    }),
  findFirstmilestonesOrThrow: publicProcedure
    .input(milestonesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstmilestonesOrThrow = await ctx.prisma.milestones.findFirstOrThrow(input);
      return findFirstmilestonesOrThrow;
    }),
  findManymilestones: publicProcedure
    .input(milestonesFindManySchema).query(async ({ ctx, input }) => {
      const findManymilestones = await ctx.prisma.milestones.findMany(input);
      return findManymilestones;
    }),
  findUniquemilestones: publicProcedure
    .input(milestonesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquemilestones = await ctx.prisma.milestones.findUnique(input);
      return findUniquemilestones;
    }),
  findUniquemilestonesOrThrow: publicProcedure
    .input(milestonesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquemilestonesOrThrow = await ctx.prisma.milestones.findUniqueOrThrow(input);
      return findUniquemilestonesOrThrow;
    }),
  groupBymilestones: publicProcedure
    .input(milestonesGroupBySchema).query(async ({ ctx, input }) => {
      const groupBymilestones = await ctx.prisma.milestones.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBymilestones;
    }),
  updateManymilestones: publicProcedure
    .input(milestonesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManymilestones = await ctx.prisma.milestones.updateMany(input);
      return updateManymilestones;
    }),
  updateOnemilestones: publicProcedure
    .input(milestonesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnemilestones = await ctx.prisma.milestones.update(input);
      return updateOnemilestones;
    }),
  upsertOnemilestones: publicProcedure
    .input(milestonesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnemilestones = await ctx.prisma.milestones.upsert(input);
      return upsertOnemilestones;
    }),

}) 
