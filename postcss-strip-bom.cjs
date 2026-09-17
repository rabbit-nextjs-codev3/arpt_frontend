// Tailwind CSS v4 prepends a UTF-8 BOM to its license banner comment.
// PostCSS faithfully restores that BOM when stringifying the final output,
// which Turbopack's bundled Lightning CSS parser cannot handle: it silently
// corrupts parsing and later reports an unrelated "Invalid dangling
// combinator in selector" error deep in the generated CSS. Clearing the
// `hasBOM` flag after Tailwind runs stops PostCSS from re-adding it.
module.exports = function stripBom() {
  return {
    postcssPlugin: "strip-bom",
    Once(root) {
      if (root.source && root.source.input) {
        root.source.input.hasBOM = false;
      }
    },
  };
};
module.exports.postcss = true;
