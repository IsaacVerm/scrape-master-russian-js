const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch()
    // const browser = await puppeteer.launch({ headless: false })

    const page = await browser.newPage()

    await page.goto('http://masterrussian.com/vocabulary/most_common_words.htm')

    const link = await page.evaluate(() => {
        return document.querySelector('.word > a').getAttribute('href')
    })

    await page.goto(link)

    const phrases = await page.evaluate(() => {
        const russian = [...document.querySelectorAll('.phrase_plain .first')].map(element => element.innerText)
        const english = [...document.querySelectorAll('.phrase_plain .first + li')].map(element => element.innerText)
        return russian.map((a, i) => {
            return { "russian": a, "english": english[i] }
        })
    })

    console.log(phrases)


    await browser.close()
})()