const mysqlConn = require('../base/database');

// Função para obter os tokens do Google de um usuário
async function getUserGoogleTokens(userId) {
    return new Promise((resolve, reject) => {
        mysqlConn.query(
            'SELECT google_access_token, google_refresh_token FROM USUARIOS WHERE IDUSUARIOS = ?',
            [userId],
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result[0]); // Retorna o primeiro resultado
            }
        );
    });
}

// Função para salvar os tokens do Google no banco de dados
async function saveGoogleTokens(userId, tokens) {
    return new Promise((resolve, reject) => {
        mysqlConn.query(
            'UPDATE USUARIOS SET google_access_token = ?, google_refresh_token = ? WHERE IDUSUARIOS = ?',
            [tokens.access_token, tokens.refresh_token, userId],
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

module.exports = {
    getUserGoogleTokens,
    saveGoogleTokens
};
