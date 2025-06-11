const plugin = {
  // preferred location of name and version
  meta: {
    name: "eslint-plugin-grammar",
    version: "0.1.2",
  },
  rules: {
    "grammar-check": require("./rules/grammar-checker"),
  },
};

module.exports = plugin;
