// Use the schema on public/apps.json
const stylelint = require("stylelint");
const path = require("path");
const fs = require("fs-extra");
const package = require("../../package.json");

const ruleName = `${package.name}/unknown-filename-pattern`;

const messages = stylelint.utils.ruleMessages(ruleName, {
  invalid: (filename) =>
    `Filename '${filename}' doesn't match an VTEX IO application name. e.g: vtex.flex-layout.css`,
});

module.exports = stylelint.createPlugin(
  ruleName,
  (options) => (root, result) =>
    new Promise(async (resolve) => {
      const validOptions = stylelint.utils.validateOptions(result, ruleName, {
        options,
      });

      if (!validOptions) {
        return;
      }

      const apps = await fs.readJson(path.resolve("../../public/apps.json"));
      const dictionary = apps.map((x) => x.style.filename);

      let filename = path.basename(root.source.input.from);

      let validAppName = dictionary.some((x) => x === filename);

      if (!validAppName) {
        stylelint.utils.report({
          message: messages.invalid(filename),
          ruleName,
          result: result,
          line: 1,
          row: 1,
        });
        resolve();
      } else {
        resolve();
      }
    })
);

module.exports.ruleName = ruleName;
module.exports.messages = messages;
