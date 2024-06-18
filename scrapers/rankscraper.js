const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const filePath = path.resolve(__dirname, '../views/ranking.ejs');
const url = 'https://sports.news.naver.com/kbaseball/record/index.nhn?category=kbo';

async function scrapeRanking() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const table = await page.evaluate(() => {
      const tableElement = document.getElementById('regularTeamRecordList_table');
      const imgElements = tableElement.querySelectorAll('img');
      imgElements.forEach(img => img.remove());
      return tableElement ? tableElement.outerHTML : null;
    });

    if (table) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>KBO 순위</title>
          <style>
          body {
            background-color: #f2f2f2;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            margin-top: 70px; /* 헤더의 높이만큼 내용을 아래로 밀어줍니다. */
        }
        header {
            background-color: #004687;
            color: #fff;
            padding: 20px;
            text-align: right; /* 텍스트를 오른쪽 정렬 */
        }
        .title-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .title-bar h1 {
            margin: 0;
        }
        nav {
            background-color: #002D64;
            padding: 10px;
            text-align: center;
        }
        nav ul {
            list-style-type: none;
            margin: 0 auto; /* 가운데 정렬 */
            padding: 0;
        }
        nav ul li {
            display: inline;
            margin-right: 10px;
        }
        nav ul li a {
            color: #fff;
            text-decoration: none;
            padding: 5px 10px;
        }
        nav ul li a:hover {
            background-color: #66A7FF;
        }
        .login-button,
        .signup-button {
            background-color: #007bff;
            border: none;
            color: white;
            padding: 8px 20px;
            text-align: center;
            text-decoration: none;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .login-button:hover,
        .signup-button:hover {
            background-color: #0056b3;
        }
        .main-content {
            padding: 20px;
        }
        .article {
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        .article h2 {
            color: #004687;
        }
        .article p {
            color: #333;
        }
        footer {
            background-color: #004687;
            color: #fff;
            padding: 50px;
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-family: Arial, sans-serif;
            margin-bottom: 20px;
        }
        th, td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
          </style>
        </head>
        <body>
        <header>
        <div class="title-bar">
            <h1>BASE</h1>
            <!-- 로그인 및 회원가입 버튼 추가 -->
            <div>
            <% if (isLoggedIn) { %>
                <span>환영합니다!</span>
                <a href="/logout" class="logout-button">로그아웃</a>
            <% } else { %>
                <a href="/login" class="login-button">로그인</a>
                <a href="/signup" class="signup-button">회원가입</a>
            <% } %>
            </div>
        </div>
    </header>
    <nav>
        <ul>
            <li><a href="/">홈</a></li>
            <li><a href="/ranking">순위</li>
            <li><a href="/schedule">경기 일정</a></li>
            <li><a href="/write">티켓 판매 게시판</a></li>
            <li><a href="/my_info">나의 정보</a></li>
        </ul>
    </nav>
    <main class="main-content">
        <article class="article">
            <h2>KBO 순위</h2>
            
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>팀</th>
                <th>경기수</th>
                <th>승</th>
                <th>패</th>
                <th>무</th>
                <th>승률</th>
                <th>게임차</th>
                <th>연속</th>
                <th>출루율</th>
                <th>장타율</th>
                <th>최근10경기</th>
              </tr>
            </thead>
            <tbody>
              ${table}
            </tbody>
          </table>
          <footer>
          <p>&copy; 2024 야구 홈페이지. BASE WEB.</p>
      </footer>
  
        </body>
        </html>
      `;

      fs.writeFileSync(filePath, html);
    } else {
      console.error('에러 발생');
    }
  } catch (error) {
    console.error('에러 : ', error);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeRanking };