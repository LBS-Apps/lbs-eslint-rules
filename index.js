import { createRequire } from 'node:module';
import babelParser from '@babel/eslint-parser';
import formFieldIdName from './rules/form-field-id-name.js';
import noNativeDateInput from './rules/no-native-date-input.js';
import noIlDateFormat from './rules/no-il-date-format.js';

/** ESLint plugin exposing the LBS UI rules. */
export const plugin = {
  meta: { name: '@lbs/eslint-config', version: '0.4.2' },
  rules: {
    'form-field-id-name': formFieldIdName,
    'no-native-date-input': noNativeDateInput,
    'no-il-date-format': noIlDateFormat,
  },
};

// Resolve the babel presets to ABSOLUTE paths from this package, so babel finds
// them regardless of the consuming repo's layout — critical in npm-workspace
// monorepos where the presets hoist to the root node_modules and babel's
// file-relative resolution (from apps/*/) would otherwise miss them.
const req = createRequire(import.meta.url);
const PRESET_REACT = req.resolve('@babel/preset-react');
const PRESET_TS = req.resolve('@babel/preset-typescript');

const BASE = {
  'lbs/form-field-id-name': 'error',
  'lbs/no-native-date-input': 'error',
  // error since v0.5.0: the rule now exempts the 'en-CA' + timeZone ISO-key
  // idiom, so the remaining findings are genuine display bugs. `surface` still
  // holds it at warn for repos mid-adoption.
  'lbs/no-il-date-format': 'error',
};

function config(overrides) {
  return [
    {
      files: ['**/*.{jsx,tsx}'],
      // Ignore the repo's inline eslint directives. A fresh adoption often has
      // `// eslint-disable-next-line react-hooks/...` comments referencing rules
      // this config doesn't load, which ESLint would otherwise report as
      // "rule not found" errors. Our rules are advisory and independent, so we
      // don't honor inline suppressions anyway.
      linterOptions: { noInlineConfig: true },
      languageOptions: {
        // Babel parser: TS-version-agnostic (typescript-eslint's parser caps at
        // TS <6.1, so it breaks on TS 7 repos). The LBS rules are purely
        // syntactic (JSX/Literal nodes), so a type-aware parser isn't needed.
        parser: babelParser,
        sourceType: 'module',
        parserOptions: {
          requireConfigFile: false,
          babelOptions: {
            presets: [[PRESET_REACT, { runtime: 'automatic' }], PRESET_TS],
          },
        },
      },
      plugins: { lbs: plugin },
      rules: { ...BASE, ...overrides },
    },
  ];
}

/**
 * Default (strict): all rules at full strength. Use for new/clean repos.
 *   import lbs from '@lbs/eslint-config';
 *   export default [ ...lbs ];
 */
export default config();

/**
 * Legacy: for repos with a pre-existing id/name backlog. Downgrades
 * form-field-id-name to a warning so CI isn't broken on day 1 — surfaced,
 * not blocking. New code is still hard-blocked by the lbs-guard hook.
 * Burn down the backlog, then switch to the default (strict) export.
 *   import { legacy } from '@lbs/eslint-config';
 *   export default [ ...legacy ];
 */
export const legacy = config({ 'lbs/form-field-id-name': 'warn' });

/**
 * Surface: ALL rules at warn. For a fresh adoption into a repo with an unknown
 * backlog — nothing blocks CI/deploy, everything is surfaced. Fix each backlog,
 * then flip rules to error (default/strict) one at a time.
 *   import { surface } from '@lbs/eslint-config';
 *   export default [ ...surface ];
 */
export const surface = config({
  'lbs/form-field-id-name': 'warn',
  'lbs/no-native-date-input': 'warn',
  'lbs/no-il-date-format': 'warn',
});
