const plugin = {
  // preferred location of name and version
  meta: {
    name: "eslint-plugin-grammar",
    version: "0.1.2",
  },
  rules: {
    "grammar-check": require("./rules/grammar-checker"),
    "microsoft-writing-style": require("./rules/ms-writing-style-checker"),
  },
};

module.exports = plugin;
