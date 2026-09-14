/**
 * Flag non-Israeli date formats in UI code:
 *  - ISO literal  "2026-07-23"
 *  - US literal   "7/23/2026"
 *  - toLocaleDateString('en…')
 * User-facing dates must be DD.MM.YYYY (e.g. 23.07.2026).
 *
 * Exception — the timezone-safe ISO-key idiom:
 *   toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
 * 'en-CA' formats as YYYY-MM-DD, so paired with an explicit `timeZone` this is
 * the standard way to derive a *date key* for a given zone (map lookups, state,
 * comparisons) — a computation, not a display. Without a `timeZone` option the
 * call is still reported: it is then zone-dependent and far more likely to be
 * rendering an ISO string at the user.
 */
const ISO = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2})?$/;
const US = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

// Test/spec/fixture files — exempt (see the note in create()).
const TEST_FILE = /(?:\.(?:test|spec)\.[cm]?[jt]sx?$)|(?:[\\/](?:__tests__|__mocks__|__fixtures__|tests?|fixtures)[\\/])/i;

// True for `{ …, timeZone: <anything>, … }` — an object literal carrying an
// explicit timeZone property (shorthand `{ timeZone }` included).
function hasTimeZoneOption(node) {
  if (!node || node.type !== 'ObjectExpression') return false;
  return node.properties.some(
    (p) =>
      p.type === 'Property' &&
      ((p.key.type === 'Identifier' && p.key.name === 'timeZone') ||
        (p.key.type === 'Literal' && p.key.value === 'timeZone')),
  );
}

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'User-facing dates must be DD.MM.YYYY' },
    messages: {
      iso: 'ISO-format date literal "{{v}}" — user-facing dates must be DD.MM.YYYY.',
      us: 'US-format date literal "{{v}}" — user-facing dates must be DD.MM.YYYY.',
      enLocale: "toLocaleDateString('en…') — use an explicit DD.MM.YYYY formatter instead.",
    },
    schema: [],
  },
  create(context) {
    // Test files are exempt entirely. This rule governs what a USER READS, and a
    // test file has no user-facing surface — its date literals are machine-format
    // fixtures, which is exactly what they should be. Measured case: promoting
    // this rule to error in one consuming app produced 75 errors, every single
    // one an ISO literal inside client/src/lib/*.test.js of the form
    //   assert.equal(inDateRange('2024-05-03', '2024-05-01', ''), true)
    // Rewriting those to DD.MM.YYYY would have destroyed what the tests assert.
    // (That repo also runs `eslint src` from a `prebuild` script and auto-deploys,
    // so the flip would have aborted the client build on every deploy.)
    if (TEST_FILE.test(context.filename ?? context.getFilename?.() ?? '')) return {};

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        if (ISO.test(node.value)) context.report({ node, messageId: 'iso', data: { v: node.value } });
        else if (US.test(node.value)) context.report({ node, messageId: 'us', data: { v: node.value } });
      },
      CallExpression(node) {
        const c = node.callee;
        if (c.type !== 'MemberExpression' || c.property.type !== 'Identifier') return;
        if (c.property.name !== 'toLocaleDateString') return;
        const arg = node.arguments[0];
        if (!(arg && arg.type === 'Literal' && typeof arg.value === 'string' && /^en/i.test(arg.value))) return;
        // ISO-key idiom: 'en-CA' + an explicit timeZone → a date key, not display.
        if (/^en-CA$/i.test(arg.value) && hasTimeZoneOption(node.arguments[1])) return;
        context.report({ node, messageId: 'enLocale' });
      },
    };
  },
};
