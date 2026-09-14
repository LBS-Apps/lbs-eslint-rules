/**
 * Require both `id` and `name` on every <input>/<select>/<textarea>.
 * aria-label is NOT enough — Chrome DevTools flags fields lacking id/name.
 * Tags with a {...spread} are skipped (attrs may come from props).
 */
const FIELDS = new Set(['input', 'select', 'textarea']);
// input types that are not user-labeled data fields — Chrome doesn't flag these,
// and forcing an id on them is noise (hidden mirrors, buttons, etc.).
const SKIP_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Form fields must have both id and name attributes' },
    messages: {
      missing: '<{{tag}}> is missing {{missing}}. Every input/select/textarea needs BOTH id and name (aria-label is not enough). In a .map(), make them unique per row, e.g. id={`x-${key}`}.',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || !FIELDS.has(node.name.name)) return;
        let hasId = false;
        let hasName = false;
        let type = null;
        for (const attr of node.attributes) {
          if (attr.type === 'JSXSpreadAttribute') return; // can't statically know
          if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;
          if (attr.name.name === 'id') hasId = true;
          if (attr.name.name === 'name') hasName = true;
          if (attr.name.name === 'type') {
            const v = attr.value;
            if (v && v.type === 'Literal') type = v.value;
            else if (v && v.type === 'JSXExpressionContainer' && v.expression.type === 'Literal') type = v.expression.value;
          }
        }
        if (node.name.name === 'input' && typeof type === 'string' && SKIP_TYPES.has(type.toLowerCase())) return;
        if (hasId && hasName) return;
        const missing = [!hasId && 'id', !hasName && 'name'].filter(Boolean).join(' and ');
        context.report({ node, messageId: 'missing', data: { tag: node.name.name, missing } });
      },
    };
  },
};
