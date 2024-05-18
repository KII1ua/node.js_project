const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// 미들웨어 사용해서 접속할때마다 콘솔에 현재시간 출력
app.use(function(req, res, next) {
    console.log('Time:', Date.now());
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));

const homeRoutes = require('./routes/routes'); // connection 객체 전달

app.use('/', homeRoutes);

app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "ejs");

app.listen(port, () => {
    console.log(`locahost가 ${port}에서 실행중입니다.`);
});