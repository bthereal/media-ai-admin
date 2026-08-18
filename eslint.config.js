import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Several fetch-on-mount effects intentionally reset loading/error state
      // synchronously before an async call (needed for re-fetches on dependency
      // change, not just initial mount) — accepted pattern, kept visible as a
      // warning rather than blocking CI.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // useAuth()/useTheme() are intentionally colocated with their providers in the
    // same file — a standard React pattern; only affects Fast Refresh smoothness
    // in dev, not correctness or production behavior.
    files: ['src/contexts/AuthContext.tsx', 'src/contexts/ThemeContext.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
