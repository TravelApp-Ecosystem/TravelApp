const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withMavenMirror(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const mirror = "        maven { url 'https://maven-central.storage-download.googleapis.com/maven2/' }";
      if (!config.modResults.contents.includes('maven-central.storage-download.googleapis.com')) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n    repositories {\n${mirror}`
        );
      }
    }
    return config;
  });
};
