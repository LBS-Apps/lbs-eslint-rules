import { test } from 'node:test';
import { RuleTester } from 'eslint';
import babelParser from '@babel/eslint-parser';

import formFieldIdName from '../rules/form-field-id-name.js';
import noNativeDateInput from '../rules/no-native-date-input.js';
import noIlDateFormat from '../rules/no-il-date-format.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: babelParser,
    parserOptions: {
      requireConfigFile: false,
      babelOptions: {
        presets: [['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
      },
    },
  },
});

test('form-field-id-name', () => {
  ruleTester.run('form-field-id-name', formFieldIdName, {
    valid: [
      { code: 'const A = () => <input id="q" name="q" />;', filename: 'A.tsx' },
      { code: 'const A = () => <select id="s" name="s" />;', filename: 'A.tsx' },
      { code: 'const A = () => <textarea id="t" name="t" />;', filename: 'A.tsx' },
      { code: 'const A = (props) => <input {...props} type="text" />;', filename: 'A.tsx' }, // spread → skip
      { code: 'const A = () => <div className="x" />;', filename: 'A.tsx' }, // not a field
      { code: 'const A = () => <input id={`row-${k}`} name={`row-${k}`} />;', filename: 'A.tsx' },
      { code: 'const A = () => <input type="hidden" name="tok" />;', filename: 'A.tsx' }, // hidden → skip
      { code: 'const A = () => <input type="submit" />;', filename: 'A.tsx' }, // submit → skip
      { code: 'const A = () => <button type="button" id="b" />;', filename: 'A.tsx' }, // button el, not a field
    ],
    invalid: [
      { code: 'const A = () => <input type="text" aria-label="q" />;', filename: 'A.tsx', errors: [{ messageId: 'missing' }] },
      { code: 'const A = () => <input id="q" />;', filename: 'A.tsx', errors: [{ messageId: 'missing' }] },
      { code: 'const A = () => <select name="s" />;', filename: 'A.tsx', errors: [{ messageId: 'missing' }] },
      { code: 'const A = () => <textarea aria-label="t" />;', filename: 'A.tsx', errors: [{ messageId: 'missing' }] },
    ],
  });
});

test('no-native-date-input', () => {
  ruleTester.run('no-native-date-input', noNativeDateInput, {
    valid: [
      { code: 'const A = () => <input id="d" name="d" type="text" />;', filename: 'A.tsx' },
      { code: 'const A = () => <DatePicker value={d} />;', filename: 'A.tsx' },
    ],
    invalid: [
      { code: 'const A = () => <input id="d" name="d" type="date" />;', filename: 'A.tsx', errors: [{ messageId: 'native' }] },
      { code: 'const A = () => <input id="d" name="d" type={"date"} />;', filename: 'A.tsx', errors: [{ messageId: 'native' }] },
    ],
  });
});

test('no-il-date-format', () => {
  ruleTester.run('no-il-date-format', noIlDateFormat, {
    valid: [
      { code: 'const d = "23.07.2026";', filename: 'A.tsx' },
      { code: 'const d = fmtDateTime(x);', filename: 'A.tsx' },
      { code: 'const s = d.toLocaleDateString("he-IL");', filename: 'A.tsx' },
      { code: 'const id = "abc-123";', filename: 'A.tsx' },
      // ISO-key idiom: 'en-CA' + explicit timeZone derives a YYYY-MM-DD key for a
      // zone. A computation (map keys, state, comparisons), never rendered.
      { code: 'const k = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });', filename: 'A.tsx' },
      { code: 'const k = d.toLocaleDateString("en-CA", { timeZone: TZ });', filename: 'A.tsx' },
      { code: 'const k = d.toLocaleDateString("en-CA", { timeZone });', filename: 'A.tsx' }, // shorthand
      { code: 'const k = d.toLocaleDateString("en-CA", { "timeZone": TZ });', filename: 'A.tsx' }, // string key
      // Test files are exempt entirely — ISO literals there are machine-format
      // fixtures, not something a user reads.
      { code: 'assert.equal(inDateRange("2024-05-03", "2024-05-01", ""), true);', filename: 'graduatesDate.test.js' },
      { code: 'const d = "2026-07-23";', filename: 'expiry.test.js' },
      { code: 'const d = "7/23/2026";', filename: 'a.spec.ts' },
      { code: 'const s = d.toLocaleDateString("en-US");', filename: 'dateField.test.jsx' },
      { code: 'const d = "2026-07-23";', filename: '/repo/src/__tests__/helper.js' },
      { code: 'const d = "2026-07-23";', filename: '/repo/server/tests/api.js' },
    ],
    invalid: [
      { code: 'const d = "2026-07-23";', filename: 'A.tsx', errors: [{ messageId: 'iso' }] },
      { code: 'const d = "2026-07-23T10:30";', filename: 'A.tsx', errors: [{ messageId: 'iso' }] },
      { code: 'const d = "7/23/2026";', filename: 'A.tsx', errors: [{ messageId: 'us' }] },
      { code: 'const s = d.toLocaleDateString("en-US");', filename: 'A.tsx', errors: [{ messageId: 'enLocale' }] },
      // en-CA without a timeZone is zone-dependent — still reported.
      { code: 'const s = d.toLocaleDateString("en-CA");', filename: 'A.tsx', errors: [{ messageId: 'enLocale' }] },
      // The exemption is en-CA only; en-US + timeZone is still a US-format display.
      { code: 'const s = d.toLocaleDateString("en-US", { timeZone: "Asia/Jerusalem" });', filename: 'A.tsx', errors: [{ messageId: 'enLocale' }] },
      // Options object without timeZone is display formatting, not a key.
      { code: 'const s = d.toLocaleDateString("en-CA", { day: "2-digit" });', filename: 'A.tsx', errors: [{ messageId: 'enLocale' }] },
    ],
  });
});
