import { pgTable, uuid, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type { UBIMFamilyAST } from '@nexusbim/bim-schema';

export const familiesTable = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  lod: integer('lod').notNull().default(300),
  astPayload: jsonb('ast_payload').$type<UBIMFamilyAST>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});