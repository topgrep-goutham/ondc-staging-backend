const cryptoUtils = require('./utils/crypto');
(async () => {
  await cryptoUtils.initialize();
  console.log(await cryptoUtils.generateKeyPairs());
})();