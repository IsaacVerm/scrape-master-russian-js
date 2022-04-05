const puppeteer = require('puppeteer');

(async () => {
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: false })

    const page = await browser.newPage()

    await page.goto('http://masterrussian.com/vocabulary/most_common_words.htm')

    const link = await page.evaluate(() => {
        return document.querySelector('.word > a').getAttribute('href')
    })

    await page.goto(link)

    const russianPhrases = await page.evaluate(() => {
        return [...document.querySelectorAll('.phrase_plain .first')].map(element => element.innerText)
    })
    

    await browser.close()
})()