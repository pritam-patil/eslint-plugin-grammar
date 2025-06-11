const create = {
  create(context) {
    const checkComment = () => {
      console.log(`>> context options > `, context.options?.[0]);
    };

    return {
      // Noop in ESLint 4+
      BlockComment: checkComment,
      // Noop in ESLint 4+
      LineComment: checkComment,
      Literal: checkComment,
      TemplateElement: checkComment,
      Identifier: checkComment,
    };
  },
};

module.exports = create;
