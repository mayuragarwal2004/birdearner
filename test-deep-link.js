// Test deep linking functionality
// Run this in the terminal to test: node test-deep-link.js

const testDeepLinks = [
  'birdearner://profile/123',
  'https://birdearner.com/profile/456',
];

console.log('Testing deep links:');
testDeepLinks.forEach((link, index) => {
  console.log(`${index + 1}. ${link}`);
});

console.log('\nTo test these links:');
console.log('1. Make sure your app is running on a device/simulator');
console.log('2. Open the device browser and enter the deep link');
console.log('3. Or use: npx uri-scheme open "birdearner://profile/123" --ios');
console.log('4. Or use: npx uri-scheme open "birdearner://profile/123" --android');
