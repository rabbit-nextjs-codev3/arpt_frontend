import { fileURLToPath } from "node:url";

const stripBomPath = fileURLToPath(
  new URL("./postcss-strip-bom.cjs", import.meta.url),
);

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [stripBomPath]: {},
  },
};

export default config;
