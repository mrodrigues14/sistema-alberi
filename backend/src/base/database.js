// database.js
const mysql = require('mysql2');

const dbConfig = {
    host: '25.3.70.175',
    user: 'seu username',
    password: 'sua senha.',
    database: 'alberi'
};

const connection = mysql.createConnection(dbConfig);

connection.connect(error => {
    if (error) throw error;
    console.log('Successfully connected to the database.');
});

module.exports = connection;
