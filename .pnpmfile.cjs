/**
 * The one sanctioned exception to TypeScript 7: `astro check` drives the TypeScript JS API, which
 * 7.0 does not ship. Its type-checker gets a private TypeScript 6 instead of the workspace peer.
 * Remove once TypeScript 7.1 and `@astrojs/ts-content-mapper` are stable (docs/decisions.md).
 */
const ASTRO_CHECKER = new Set(["@astrojs/check", "@astrojs/language-server"]);
const TYPESCRIPT_6 = "npm:typescript@^6.0.3";

module.exports = {
  hooks: {
    readPackage(manifest) {
      if (ASTRO_CHECKER.has(manifest.name)) {
        delete manifest.peerDependencies?.typescript;
        manifest.dependencies = {
          ...manifest.dependencies,
          typescript: TYPESCRIPT_6,
        };
      }
      return manifest;
    },
  },
};
