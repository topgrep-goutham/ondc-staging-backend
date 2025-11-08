// scripts/checkDb.js
const db = require('./config/db');

(async () => {
  await db.connect();
  const rows = await db.all('SELECT * FROM SearchResult WHERE transactionId = ?', ['txn-test-123']);
  console.log('SearchResult rows:', rows);
  const t = await db.get('SELECT * FROM Transactions WHERE transactionId = ?', ['txn-test-123']);
  console.log('Transaction:', t);
  await db.close();
})();