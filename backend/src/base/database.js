const mysql = require('mysql2');

const poolConfig = {
    host: '82.180.153.103',
    user: 'u624627699_admin',
    password: 'Alberi1234',
    database: 'u624627699_albericonsult',
    waitForConnections: true,
    connectionLimit: 10,
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