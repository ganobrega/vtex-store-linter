const { lint } = require("stylelint");
const path = require("path");
const { ruleName } = require(".");

const config = {
  plugins: ["./index.js"],
  rules: {
    [ruleName]: [true],
  },
};

it("warns for unknow filename pattern", async () => {
  const {
    results: [{ warnings, parseErrors }],
  } = await lint({
    files: ["./__fixtures__/**.css"],
    config,
  });

  console.log({
    results,
  });

  //   expect(parseErrors).toHaveLength(0);
  //   expect(warnings).toHaveLength(1);

  //   const [{ line, column, text }] = warnings;

  //   expect(text).toBe(
  //     "Unknown filename pattern (plugin/at-import-no-unresolveable)"
  //   );
  //   expect(line).toBe(1);
  //   expect(column).toBe(1);
});
