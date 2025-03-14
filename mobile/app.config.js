// This file is used to override app.json configuration during development
module.exports = ({ config }) => {
  return {
    ...config,
    // Add any development-specific configuration here
    extra: {
      ...config.extra,
      eas: {
        projectId: config.extra?.eas?.projectId || "your-project-id",
      },
    },
  };
}; 