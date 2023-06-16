import { t, publicProcedure } from "./helpers/createRouter";
import { schema_migrationsAggregateSchema } from "../schemas/aggregateschema_migrations.schema";
import { schema_migrationsCreateManySchema } from "../schemas/createManyschema_migrations.schema";
import { schema_migrationsCreateOneSchema } from "../schemas/createOneschema_migrations.schema";
import { schema_migrationsDeleteManySchema } from "../schemas/deleteManyschema_migrations.schema";
import { schema_migrationsDeleteOneSchema } from "../schemas/deleteOneschema_migrations.schema";
import { schema_migrationsFindFirstSchema } from "../schemas/findFirstschema_migrations.schema";
import { schema_migrationsFindManySchema } from "../schemas/findManyschema_migrations.schema";
import { schema_migrationsFindUniqueSchema } from "../schemas/findUniqueschema_migrations.schema";
import { schema_migrationsGroupBySchema } from "../schemas/groupByschema_migrations.schema";
import { schema_migrationsUpdateManySchema } from "../schemas/updateManyschema_migrations.schema";
import { schema_migrationsUpdateOneSchema } from "../schemas/updateOneschema_migrations.schema";
import { schema_migrationsUpsertSchema } from "../schemas/upsertOneschema_migrations.schema";

export const schema_migrationsRouter = t.router({
  aggregateschema_migrations: publicProcedure
    .input(schema_migrationsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateschema_migrations = await ctx.prisma.schema_migrations.aggregate(input);
      return aggregateschema_migrations;
    }),
  createManyschema_migrations: publicProcedure
    .input(schema_migrationsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyschema_migrations = await ctx.prisma.schema_migrations.createMany(input);
      return createManyschema_migrations;
    }),
  createOneschema_migrations: publicProcedure
    .input(schema_migrationsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneschema_migrations = await ctx.prisma.schema_migrations.create(input);
      return createOneschema_migrations;
    }),
  deleteManyschema_migrations: publicProcedure
    .input(schema_migrationsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyschema_migrations = await ctx.prisma.schema_migrations.deleteMany(input);
      return deleteManyschema_migrations;
    }),
  deleteOneschema_migrations: publicProcedure
    .input(schema_migrationsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneschema_migrations = await ctx.prisma.schema_migrations.delete(input);
      return deleteOneschema_migrations;
    }),
  findFirstschema_migrations: publicProcedure
    .input(schema_migrationsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstschema_migrations = await ctx.prisma.schema_migrations.findFirst(input);
      return findFirstschema_migrations;
    }),
  findFirstschema_migrationsOrThrow: publicProcedure
    .input(schema_migrationsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstschema_migrationsOrThrow = await ctx.prisma.schema_migrations.findFirstOrThrow(input);
      return findFirstschema_migrationsOrThrow;
    }),
  findManyschema_migrations: publicProcedure
    .input(schema_migrationsFindManySchema).query(async ({ ctx, input }) => {
      const findManyschema_migrations = await ctx.prisma.schema_migrations.findMany(input);
      return findManyschema_migrations;
    }),
  findUniqueschema_migrations: publicProcedure
    .input(schema_migrationsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueschema_migrations = await ctx.prisma.schema_migrations.findUnique(input);
      return findUniqueschema_migrations;
    }),
  findUniqueschema_migrationsOrThrow: publicProcedure
    .input(schema_migrationsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueschema_migrationsOrThrow = await ctx.prisma.schema_migrations.findUniqueOrThrow(input);
      return findUniqueschema_migrationsOrThrow;
    }),
  groupByschema_migrations: publicProcedure
    .input(schema_migrationsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByschema_migrations = await ctx.prisma.schema_migrations.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByschema_migrations;
    }),
  updateManyschema_migrations: publicProcedure
    .input(schema_migrationsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyschema_migrations = await ctx.prisma.schema_migrations.updateMany(input);
      return updateManyschema_migrations;
    }),
  updateOneschema_migrations: publicProcedure
    .input(schema_migrationsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneschema_migrations = await ctx.prisma.schema_migrations.update(input);
      return updateOneschema_migrations;
    }),
  upsertOneschema_migrations: publicProcedure
    .input(schema_migrationsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneschema_migrations = await ctx.prisma.schema_migrations.upsert(input);
      return upsertOneschema_migrations;
    }),

}) 
