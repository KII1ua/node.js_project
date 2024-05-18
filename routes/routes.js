const express = require('express');
const router = express.Router();
const connection = require('../db');

router.get('/', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    const id = req.body.id;
    const password = req.body.password;
    console.log(`ID: ${id}, password: ${password}`);
    if(id && password) {
        res.render('success');
    } else {
        res.send('로그인 실패');
    }
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