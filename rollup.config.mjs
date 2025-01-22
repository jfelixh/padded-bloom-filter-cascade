import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

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
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          removeComments: false,
        },
      }),
    ],
  },
];

export default config;
