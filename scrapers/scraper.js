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
          table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
            padding: 5px;
          }
        </style>
      </head>
      <body>
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
      </body>
    </html>
  `;

  fs.writeFileSync(filePath, htmlTemplate);
  await browser.close();
}

module.exports = { scrapeAndGenerateHTML };