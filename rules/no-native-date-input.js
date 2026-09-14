/**
 * Ban native <input type="date"> — renders in browser locale, not DD.MM.YYYY.
 * Use a real date-picker component that displays/stores Israeli DD.MM.YYYY.
 */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Use a DD.MM.YYYY date-picker, not native <input type="date">' },
    messages: {
      native: 'Bare <input type="date"> renders in the browser locale. Use a date-picker component that shows/stores DD.MM.YYYY.',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'input') return;
        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute' || attr.name.name !== 'type') continue;
          const v = attr.value;
          let str = null;
          if (v && v.type === 'Literal') str = v.value;
          else if (v && v.type === 'JSXExpressionContainer' && v.expression.type === 'Literal') str = v.expression.value;
          if (typeof str === 'string' && str.toLowerCase() === 'date') {
            context.report({ node, messageId: 'native' });
          }
        }
      },
    };
  },
};
