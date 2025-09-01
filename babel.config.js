module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel",
      'react-native-reanimated/plugin',
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": ["RAZORPAY_TEST_KEY", "RAZORPAY_LIVE_KEY"],
        "safe": true,
        "allowUndefined": false
      }]
    ]
  };
};