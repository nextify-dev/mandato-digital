// .eslintrc.cjs

module.exports = {
  root: true, 
  env: {
    browser: true, 
    es2020: true, 
    node: true, 
  },

  // Extensões recomendadas para React, TS e boas práticas
  extends: [
    'eslint:recommended', 
    'plugin:react/recommended', 
    'plugin:@typescript-eslint/recommended', 
    'plugin:react-hooks/recommended', 
    'plugin:jsx-a11y/recommended', 
    'plugin:import/recommended', 
    'plugin:import/typescript', 
    'plugin:prettier/recommended', 
  ],

  // Ignorar pastas e arquivos gerados ou desnecessários
  ignorePatterns: [
    'dist', 
    '.eslintrc.cjs', 
    'node_modules', 
    '*.min.*', 
    'build', 
  ],

  // Parser para TypeScript
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest', 
    sourceType: 'module', 
    ecmaFeatures: {
      jsx: true, 
    },
  },

  // Plugins usados
  plugins: [
    'react',
    '@typescript-eslint',
    'react-hooks',
    'jsx-a11y',
    'import', 
    'react-refresh', 
  ],

  // Configurações específicas
  settings: {
    react: {
      version: 'detect', 
    },
    'import/resolver': {
      typescript: true, 
      node: true, 
    },
  },

  // Regras customizadas
  rules: {
    // React
    'react/react-in-jsx-scope': 'off', 
    'react/prop-types': 'off', 
    'react/self-closing-comp': ['error', { component: true, html: true }], 
    'react/no-unknown-property': ['error', { ignore: ['css'] }], 
    'react/jsx-no-useless-fragment': 'warn', 

    // TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], 
    '@typescript-eslint/no-explicit-any': 'warn', 
    '@typescript-eslint/ban-ts-comment': 'warn', 
    '@typescript-eslint/explicit-module-boundary-types': 'off', 

    // Acessibilidade (JSX-A11y)
    'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
    'jsx-a11y/aria-props': 'warn',
    'jsx-a11y/aria-proptypes': 'warn',
    'jsx-a11y/aria-unsupported-elements': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',

    // Imports
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always', 
        alphabetize: { order: 'asc', caseInsensitive: true }, 
      },
    ],
    'import/no-unresolved': 'error', 

    // Geral
    'no-empty-pattern': 'off', 
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ], 

    // Desativar regras menos úteis ou redundantes com TS
    'no-undef': 'off', 
    'no-dupe-keys': 'error', 
  },
};