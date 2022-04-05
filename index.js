const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch()
    // const browser = await puppeteer.launch({ headless: false })

    const page = await browser.newPage()

    // 11 cause there are 12 pages and the first page has no number
    // +2 instead of +1 because you don't need a suffix for the first page and index starts at 0
    const suffixes = ['', Array(11).fill().map((element, index) => `_${index + 2}`)].flat()
    const initalLinks = suffixes.map(suffix => `http://masterrussian.com/vocabulary/most_common_words${suffix}.htm`)

    const phrasesStream = fs.createWriteStream('phrases.csv')
    phrasesStream.write('english,russian\n')

    const errorStream = fs.createWriteStream('errors.csv')
    errorStream.write('link,errorMessage\n')

    for (const initialLink of initalLinks) {
        await page.goto(initialLink)

        const links = await page.evaluate(() => {
            return [...document.querySelectorAll('.word > a')].map(element => element.getAttribute('href'))
        })

        for (let link of links) {
            try {
                console.log(link)
                // if (!link.includes('http://masterrussian.com')) {
                //     link = 'http://masterrussian.com' + link
                // }

                await page.goto(link)

                const phrases = await page.evaluate(() => {
                    const russian = [...document.querySelectorAll('.phrase_plain .first')].map(element => element.innerText)
                    const english = [...document.querySelectorAll('.phrase_plain .first + li')].map(element => element.innerText)
                    return russian.map((a, i) => {
                        return { "russian": a, "english": english[i] }
                    })
                })

                phrases.forEach(phrase => {
                    phrasesStream.write(`"${phrase.english}", "${phrase.russian}"\n`)
                })
            }
            catch (error) {
                errorStream.write(`"${link}","${error.message}"\n`)
            }
        }
    }

    await browser.close()
})()