const processLevel = {
  parse (input, context) {
    const { prettified, colorizer } = context;
    if ('level' in input) {
      const level = input.level;
      prettified.level =
        level === 30
          ? undefined
          : colorizer(level);
    }
    return input;
  },
  build (lineParts, { prettified: { level } }) {
    if (level) {
      lineParts.push(' ', level);
    }
  }
};

export default processLevel;
