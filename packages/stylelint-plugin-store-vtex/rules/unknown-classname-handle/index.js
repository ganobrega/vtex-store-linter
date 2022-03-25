// Use the schema on public/apps.json
const stylelint = require("stylelint");
const path = require("path");
const fs = require("fs-extra");
const pkg = require("../../package.json");

const ruleName = `${pkg.name}/unknown-classname-handle`;

const messages = stylelint.utils.ruleMessages(ruleName, {
  unknownClassName: (selector, filename) =>
    `Unknow classname '${selector}' for '${filename}'.`,
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
      const dictionary = Object.fromEntries(
        apps.map((app) => [
          app.appName + ".css",
          Object.values(app.store.interfaces)
            .filter((x) => x.classNames)
            .map((x) => x.classNames)
            .flat(),
        ])
      );

      let filename = path.basename(root.source.input.from);

      let validClassNames = dictionary[filename];

      if (validClassNames) {
        root.walkRules((rule) => {
          // Skip keyframes
          if (rule.parent.name === "keyframes") {
            return;
          }

          rule.selectors.forEach((className) => {
            if (validClassNames.some((x) => `.${x}` === className.trim()))
              return;

            stylelint.utils.report({
              ruleName: ruleName,
              result: result,
              node: rule,
              message: messages.unknownClassName(className, filename),
            });
          });
        });

        resolve();
      } else {
        resolve();
      }
    })
);

module.exports.ruleName = ruleName;
module.exports.messages = messages;
