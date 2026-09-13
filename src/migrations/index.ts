import * as migration_20260912_220000_rename_components_to_sections from './20260912_220000_rename_components_to_sections';
import * as migration_20260912_221500_rename_components_id_column from './20260912_221500_rename_components_id_column';
import * as migration_20260913_140025_add_navbar_search_placeholder from './20260913_140025_add_navbar_search_placeholder';

export const migrations = [
  {
    up: migration_20260912_220000_rename_components_to_sections.up,
    down: migration_20260912_220000_rename_components_to_sections.down,
    name: '20260912_220000_rename_components_to_sections',
  },
  {
    up: migration_20260912_221500_rename_components_id_column.up,
    down: migration_20260912_221500_rename_components_id_column.down,
    name: '20260912_221500_rename_components_id_column',
  },
  {
    up: migration_20260913_140025_add_navbar_search_placeholder.up,
    down: migration_20260913_140025_add_navbar_search_placeholder.down,
    name: '20260913_140025_add_navbar_search_placeholder'
  },
];
