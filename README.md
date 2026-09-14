# @lbs/eslint-config

Three ESLint rules that enforce the UI conventions shared by the LBS web apps:

| Rule | What it enforces |
|---|---|
| `lbs/form-field-id-name` | Every `<input>`, `<select>` and `<textarea>` carries both an `id` and a `name` (unique per row inside a `.map()`), so browser tooling never reports a field without one. |
| `lbs/no-il-date-format` | User-facing date literals are written `DD.MM.YYYY` (then 24-hour time), never ISO or US order. Test files are exempt – their fixtures are machine dates. |
| `lbs/no-native-date-input` | Date entry uses a real calendar picker component, never a bare `<input type="date">`. |

## Usage

```js
// eslint.config.mjs
import lbs from '@lbs/eslint-config';          // all three rules at "error"
// import { legacy } from '@lbs/eslint-config'; // form-field rule at "warn" for old trees
// import { surface } from '@lbs/eslint-config'; // everything at "warn" for a fresh adoption
// import { plugin } from '@lbs/eslint-config';  // rules only, bring your own parser

export default [...lbs];
```

Install straight from GitHub – the package is public, no credentials needed:

```
npm i -D "github:LBS-Apps/lbs-eslint-rules#v0.5.1"
```

The parser is `@babel/eslint-parser` with the React and TypeScript presets, so the same config
covers `.js`, `.jsx`, `.ts` and `.tsx` without a per-repo TypeScript parser.

## Tests

```
npm test
```

Runs the rule tests against ESLint 9 and 10 in CI.

## License

UNLICENSED – all rights reserved. Published for installation convenience, not for reuse.
