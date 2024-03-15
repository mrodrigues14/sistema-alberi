// database.js
const mysql = require('mysql2');

const dbConfig = {
    host: 'srv816.hstgr.io',
    user: 'u624627699_admin',
    password: 'Alberi1234',
    database: 'u624627699_albericonsult'
};

const connection = mysql.createConnection(dbConfig);

connection.connect(error => {
    if (error) throw error;
    console.log('Successfully connected to the database.');
});

module.exports = connection;
