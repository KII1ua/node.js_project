const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { scrapeAndGenerateHTML } = require('./scrapers/scraper');

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

// 웹 서버 시작(시작할때 스크래핑을 실행하여 경기일정을 view/schedule.ejs 파일로 저장)
app.listen(port, async () => {
    console.log(`localhost가 ${port}에서 실행중입니다.`);
  
    try {
      const scheduleData = await scrapeAndGenerateHTML();
      await scrapeAndGenerateHTML(scheduleData);
      console.log('schedule.ejs 파일이 업데이트되었습니다.');
    } catch (err) {
      console.error('스크래핑 중 오류가 발생했습니다:', err);
    }
  });