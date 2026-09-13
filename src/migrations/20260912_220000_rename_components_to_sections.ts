import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

const tableRenames: [string, string][] = [
  ['components', 'sections'],
  ['components_locales', 'sections_locales'],
  ['components_blocks_navbar', 'sections_blocks_navbar'],
  ['components_blocks_navbar_locales', 'sections_blocks_navbar_locales'],
  ['components_blocks_navbar_links', 'sections_blocks_navbar_links'],
  ['components_blocks_navbar_links_locales', 'sections_blocks_navbar_links_locales'],
  ['_components_v', '_sections_v'],
  ['_components_v_locales', '_sections_v_locales'],
  ['_components_v_blocks_navbar', '_sections_v_blocks_navbar'],
  ['_components_v_blocks_navbar_locales', '_sections_v_blocks_navbar_locales'],
  ['_components_v_blocks_navbar_links', '_sections_v_blocks_navbar_links'],
  ['_components_v_blocks_navbar_links_locales', '_sections_v_blocks_navbar_links_locales'],
]

const enumRenames: [string, string][] = [
  ['enum_components_status', 'enum_sections_status'],
  ['enum__components_v_published_locale', 'enum__sections_v_published_locale'],
  ['enum__components_v_version_status', 'enum__sections_v_version_status'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [from, to] of tableRenames) {
    await db.execute(sql.raw(`ALTER TABLE "${from}" RENAME TO "${to}"`))
  }
  for (const [from, to] of enumRenames) {
    await db.execute(sql.raw(`ALTER TYPE "${from}" RENAME TO "${to}"`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [from, to] of tableRenames) {
    await db.execute(sql.raw(`ALTER TABLE "${to}" RENAME TO "${from}"`))
  }
  for (const [from, to] of enumRenames) {
    await db.execute(sql.raw(`ALTER TYPE "${to}" RENAME TO "${from}"`))
  }
}
