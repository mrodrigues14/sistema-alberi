// database.js
const mysql = require('mysql2');

const dbConfig = {
    host: '25.3.70.175',
    user: 'matheus',
    password: '1234',
    database: 'alberi'
};


const connection = mysql.createConnection(dbConfig);

connection.connect(error => {
    if (error) throw error;
    console.log('Successfully connected to the database.');
});

module.exports = connection;
