import { t, publicProcedure } from "./helpers/createRouter";
import { chat_banAggregateSchema } from "../schemas/aggregatechat_ban.schema";
import { chat_banCreateManySchema } from "../schemas/createManychat_ban.schema";
import { chat_banCreateOneSchema } from "../schemas/createOnechat_ban.schema";
import { chat_banDeleteManySchema } from "../schemas/deleteManychat_ban.schema";
import { chat_banDeleteOneSchema } from "../schemas/deleteOnechat_ban.schema";
import { chat_banFindFirstSchema } from "../schemas/findFirstchat_ban.schema";
import { chat_banFindManySchema } from "../schemas/findManychat_ban.schema";
import { chat_banFindUniqueSchema } from "../schemas/findUniquechat_ban.schema";
import { chat_banGroupBySchema } from "../schemas/groupBychat_ban.schema";
import { chat_banUpdateManySchema } from "../schemas/updateManychat_ban.schema";
import { chat_banUpdateOneSchema } from "../schemas/updateOnechat_ban.schema";
import { chat_banUpsertSchema } from "../schemas/upsertOnechat_ban.schema";

export const chat_bansRouter = t.router({
  aggregatechat_ban: publicProcedure
    .input(chat_banAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechat_ban = await ctx.prisma.chat_ban.aggregate(input);
      return aggregatechat_ban;
    }),
  createManychat_ban: publicProcedure
    .input(chat_banCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychat_ban = await ctx.prisma.chat_ban.createMany(input);
      return createManychat_ban;
    }),
  createOnechat_ban: publicProcedure
    .input(chat_banCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechat_ban = await ctx.prisma.chat_ban.create(input);
      return createOnechat_ban;
    }),
  deleteManychat_ban: publicProcedure
    .input(chat_banDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychat_ban = await ctx.prisma.chat_ban.deleteMany(input);
      return deleteManychat_ban;
    }),
  deleteOnechat_ban: publicProcedure
    .input(chat_banDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechat_ban = await ctx.prisma.chat_ban.delete(input);
      return deleteOnechat_ban;
    }),
  findFirstchat_ban: publicProcedure
    .input(chat_banFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_ban = await ctx.prisma.chat_ban.findFirst(input);
      return findFirstchat_ban;
    }),
  findFirstchat_banOrThrow: publicProcedure
    .input(chat_banFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_banOrThrow = await ctx.prisma.chat_ban.findFirstOrThrow(input);
      return findFirstchat_banOrThrow;
    }),
  findManychat_ban: publicProcedure
    .input(chat_banFindManySchema).query(async ({ ctx, input }) => {
      const findManychat_ban = await ctx.prisma.chat_ban.findMany(input);
      return findManychat_ban;
    }),
  findUniquechat_ban: publicProcedure
    .input(chat_banFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_ban = await ctx.prisma.chat_ban.findUnique(input);
      return findUniquechat_ban;
    }),
  findUniquechat_banOrThrow: publicProcedure
    .input(chat_banFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_banOrThrow = await ctx.prisma.chat_ban.findUniqueOrThrow(input);
      return findUniquechat_banOrThrow;
    }),
  groupBychat_ban: publicProcedure
    .input(chat_banGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychat_ban = await ctx.prisma.chat_ban.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychat_ban;
    }),
  updateManychat_ban: publicProcedure
    .input(chat_banUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychat_ban = await ctx.prisma.chat_ban.updateMany(input);
      return updateManychat_ban;
    }),
  updateOnechat_ban: publicProcedure
    .input(chat_banUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechat_ban = await ctx.prisma.chat_ban.update(input);
      return updateOnechat_ban;
    }),
  upsertOnechat_ban: publicProcedure
    .input(chat_banUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechat_ban = await ctx.prisma.chat_ban.upsert(input);
      return upsertOnechat_ban;
    }),

}) 
