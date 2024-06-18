const express = require('express');
const router = express.Router();
const connection = require('../db');
const crypto = require('crypto');

// 메인페이지 렌더링
router.get('/', (req, res) => {
  const isLoggedIn = req.session.isLoggedIn || false;
  const userName = req.session.userName;
  res.render('main', { isLoggedIn, userName });
});

// 경기 일정 렌더링
router.get('/schedule', (req,res) => {
    res.render('schedule');
});

// 경기 순위 렌더링
router.get('/ranking', (req, res) => {
    res.render('ranking');
});

// 로그인 렌더링
router.get('/login', (req, res) => {
    res.render('login');
});

// Login Post
router.post('/login', (req, res) => {
    const id = req.body.id;
    const password = req.body.password;

    if (!id || !password) {
        return res.send('아이디와 비밀번호를 입력해주세요');
    }

    const query = 'SELECT * FROM register WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if(err) {
            console.error('MySQL 쿼리 오류: ', err);
            return res.status(500).send('서버 오류');
        }

        if(results.length === 0) {      // 아이디가 존재하지 않을때
            return res.send('존재하지 않는 아이디입니다.');
        }

        const user = results[0];

        // 패스워드를 암호화해서 데이터베이스에 있는 암호랑 비교
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        if(user.password !== hashedPassword) {
            return res.send('비밀번호가 일치하지 않습니다.');
        }
        // 로그인 성공 시 세션에 로그인 상태와 사용자 이름 지정
        req.session.isLoggedIn = true;
        req.session.user = {
          id: user.id,
          name: user.name
        };
        res.redirect('/');
    });
});

// 회원가입 렌더링
router.get('/signup', (req, res) => {
    res.render('signup');
});

// 회원가입 post
router.post('/signup', (req, res) => {
    const id = req.body.id;                 // 아이디
    let password = req.body.password;     // 비밀번호
    const name = req.body.name;             // 이름
    const rs_number = req.body.resident_number;     // 주민번호
    const phone = req.body.phone_number;        // 전화번호
    const birth = req.body.date;            // 생년월일

    if(!id || !password || !name || !rs_number || !phone || !birth) {
        return res.send('모든 필드를 입력하세요');
    }

    // 아이디 중복 확인
    const checkQuery = 'SELECT * FROM register WHERE id = ?';
    connection.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('MySQL 쿼리 오류: ', checkErr);
            return res.status(500).send('서버 오류');
        }

        if (checkResult.length > 0) {
            // 중복된 아이디가 있을 경우
            return res.send('이미 사용 중인 아이디입니다. 다른 아이디를 사용해주세요.');
        }

    // crypto를 사용하여 비밀번호 암호화
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const query = 'INSERT INTO register (id, password, name, rs_number, phone, birth) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(query, [id, hashedPassword, name, rs_number, phone, birth], (err, result) => {
    if (err) {
        console.error('MySQL 쿼리 오류: ', err);
        return res.status(500).send('서버 오류');
    }

    res.send('회원가입이 완료되었습니다.');
        });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            console.error('세션 삭제 중 오류 발생 ', err);
        }
        res.redirect('/');
    });
});

// 게시글 조회 및 작성 페이지
router.get('/write', (req, res) => {
    const query = 'SELECT article.*, register.name AS author_name FROM article JOIN register ON article.author_id = register.id ORDER BY article.created_at DESC';
    connection.query(query, (error, results) => {
      if (error) {
        console.error('게시글 조회 중 오류 발생: ', error);
        res.render('article', { articles: [] }); // 오류 발생 시 빈 배열 전달
      } else {
        res.render('article', { articles: results }); // 조회 결과를 articles 변수에 할당하여 전달
      }
  });
});
  
  // 게시글 작성 처리
  router.post('/write', (req, res) => {
    const { title, content, price, seat, gameDate } = req.body;
    const authorId = req.session.user.id; // 로그인한 사용자의 아이디
  
    if (!authorId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
  
    // 필수 필드 유효성 검사
    if (!title || !content || !price || !seat || !gameDate) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }
  
    const query = 'INSERT INTO article (title, content, author_id, price, seat_info, game_date) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(query, [title, content, authorId, price, seat, gameDate], (error, results) => {
      if (error) {
        console.error('게시글 작성 중 오류 발생: ', error);
        res.status(500).json({ error: '게시글 작성 중 오류가 발생했습니다.' });
      } else {
        res.status(200).json({ message: '게시글이 성공적으로 작성되었습니다.' });
      }
  });
});

// 게시물 상세 페이지 라우트
router.get('/article/:id', (req, res) => {
  const articleId = req.params.id;
  const query = 'SELECT article.*, register.id AS author_id, register.name AS author_name FROM article JOIN register ON article.author_id = register.id WHERE article.id = ?';
  connection.query(query, [articleId], (error, results) => {
    if (error) {
      console.error('게시물 조회 중 오류 발생: ', error);
      res.status(500).send('게시물 조회 중 오류가 발생했습니다.');
    } else {
      if (results.length === 0) {
        res.status(404).send('해당 게시물을 찾을 수 없습니다.');
      } else {
        const article = results[0];
        article.author = {
          id: article.author_id,
          name: article.author_name
        };
        res.render('article-detail', { article });
      }
    }
  });
});

// 채팅방 생성
router.post('/chat/create', (req, res) => {
  const { articleId, userId } = req.body;
  const user2Id = req.session.user.id;

  // 사용자 인증 확인
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized '});
  }

  // 이미 존재하는 채팅방인지 확인
  const query = 'SELECT * FROM chat_rooms WHERE article_id = ? AND (user1_id = ? OR user2_id = ?)';
  connection.query(query, [articleId, userId, user2Id], (error, results) => {
    if (error) {
      console.error('채팅방 조회 중 오류 발생: ', error);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length > 0) {
      // 이미 존재하는 채팅방인 경우
      const chatRoom = results[0];
      return res.status(200).json({ chatRoomId: chatRoom.id });
    } else {
      // 새로운 채팅방 생성
      const createQuery = 'INSERT INTO chat_rooms (article_id, user1_id, user2_id) VALUES (?, ?, ?)';
      connection.query(createQuery, [articleId, userId, user2Id], (createError, createResults) => {
        if (createError) {
          console.error('채팅방 생성 중 오류 발생: ', createError);
          return res.status(500).send('Internal Server Error');
        }

        const chatRoomId = createResults.insertId;

        // 채팅방 목록 테이블에 저장
        const insertQuery = 'INSERT INTO user_chatrooms (user_id, chatroom_id) VALUES (?, ?), (?, ?)';
        connection.query(insertQuery, [userId, chatRoomId, user2Id, chatRoomId], (insertError, insertResults) => {
          if (insertError) {
            console.error('채팅방 목록 저장 중 오류 발생: ', insertError);
            return res.status(500).send('Internal Server Error');
          }

          return res.status(201).json({ chatRoomId });
        });
      });
    }
  });
});

// 채팅방 목록 랜더링
router.get('/chat/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const userId = req.session.user.id;

  const query = 'SELECT cr.*, a.title AS article_title FROM chat_rooms cr JOIN article a ON cr.article_id = a.id WHERE cr.id = ?';
  connection.query(query, [roomId], (error, results) => {
    if (error) {
      console.error('채팅방 정보 조회 중 오류 발생: ', error);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 0) {
      return res.status(404).send('채팅방을 찾을 수 없습니다.');
    }

    const chatRoom = results[0];

    // 이전 대화 기록 조회 쿼리 추가
    const selectQuery = 'SELECT cm.sender_id, r.name AS sender_name, cm.message, cm.created_at FROM chat_message cm JOIN register r ON cm.sender_id = r.id WHERE cm.room_id = ? ORDER BY cm.created_at';
    connection.query(selectQuery, [roomId], (selectError, messages) => {
      if(selectError) {
        console.error('대화 기록 조회 중 오류 발생: ', selectError);
        return res.status(500).send('Internal Server Error');
      }

      res.render('chat', { userId, chatRoom, messages });
    });
  });
});

router.get('/chat-list', (req, res) => {
  const isLoggedIn = req.session.isLoggedIn || false;
  const userName = req.session.userName || '';

  if (isLoggedIn) {
    const userId = req.session.user.id;
    const query = `SELECT cr.id, a.title AS article_title 
      FROM user_chatrooms uc 
      JOIN chat_rooms cr ON uc.chatroom_id = cr.id
      JOIN article a ON cr.article_id = a.id
      WHERE uc.user_id = ? OR cr.user1_id = ? OR cr.user2_id = ?`;
    connection.query(query, [userId, userId, userId], (error, results) => {
      if(error) {
        console.error('채팅방 목록 조회 중 오류 발생: ', error);
        return res.render('chat_list', { chatrooms: [] });
      }
      res.render('chat_list', { chatrooms: results });
    });
  } else {
    res.redirect('/login');
  }
});

//나의 정보 
router.get('/my_info', (req, res) => {
  // 로그인 상태 확인
  if (req.session.isLoggedIn) {
    const userId = req.session.user.id;

    // 사용자 정보 조회 쿼리
    const query = 'SELECT id, name, rs_number, phone, birth FROM register WHERE id = ?';
    connection.query(query, [userId], (error, results) => {
      if (error) {
        console.error('사용자 정보 조회 중 오류 발생: ', error);
        res.status(500).send('Internal Server Error');
      } else {
        if (results.length === 0) {
          res.status(404).send('사용자 정보를 찾을 수 없습니다.');
        } else {
          const user = results[0];
          res.render('my_info', { user });
        }
      }
    });
  } else {
    // 로그인하지 않은 경우 로그인 페이지로 리디렉션
    res.redirect('/login');
  }
});

// 나의정보에서 비밀번호 변경
router.post('/change-password', (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  // 새 비밀번호 확인
  if (newPassword !== confirmPassword) {
    res.status(400).send('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
  } else {
    // 새 비밀번호 업데이트
    const hashedNewPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    const updateQuery = 'UPDATE register SET password = ? WHERE id = ?';
    connection.query(updateQuery, [hashedNewPassword, userId], (updateError, updateResults) => {
      if (updateError) {
        console.error('비밀번호 업데이트 중 오류 발생: ', updateError);
        res.status(500).send('Internal Server Error');
      } else {
        res.send('비밀번호가 성공적으로 변경되었습니다.');
      }
    });
  }
});

module.exports = router;