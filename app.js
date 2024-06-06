const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { scrapeAndGenerateHTML } = require('./scrapers/scraper');
const { scrapeRanking } = require('./scrapers/rankscraper');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = 3000;    // 3000번대 포트 번호 사용

// 세션 미들웨어 사용
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

const homeRoutes = require('./routes/routes'); // connection 객체 전달

app.use('/', homeRoutes);

app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "ejs");

io.on('connection', (socket) => {
  console.log('사용자 연결됨');

  socket.on('disconnect', () => {
    console.log('사용자 연결 해제됨');
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    // 채팅방에 입장했음을 알리는 메시지 전송
    io.to(roomId).emit('chatMessage', `User ${socket.id} joined the room`);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`사용자가 ${roomId} 방에서 퇴장했습니다.`);
  });

  socket.on('chatMessage', (data) => {
    const { roomId, userId ,message } = data;
    
    io.to(roomId).emit('chatMessage', { userId, message });
  });
});


// 웹 서버 시작(시작할때 스크래핑을 실행하여 경기일정을 view/schedule.ejs 파일로 저장)
server.listen(port, async () => {
    console.log(`localhost가 ${port}에서 실행중입니다.`);
  
    try {
      const scheduleData = await scrapeAndGenerateHTML();
      await scrapeAndGenerateHTML(scheduleData);
      console.log('schedule.ejs 파일이 업데이트되었습니다.');
    } catch (err) {
      console.error('스크래핑 중 오류가 발생했습니다:', err);
    }

    try {
      const scrapeRankData = await scrapeRanking();
      await scrapeRanking(scrapeRankData);
      console.log('ranking.ejs 파일이 업데이트되었습니다.');
    } catch (err) {
      console.log('스크래핑 중 오류가 발생하였습니다.');
    }
});