/**
 * Enable Mac Catalyst on the main app target so Colophon builds a native
 * macOS app (Apple Silicon + Intel) from the same iOS codebase.
 *
 * Sets `SUPPORTS_MACCATALYST = YES` on every build configuration of the app
 * target (never the Pods), plus a stable Catalyst bundle id and the "Optimize
 * for Mac" idiom. Re-applied on every `expo prebuild`, so it survives the
 * gitignored ios/ folder being regenerated.
 *
 * Note: some native pods may not compile for Catalyst; if a build fails on a
 * specific pod, exclude it or fall back to "Designed for iPad" (the iOS app
 * runs on Apple Silicon Macs with no extra work).
 */
const { withXcodeProject } = require('@expo/config-plugins');

const withMacCatalyst = (config) => {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const appName = cfg.modRequest.projectName || cfg.name;

    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;
      const settings = entry.buildSettings;
      // Only the app target's configs carry PRODUCT_NAME == the app; skip Pods.
      const productName = (settings.PRODUCT_NAME || '').replace(/"/g, '');
      const bundleId = settings.PRODUCT_BUNDLE_IDENTIFIER || '';
      const isAppTarget =
        productName === appName ||
        bundleId.includes('com.whalesrecords.colophon') &&
          !bundleId.includes('.watch') &&
          !bundleId.includes('.widget');
      if (!isAppTarget) continue;

      settings.SUPPORTS_MACCATALYST = 'YES';
      settings.DERIVE_MACCATALYST_PRODUCT_BUNDLE_IDENTIFIER = 'NO';
      // "Optimize interface for Mac" (idiom 2). Use '1' for "Scale iPad to match Mac".
      settings.TARGETED_DEVICE_FAMILY = '"1,2,6"';
    }

    return cfg;
  });
};

module.exports = withMacCatalyst;
