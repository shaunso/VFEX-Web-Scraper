// load the requisite modules
const puppeteer = require('puppeteer');
const fs = require('fs');

// set the URL to the Victoria Falls Stock Exchange (VFEX) homepage
const url = 'https://www.vfex.exchange/';

// retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
function theDate() {
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = ( today.getMonth() + 1 ).toString();
  const day = today.getDate().toString();
  // the date will be in the YYYY-MM-DD format
  return year.concat("-", month, "-", day);
}

// executing the web scrapper
const getMarketActivity = async () => {
  // launch the imported Puppeteer module
  // Puppeter will start a headless instance of the Chromium browser
  const browser = await puppeteer.launch();
  // open a new page the headless instance
  const page = await browser.newPage();
  // set the viewport of the page
  await page.setViewport({
    width: 1680,
    height: 1080,
  });
  // requesting the html file for VFEX homepage from the server
  // 'waitUntil' method waits for the entire html data to be loaded before the functions are executed
  // 'timeout' method added to increase the time period Puppeteer waits for the DOM content to load before throwing a timeout error
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 240000,
  })

  // take a screenshot of the full page as a backup
  await page.screenshot({ path: `./screenshot/${theDate()}.png`, fullPage: true });
  
  // retrieve the html data of the requested page, after the DOM content has loaded 
  // the data is then returned to the calling function where it passed on to a Promise for further execution   
  const result = await page.evaluate( () => {
    // use a query selector to select all the rows in the market activity table on the VFEX homepage
    const data = document.querySelectorAll('section.elementor-inner-section:nth-child(6) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) tr');
    const getDate = document.querySelector('section.elementor-inner-section:nth-child(5)  > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) h2').innerText.trim().split(" ").toSpliced(0,2);
    // // retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
    const today = new Date(getDate);
    const year = today.getFullYear().toString();
    const month = ( today.getMonth() + 1 ).toString();
    const day = today.getDate().toString();
    // the date will be in the YYYY-MM-DD format
    const currentDate = year.concat("-", month, "-", day);
    // the nodeList returned from executing 'data' is converted into an array of objects, with array elements having one 'key:value' property each
    // the array is then returned to the function that called it
    return Array.from(data).map( (el) => {
      const activity = el.querySelector('td:nth-child(1)').innerText.trim();
      const value = el.querySelector('td:nth-child(2)').innerText.trim();

      return { currentDate, activity, value }
    })
  });

  // close the headless instance of Chromium
  await browser.close();
  // return the data to the calling function as a single array of objects
  return result
}

// once the market activity data is returned by the web scrapper
// log the data to the console
// then append a CSV file with the returned data 
// then save the returned data in a JSON file
const marketActivity = getMarketActivity().then( value => {
  console.log(value);

  // save the scrapped data to a JSON file
  fs.writeFile(`./market_activity/json/${value[0].currentDate}.json`, JSON.stringify(value), err => {
    if (err) throw err;
    console.log("Saved to JSON")
  }); 

  // append the date to the first column of the CSV file
  fs.appendFile('./market_activity/market_activity.csv', `\n${value[0].currentDate}`, err => {
    if (err) throw err;
    console.log(value[0].currentDate);
  });

  // append the scrapped data in 'value' to a CSV file
  // for ( let entity of value) {
  //   fs.appendFile('./market_activity/market_activity.csv', `,${entity.value.toString().replace("USD$","").replaceAll(",","")}`, err => {
  //     if (err) {
  //       console.log(`An error occured retrieving the data for ${entity.activity} !!!`);
  //     };
  //     console.log(`${entity.activity} saved to CSV...`);
  //   });
  // }

  for (let entity of value) {
    const csvRow = `,${entity.value.toString().replace("USD$", "").replaceAll(",", "")}`;
    fs.appendFile('./market_activity/market_activity.csv', csvRow, err => {
      // Error handling 
      if (err) throw err
    });
  }
});

module.exports = marketActivity;