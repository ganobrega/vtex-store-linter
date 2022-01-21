/**
 * This script scrap all VTEX IO Components to make a relationship schema between Interfaces and CSS Handles
 */
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const uniq = require("lodash/uniq");

const githubOrigin = "https://github.com/";
const rawOrigin = "https://raw.githubusercontent.com";

(async () => {
  let { data: appsOfIODocumentation } = await axios.get(
    `${rawOrigin}/vtex-apps/io-documentation/master/docs/en/Components/componentList.json`
  );

  var apps = await Promise.all(
    Object.values(appsOfIODocumentation)
      .flat()
      .map(async function (app) {
        try {
          let { data: manifest } = await axios.get(
            [
              rawOrigin,
              app.url.replace(githubOrigin, ""),
              "master",
              "manifest.json",
            ].join("/")
          );

          app["version"] = manifest.version;

          let { data: interfaces } = await axios.get(
            [
              rawOrigin,
              app.url.replace(githubOrigin, ""),
              "master",
              "store",
              "interfaces.json",
            ].join("/")
          );

          let allCssHandles = [];

          for (let interface of Object.values(interfaces)) {
            let vtexAssets = `https://vtex.vtexassets.com/_v/public/assets/v1/published/${app.appName}@${app.version}/public/react/${interface.component}.js`;
            let { data: raw } = await axios.get(vtexAssets);

            let cssHandles = raw
              .match(/(?:var CSS_HANDLES = \[)(.*?)]/gm)
              ?.map((x) => x && x !== "" && /\[(.*?)\]/gm.exec(x)[0])
              .map((x) => JSON.parse(x.replace(/\'/gm, '"')))
              .flat();

            if (cssHandles) {
              allCssHandles.push(cssHandles);
            }
          }

          console.debug({
            allCssHandles,
          });

          app["style"] = {
            filename: `${app.appName}.css`,
            cssHandles: uniq(allCssHandles.flat()),
          };

          console.log(app);

          return app;
        } catch (error) {
          return null;
          //   console.error(error);
        }
      })
  );

  fs.outputJson(
    path.join(__dirname, "public/apps.json"),
    apps.filter((x) => x !== null),
    (err) => {
      console.log(err);
    }
  );
})();
