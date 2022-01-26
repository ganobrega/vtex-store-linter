const { lint } = require("stylelint");
const { ruleName } = require(".");
const path = require("path");

(async () => {
  const { results } = await lint({
    files: ["./__fixtures__/**.css"],
    config: {
      plugins: ["./index.js"],
      rules: {
        [ruleName]: [true],
      },
    },
  });

  results
    .filter((rule) => rule.warnings.length > 0)
    .map((rule) => {
      console.log(rule.warnings);
    });
})();
