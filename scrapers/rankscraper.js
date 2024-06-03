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
            table {
              width: 100%;
              border-collapse: collapse;
              font-family: Arial, sans-serif;
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
        </body>
        </html>
      `;

      fs.writeFileSync(filePath, html);
    } else {
      console.error('Could not find the table element');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeRanking };