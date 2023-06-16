import { t, publicProcedure } from "./helpers/createRouter";
import { chatAggregateSchema } from "../schemas/aggregatechat.schema";
import { chatCreateManySchema } from "../schemas/createManychat.schema";
import { chatCreateOneSchema } from "../schemas/createOnechat.schema";
import { chatDeleteManySchema } from "../schemas/deleteManychat.schema";
import { chatDeleteOneSchema } from "../schemas/deleteOnechat.schema";
import { chatFindFirstSchema } from "../schemas/findFirstchat.schema";
import { chatFindManySchema } from "../schemas/findManychat.schema";
import { chatFindUniqueSchema } from "../schemas/findUniquechat.schema";
import { chatGroupBySchema } from "../schemas/groupBychat.schema";
import { chatUpdateManySchema } from "../schemas/updateManychat.schema";
import { chatUpdateOneSchema } from "../schemas/updateOnechat.schema";
import { chatUpsertSchema } from "../schemas/upsertOnechat.schema";

export const chatsRouter = t.router({
  aggregatechat: publicProcedure
    .input(chatAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechat = await ctx.prisma.chat.aggregate(input);
      return aggregatechat;
    }),
  createManychat: publicProcedure
    .input(chatCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychat = await ctx.prisma.chat.createMany(input);
      return createManychat;
    }),
  createOnechat: publicProcedure
    .input(chatCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechat = await ctx.prisma.chat.create(input);
      return createOnechat;
    }),
  deleteManychat: publicProcedure
    .input(chatDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychat = await ctx.prisma.chat.deleteMany(input);
      return deleteManychat;
    }),
  deleteOnechat: publicProcedure
    .input(chatDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechat = await ctx.prisma.chat.delete(input);
      return deleteOnechat;
    }),
  findFirstchat: publicProcedure
    .input(chatFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat = await ctx.prisma.chat.findFirst(input);
      return findFirstchat;
    }),
  findFirstchatOrThrow: publicProcedure
    .input(chatFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchatOrThrow = await ctx.prisma.chat.findFirstOrThrow(input);
      return findFirstchatOrThrow;
    }),
  findManychat: publicProcedure
    .input(chatFindManySchema).query(async ({ ctx, input }) => {
      const findManychat = await ctx.prisma.chat.findMany(input);
      return findManychat;
    }),
  findUniquechat: publicProcedure
    .input(chatFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat = await ctx.prisma.chat.findUnique(input);
      return findUniquechat;
    }),
  findUniquechatOrThrow: publicProcedure
    .input(chatFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechatOrThrow = await ctx.prisma.chat.findUniqueOrThrow(input);
      return findUniquechatOrThrow;
    }),
  groupBychat: publicProcedure
    .input(chatGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychat = await ctx.prisma.chat.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychat;
    }),
  updateManychat: publicProcedure
    .input(chatUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychat = await ctx.prisma.chat.updateMany(input);
      return updateManychat;
    }),
  updateOnechat: publicProcedure
    .input(chatUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechat = await ctx.prisma.chat.update(input);
      return updateOnechat;
    }),
  upsertOnechat: publicProcedure
    .input(chatUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechat = await ctx.prisma.chat.upsert(input);
      return upsertOnechat;
    }),

}) 
