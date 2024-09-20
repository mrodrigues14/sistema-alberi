// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const mysql = require('mysql2');

const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
    queueLimit: 0
};

const pool = mysql.createPool(poolConfig);

pool.getConnection((error, connection) => {
    if (error) {
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('A conexão com o banco de dados foi fechada.');
        } else if (error.code === 'ER_CON_COUNT_ERROR') {
            console.error('O banco de dados tem muitas conexões.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('A conexão com o banco de dados foi recusada.');
        }
    }

    if (connection) connection.release();
});

console.log('Pool de conexões ao banco de dados estabelecido com sucesso.');

module.exports = pool;
