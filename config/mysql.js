// // config/mysql.js
// const mysql = require("mysql2/promise");

// const pool = mysql.createPool({
//     host: process.env.MYSQL_HOST,
//     user: process.env.MYSQL_USER,
//     password: process.env.MYSQL_PASSWORD,
//     database: "ONDC",
//     waitForConnections: true,
//     connectionLimit: 10
// });

// module.exports = pool;


const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }  // REQUIRED for Railway public network
});

module.exports = pool;