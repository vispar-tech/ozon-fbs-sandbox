import love from 'eslint-config-love'

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
      // Сгенерированный openapi-typescript файл (70k строк): линт не нужен и медленный
      'shared/src/generated/**',
      // Plain JS outside any tsconfig: type-aware love rules can't parse it
      'eslint.config.js'
    ]
  },
  {
    ...love,
    files: ['**/*.{js,ts,tsx}']
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
    files: ['client/**/*.{ts,tsx}'],
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