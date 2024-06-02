const puppeteer = require('puppeteer');
const refreshInterval = 60000;

async function fetchAndUpdateTable() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    await page.goto('https://sports.news.naver.com/kbaseball/record/index.nhn?category=kbo');
    await page.waitForSelector('#regularTeamRecordList_table');
  
    const tableHTML = await page.evaluate(() => {
      const tableElement = document.querySelector('#regularTeamRecordList_table');
      return tableElement ? tableElement.outerHTML : null;
    });
  
    const parser = new DOMParser();
    const doc = parser.parseFromString(tableHTML, 'text/html');
    const rows = doc.querySelectorAll('#regularTeamRecordList_table > tr');
  
    const table = document.getElementById('ranking-table');
    table.innerHTML = ''; // 기존 테이블 내용 초기화
  
    for (const row of rows) {
      const newRow = document.createElement('tr');
      const cells = row.querySelectorAll('th, td');
      for (const cell of cells) {
        const newCell = document.createElement(cell.tagName.toLowerCase());
        newCell.innerHTML = cell.innerHTML;
        newRow.appendChild(newCell);
      }
      table.appendChild(newRow);
    }
  
    await browser.close();
  }
  
  // 처음에 테이블 생성
  fetchAndUpdateTable();
  
  // 일정 시간마다 새로고침
  setInterval(fetchAndUpdateTable, refreshInterval);