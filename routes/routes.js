const express = require('express');
const router = express.Router();
const connection = require('../db');

router.get('/', (req, res) => {
    res.render('login');
});

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
        if(user.password !== password) {
            return res.send('비밀번호가 일치하지 않습니다.');
        }

        res.send('로그인 성공');
    });
});

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post('/signup', (req, res) => {
    const id = req.body.id;                 // 아이디
    const password = req.body.password;     // 비밀번호
    const name = req.body.name;             // 이름
    const rs_number = req.body.resident_number;     // 주민번호
    const phone = req.body.phone_number;        // 전화번호
    const birth = req.body.date;            // 생년월일

    if(!id || !password || !name || !rs_number || !phone || !birth) {
        return res.send('모든 필드를 입력하세요');
    }

    const query = 'INSERT INTO register (id, password, name, rs_number, phone, birth) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(query, [id, password, name, rs_number, phone, birth], (err, result) => {
    if (err) {
        console.error('MySQL 쿼리 오류: ', err);
        return res.status(500).send('서버 오류');
    }

    res.send('회원가입이 완료되었습니다.');
    });
});

router.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';
    connection.query(query, (err, results) => {
        if(err) {
            console.error('MySQL 쿼리 오류: ', err);
            return res.status(500).send('서버 오류');
        }
        res.json(results);
    });
});

router.get('/home', (req, res) => {
    res.send('/home 페이지');
});

router.get('/home/login', (req, res) => {
    res.send('/home/login 페이지');
});

module.exports = router;