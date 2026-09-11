import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // Catches the specific mistake of hardcoded dev/placeholder domain
    // strings (localhost, 127.0.0.1, example.com/.org) baked directly into
    // application logic instead of coming from real config/env. This
    // won't catch every anti-pattern (most need reasoning about runtime
    // behavior, not syntax), but this one specific shape is genuinely
    // detectable statically.
    //
    // Excludes files with confirmed-legitimate uses: playwright.config.ts's
    // local webServer URL, and this config file's
    // own rule definition (the pattern text itself is a string literal).
    ignores: ['eslint.config.mjs', 'playwright.config.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'Literal[value=/localhost|127\\.0\\.0\\.1|example\\.(com|org)/i]',
          message:
            'Hardcoded dev/placeholder domain found in application code. If this is a real config value, it should come from an environment variable, not a string literal.',
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/payload-types.ts',
    'src/payload-generated-schema.ts',
  ]),
])

export default eslintConfig
