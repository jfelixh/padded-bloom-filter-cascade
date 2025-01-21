import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readFile } from "fs/promises";
import dts from "rollup-plugin-dts";

// Read package.json
const pkg = JSON.parse(
  await readFile(new URL("./package.json", import.meta.url))
);

const config = [
  {
    input: "src/index.ts",
    output: {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist/types",
      }),
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      dir: "dist/types",
      format: "esm",
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [dts()],
  },
];

export default config;
