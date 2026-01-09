/**
 * ⚔️ APEX Shared ESLint Configuration
 * ZERO TOLERANCE for console.log in production
 * 
 * Part of Operation Phoenix - Phase 2 STANDARDIZE
 */

module.exports = {
    extends: ['next/core-web-vitals'],
    rules: {
        // ⚔️ MILITARY RULES - ZERO TOLERANCE
        'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
        'no-debugger': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

        // Security
        'no-eval': 'error',
        'no-new-func': 'error',

        // Quality
        'prefer-const': 'warn',
        'no-var': 'error',
        'eqeqeq': ['error', 'always', { null: 'ignore' }],

        // React
        'react/no-unescaped-entities': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
    overrides: [
        {
            // Allow console in development files
            files: ['**/*.dev.ts', '**/*.dev.tsx', '**/scripts/**'],
            rules: {
                'no-console': 'off',
            },
        },
    ],
};
