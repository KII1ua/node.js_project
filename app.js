const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { scrapeAndGenerateHTML } = require('./scrapers/scraper');
const { scrapeRanking } = require('./scrapers/rankscraper');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const connection = require('./db');

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
app.use(express.static(path.join(__dirname, 'public')));

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

    const selectQuery = 'SELECT cm.sender_id, r.name AS sender_name, cm.message, cm.created_at FROM chat_message cm JOIN register r ON cm.sender_id = r.id WHERE cm.room_id = ? ORDER BY cm.created_at';
    connection.query(selectQuery, [roomId], (error, results) => {
      if (error) {
        console.error('대화 기록 조회 중 오류 발생: ', error);
      } else {
        // 이전 대화 기록을 클라이언트에게 전송
        socket.emit('previousMessages', results);
      }
    });
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`사용자가 ${roomId} 방에서 퇴장했습니다.`);
  });

  socket.on('chatMessage', (data) => {
    const { roomId, userId ,message } = data;
    
    // 채팅 메시지를 db에 저장
    const insertQuery = 'INSERT INTO chat_message (room_id, sender_id, message, created_at) VALUES (?, ?, ?, NOW())';
    connection.query(insertQuery, [roomId, userId, message], (error, results) => {
        if(error) {
          console.error('채팅 메시지 저장 중 오류 발생: ', error);
        } else {
          io.to(roomId).emit('chatMessage', { userId, message });
        }
    });
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