import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(`ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "components_id" TO "sections_id"`))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "sections_id" TO "components_id"`))
}
