import { t, publicProcedure } from "./helpers/createRouter";
import { chat_memberAggregateSchema } from "../schemas/aggregatechat_member.schema";
import { chat_memberCreateManySchema } from "../schemas/createManychat_member.schema";
import { chat_memberCreateOneSchema } from "../schemas/createOnechat_member.schema";
import { chat_memberDeleteManySchema } from "../schemas/deleteManychat_member.schema";
import { chat_memberDeleteOneSchema } from "../schemas/deleteOnechat_member.schema";
import { chat_memberFindFirstSchema } from "../schemas/findFirstchat_member.schema";
import { chat_memberFindManySchema } from "../schemas/findManychat_member.schema";
import { chat_memberFindUniqueSchema } from "../schemas/findUniquechat_member.schema";
import { chat_memberGroupBySchema } from "../schemas/groupBychat_member.schema";
import { chat_memberUpdateManySchema } from "../schemas/updateManychat_member.schema";
import { chat_memberUpdateOneSchema } from "../schemas/updateOnechat_member.schema";
import { chat_memberUpsertSchema } from "../schemas/upsertOnechat_member.schema";

export const chat_membersRouter = t.router({
  aggregatechat_member: publicProcedure
    .input(chat_memberAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechat_member = await ctx.prisma.chat_member.aggregate(input);
      return aggregatechat_member;
    }),
  createManychat_member: publicProcedure
    .input(chat_memberCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychat_member = await ctx.prisma.chat_member.createMany(input);
      return createManychat_member;
    }),
  createOnechat_member: publicProcedure
    .input(chat_memberCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechat_member = await ctx.prisma.chat_member.create(input);
      return createOnechat_member;
    }),
  deleteManychat_member: publicProcedure
    .input(chat_memberDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychat_member = await ctx.prisma.chat_member.deleteMany(input);
      return deleteManychat_member;
    }),
  deleteOnechat_member: publicProcedure
    .input(chat_memberDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechat_member = await ctx.prisma.chat_member.delete(input);
      return deleteOnechat_member;
    }),
  findFirstchat_member: publicProcedure
    .input(chat_memberFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_member = await ctx.prisma.chat_member.findFirst(input);
      return findFirstchat_member;
    }),
  findFirstchat_memberOrThrow: publicProcedure
    .input(chat_memberFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_memberOrThrow = await ctx.prisma.chat_member.findFirstOrThrow(input);
      return findFirstchat_memberOrThrow;
    }),
  findManychat_member: publicProcedure
    .input(chat_memberFindManySchema).query(async ({ ctx, input }) => {
      const findManychat_member = await ctx.prisma.chat_member.findMany(input);
      return findManychat_member;
    }),
  findUniquechat_member: publicProcedure
    .input(chat_memberFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_member = await ctx.prisma.chat_member.findUnique(input);
      return findUniquechat_member;
    }),
  findUniquechat_memberOrThrow: publicProcedure
    .input(chat_memberFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_memberOrThrow = await ctx.prisma.chat_member.findUniqueOrThrow(input);
      return findUniquechat_memberOrThrow;
    }),
  groupBychat_member: publicProcedure
    .input(chat_memberGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychat_member = await ctx.prisma.chat_member.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychat_member;
    }),
  updateManychat_member: publicProcedure
    .input(chat_memberUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychat_member = await ctx.prisma.chat_member.updateMany(input);
      return updateManychat_member;
    }),
  updateOnechat_member: publicProcedure
    .input(chat_memberUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechat_member = await ctx.prisma.chat_member.update(input);
      return updateOnechat_member;
    }),
  upsertOnechat_member: publicProcedure
    .input(chat_memberUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechat_member = await ctx.prisma.chat_member.upsert(input);
      return upsertOnechat_member;
    }),

}) 
