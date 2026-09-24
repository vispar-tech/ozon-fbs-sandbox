import love from 'eslint-config-love'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const noSeparatorComments = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow comment lines used as visual separators (e.g. // ---)' },
    messages: { unexpected: 'Remove separator comment.' },
    schema: []
  },
  create (context) {
    return {
      Program () {
        const sourceCode = context.sourceCode
        for (const comment of sourceCode.getAllComments()) {
          if (/^[-=*_]{3,}$/.test(comment.value.trim())) {
            context.report({ node: comment, messageId: 'unexpected' })
          }
        }
      }
    }
  }
}

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      // Plain JS outside any tsconfig: type-aware love rules can't parse it
      'eslint.config.js',
      // 3.1 MB generated OpenAPI types: type-aware love rules can't handle it
      'src/shared/model/generated/**'
    ]
  },
  {
    ...love,
    files: ['**/*.{js,ts,tsx}']
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      'simple-import-sort/imports': ['error', {
        groups: [
          // Side-effect imports (CSS и т.п.)
          ['^\\u0000'],
          // Node.js builtins
          ['^node:'],
          // Внешние npm-пакеты (react, zod и остальные)
          ['^@?\\w'],
          // Родительские относительные импорты
          ['^\\.(?!/?$)', '^\\.\\./?$'],
          // Соседние относительные импорты
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$']
        ]
      }],
      'simple-import-sort/exports': 'error'
    }
  },
  {
    plugins: {
      'no-separators': { rules: { 'no-separator-comments': noSeparatorComments } }
    },
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      'no-separators/no-separator-comments': 'error'
    }
  },
  {
    // React/UI-код: 0 и 1 идиоматичны (useState(0), count + 1)
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-magic-numbers': ['error', { ignore: [0, 1] }]
    }
  },
  {
    // Тесты: литералы это ожидаемые значения, правило контрпродуктивно
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off'
    }
  }
]
