const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, '../views/schedule.ejs');

async function scrapeAndGenerateHTML() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.koreabaseball.com/Schedule/Schedule.aspx');
  await page.waitForSelector('#tblScheduleList > tbody > tr', { timeout: 60000 });

  const rows = await page.$$eval('#tblScheduleList > tbody > tr', rows => {
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'))
        .filter(cell => {
          const isReplayCell = cell.classList.contains('replay');
          const hasLink = cell.querySelector('a');
          const isEmpty = cell.textContent.trim() === '';
          const isExcludedText = /\b(?:TVING|[a-zA-Z]+-\d+[a-zA-Z]*|[a-zA-Z]+-[a-zA-Z]+)\b/.test(cell.textContent.trim());
          return !isReplayCell && !hasLink && !isEmpty && !isExcludedText;
        })
        .map(cell => cell.textContent.trim());

      let displayDate = '-';
      let time, matchInfo, stadium, cancelled;

      if (cells.length >= 3) {
        const dateCell = cells.find(cell => /\d+\.\d+/.test(cell));
        displayDate = dateCell ? dateCell : '-';
        [time, matchInfo, stadium, cancelled] = dateCell ? cells.slice(1) : cells;
      } else {
        [time, matchInfo, stadium, cancelled] = cells;
      }

      return { displayDate, time, matchInfo, stadium, cancelled };
    });
  });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Baseball Schedule</title>
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
  <h2>KBO 리그 2024 시즌 일정</h2>
  <table class="schedule-table">
        <table>
          <tr>
            <th>날짜</th>
            <th>시간</th>
            <th>경기 정보</th>
            <th>경기장</th>
            <th>취소 여부</th>
          </tr>
          ${rows.map(row => `
            <tr>
              <td>${row.displayDate}</td>
              <td>${row.time}</td>
              <td>${row.matchInfo}</td>
              <td>${row.stadium}</td>
              <td>${row.cancelled || '-'}</td>
            </tr>
          `).join('')}
        </table>
        <footer>
          <p>&copy; 2024 야구 홈페이지. BASE WEB.</p>
      </footer>
      </body>
    </html>
  `;

  fs.writeFileSync(filePath, htmlTemplate);
  await browser.close();
}

module.exports = { scrapeAndGenerateHTML };