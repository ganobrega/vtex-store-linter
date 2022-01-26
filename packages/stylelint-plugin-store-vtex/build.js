/**
 * This script scrap all VTEX IO Components to make a relationship schema between Interfaces and CSS Handles
 */
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const uniq = require("lodash/uniq");
const uniqBy = require("lodash/uniqBy");
const omit = require("lodash/omit");

const githubOrigin = "https://github.com/";
const rawOrigin = "https://raw.githubusercontent.com";

(async () => {
  let { data: appsOfIODocumentation } = await axios.get(
    `${rawOrigin}/vtex-apps/io-documentation/master/docs/en/Components/componentList.json`
  );

  let simplifiedListIOComponents = uniqBy(
    Object.values(appsOfIODocumentation).flat(),
    "appName"
  ).map((x) => omit(x, ["description", "title", "file"]));

  let notComponents = [];

  var apps = await Promise.all(
    simplifiedListIOComponents.map(async function (app) {
      try {
        // try {
        //   let { data: readme } = await axios.get(
        //     [
        //       rawOrigin,
        //       app.url.replace(githubOrigin, ""),
        //       "master",
        //       "docs",
        //       "README.md",
        //     ].join("/")
        //   );

        //   if (readme) {
        //     let isDeprecated = /\[DEPRECATED\]/gim.test(readme);
        //     let hasCSS = /#### CSS/gim.test(readme);

        //     if (isDeprecated) app["deprecated"] = true;
        //     console.log({ hasCSS });
        //   }
        // } catch (error) {
        //   console.log(error);
        // }

        let { data: manifest } = await axios.get(
          [
            rawOrigin,
            app.url.replace(githubOrigin, ""),
            "master",
            "manifest.json",
          ].join("/")
        );

        if (!manifest.version) return null;

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

        if (!interfaces) return null;

        let allCssHandles = [];

        for (let interface of Object.values(interfaces)) {
          try {
            let vtexAssets = `https://vtex.vtexassets.com/_v/public/assets/v1/published/${app.appName}@${app.version}/public/react/${interface.component}.js`;
            let { data: raw } = await axios.get(vtexAssets);

            console.debug(vtexAssets);

            let cssHandles = raw
              .match(/(?:var CSS_HANDLES = \[)(.*?)]/gm)
              ?.map((x) => x && x !== "" && /\[(.*?)\]/gm.exec(x)[0])
              .map((x) => JSON.parse(x.replace(/\'/gm, '"')))
              .flat();

            if (cssHandles) {
              allCssHandles.push(cssHandles);
            }
          } catch (error) {
            // console.error(error);
          }
        }

        // console.debug({
        //   allCssHandles,
        // });

        app["style"] = {
          filename: `${app.appName}.css`,
          cssHandles: uniq(allCssHandles.flat()),
        };

        console.debug(app);

        return app;
      } catch (error) {
        notComponents.push(app);
        // console.error(error);
        return null;
      }
    })
  );

  //   console.debug({ notComponents });

  fs.outputJson(
    path.join(__dirname, "public/apps.json"),
    apps.filter((x) => x !== null),
    (err) => {
      console.log(err);
    }
  );
})();
