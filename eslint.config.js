import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'server/dist']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      /*
        The route tree is mounted twice, at `/` and at `/uk` (P18), so an absolute path written in a
        component is ambiguous: `<Link to="/levels">` on `/uk/about` sends a Ukrainian reader into
        the English tree, silently. `src/app/navigation.tsx` wraps these four to apply the current
        language's prefix, and this rule is the only thing stopping the next link from skipping it.
      */
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router-dom',
              importNames: ['Link', 'NavLink', 'Navigate', 'useNavigate'],
              message:
                'Import these from `src/app/navigation` instead, so links carry the current language prefix.',
            },
          ],
        },
      ],
    },
  },
  {
    // The two files that define and mount the wrappers, and so have to reach the originals.
    files: ['src/app/navigation.tsx', 'src/app/AppRouter.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    /*
      `navigation.tsx` exports two components and three hooks, which Fast Refresh would rather were
      in separate files. Splitting them would mean two import paths for one idea — and the message
      above tells people to import "from `src/app/navigation`", singular. Naming the hooks keeps the
      rule enforcing everything else about the file; the only cost is a full reload when this file
      itself is edited, which is close to never.
    */
    files: ['src/app/navigation.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['useLanguage', 'useNavigate', 'useSwitchLanguage'] },
      ],
    },
  },
  {
    files: ['server/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
  {
    // The shared game rules run in both the browser bundle and on the server, so no environment
    // globals are declared here on purpose — this code must not reach for `window` or `process`.
    files: ['shared/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
    },
  },
])
