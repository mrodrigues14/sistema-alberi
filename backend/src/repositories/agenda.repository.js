const mysqlConn = require('../base/database');

async function getUserGoogleTokens(userId) {
    return new Promise((resolve, reject) => {
        mysqlConn.query(
            'SELECT google_access_token, google_refresh_token FROM USUARIOS WHERE IDUSUARIOS = ?',
            [userId],
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result[0]);
            }
        );
    });
}

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
