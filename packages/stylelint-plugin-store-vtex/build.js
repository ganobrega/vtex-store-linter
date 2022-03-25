/**
 * This script scrap all VTEX IO Components to make a relationship schema between Interfaces and CSS Handles
 */
require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const uniqBy = require("lodash/uniqBy");
const omit = require("lodash/omit");
const set = require("lodash/set");
const values = require("lodash/values");
const toPairs = require("lodash/toPairs");
const fromPairs = require("lodash/fromPairs");

const githubOrigin = "https://github.com";
const githubApi = "https://api.github.com";
const rawOrigin = "https://raw.githubusercontent.com";

(async () => {
  try {
    let { data: appsOfIODocumentation } = await axios.get(
      `${rawOrigin}/vtex-apps/io-documentation/master/docs/en/Components/componentList.json`
    );

    const simplifiedListIOComponents = uniqBy(
      values(appsOfIODocumentation).flat(),
      "appName"
    ).map((x) => omit(x, ["description", "title", "file"]));

    var apps = [];

    for await (const app of simplifiedListIOComponents) {
      try {
        const githubRepo = app.url.replace(githubOrigin + "/", "");

        const { data: manifest } = await axios.get(
          `${rawOrigin}/${githubRepo}/master/manifest.json`
        );

        if (!manifest.version) throw "No version found!";

        app["version"] = manifest.version;

        const { data: interfaces } = await axios.get(
          `${rawOrigin}/${githubRepo}/master/store/interfaces.json`
        );

        if (!interfaces) throw "No interfaces.json found!";

        set(
          app,
          "store.interfaces",
          toPairs(interfaces).map(([key, values]) => ({ id: key, ...values })) // Transform keys in property id
        );

        apps.push(app);
      } catch (error) {}
    }

    for (let i = 0; i <= apps.length - 1; i++) {
      let app = apps[i];

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

      let interfaceFromPairs = [];

      try {
        for await (const face of app["store"]["interfaces"]) {
          const { data: rawx } = await axios.get(
            `https://vtex.vtexassets.com/_v/public/assets/v1/published/${app.appName}@${app.version}/public/react/${face.component}.js`
          );

          const classNames = raw
            .match(/(?:var MESSAGE_|CSS_HANDLES = \[)(.*?)]/gm)
            ?.map((x) => x && x !== "" && /\[(.*?)\]/gm.exec(x)[0])
            .map((x) => JSON.parse(x.replace(/\'/gm, '"')))
            .concat(
              raw
                ?.match(/(?:withModifiers\()(.*?)\)/gm)
                .map((x) => x && x !== "" && x.match(/'(?:.*?)'/gm))
                .map((x) =>
                  x
                    .map((y) => /(?<=\').+?(?=\')/gm.exec(y))
                    .filter((y) => y)
                    .flat()
                )
                .map((x) => x.slice(1).map((y) => [x[0], y].join("--")))
            )
            .flat();

          if (classNames) {
            face.classNames = classNames;
            interfaceFromPairs.push(face);
          }
        }
      } catch (error) {
        // console.error(error);
      }

      set(
        apps[i],
        "store.interfaces",
        fromPairs(interfaceFromPairs.map(({ id, ...values }) => [id, values]))
      );
    }

    fs.outputJson(
      path.join(__dirname, "public/apps.json"),
      apps.filter((x) => x !== null),
      (err) => {
        console.log(err);
      }
    );
  } catch (error) {}
})();
