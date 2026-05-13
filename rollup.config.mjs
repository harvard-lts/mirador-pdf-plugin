import { babel } from "@rollup/plugin-babel";

const external = [
  "mirador",
  "react",
  "react-dom",
  "react/jsx-runtime",
  /^@mui\//,
  /^@emotion\//,
];

const config = {
  input: "src/index.js",
  output: {
    dir: "dist/es",
    format: "es",
  },
  external,
  plugins: [babel({ babelHelpers: "bundled" })],
};

export default config;
