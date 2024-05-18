const mysql = require('mysql2');        // mysql로 하면 오류생김 구버전이라서 그런듯..
const config = require('./config');

const connection = mysql.createConnection(config);

connection.connect((err) => {
    if(err) {
        console.error('MySQL 연결 오류: ', err);
        return;
    }
    console.log('MySQL 연결 성공!');
});

module.exports = connection;