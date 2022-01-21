const fs = require("fs-extra");
const path = require("path");
const enquirer = require("enquirer");

const apps = require("@ganobrega/stylelint-plugin-store-vtex/public/apps.json");

enquirer
  .prompt({
    name: "name",
    type: "text",
    message: "Type a directory name to generate style files",
  })
  .then((res) => {
    apps.map((obj) => {
      let mappedClasses = obj?.style?.cssHandles.map((x) => `.${x}{}`);

      fs.outputFileSync(
        path.join(process.cwd(), `/${res.name}/${obj?.style?.filename}`),
        JSON.stringify(mappedClasses)
          .replaceAll(/\[|\]|"/g, "")
          .replaceAll(/,/g, "\n"),
        (err) => {
          if (err) throw err;
        }
      );
    });
  });
