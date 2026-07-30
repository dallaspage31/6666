import js from '@eslint/js'
import globals from 'globals'
import next from 'eslint-config-next'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  next,
  {
    ignores: ['node_modules', '.next', 'out', 'build', 'dist', 'public'],
  },
]