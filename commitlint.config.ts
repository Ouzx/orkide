import pnpmScopes from "@commitlint/config-pnpm-scopes";
import { defineConfig } from "cz-git";

/** Scopes that do not map to a workspace package. */
const repoScopes = ["agents", "ci", "deps", "docs", "release", "repo"];

const workspaceScopes = await pnpmScopes.utils.getProjects({});
const scopes = [...new Set([...workspaceScopes, ...repoScopes])]
  .filter((scope): scope is string => typeof scope === "string")
  .toSorted();

/** commitlint severity: 2 = error. */
const ERROR = 2;

export default defineConfig({
  extends: ["@commitlint/config-conventional"],
  prompt: {
    allowCustomScopes: false,
    allowEmptyScopes: true,
    enableMultipleScopes: true,
    scopeEnumSeparator: ",",
    scopes,
  },
  rules: {
    "scope-enum": [ERROR, "always", scopes],
  },
});
