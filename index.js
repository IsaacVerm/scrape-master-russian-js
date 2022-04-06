const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch()

    const page = await browser.newPage()

    function createInitialLinks() {
        // Array(11) cause there are 12 pages and the first page has no number
        // index +2 instead of +1 because you don't need a suffix for the first page and index starts at 0
        const suffixes = ['', Array(11).fill().map((element, index) => `_${index + 2}`)].flat()

        return suffixes.map(suffix => `http://masterrussian.com/vocabulary/most_common_words${suffix}.htm`)
    }

    function createStream(csv_path, column_names) {
        const stream = fs.createWriteStream(csv_path)
        stream.write(`${column_names}\n`)
        return stream
    }

    async function getWordLinks() {
        return await page.evaluate(() => {
            return [...document.querySelectorAll('.word > a')].map(element => element.getAttribute('href'))
        })
    }

    function checkLink(link) {
        if (!link.includes('http://masterrussian.com')) {
            link = 'http://masterrussian.com' + link
        }

        return link
    }

    async function getPhrases() {
       return await page.evaluate(() => {
            const russian = [...document.querySelectorAll('.phrase_plain .first')].map(element => element.innerText)
            const english = [...document.querySelectorAll('.phrase_plain .first + li')].map(element => element.innerText)
            return russian.map((a, i) => {
                return { "russian": a, "english": english[i] }
            })
        })
    }

    function writePhaseToStream(phrase, phrasesStream) {
        phrasesStream.write(`"${phrase.english}", "${phrase.russian}"\n`)
    }

    function writeErrorToStream(link, error, errorStream) {
        errorStream.write(`"${link}","${error.message}"\n`)
    }

    const phrasesStream = createStream('phrases.csv', 'english,russian')
    const errorStream = createStream('errors.csv', 'link,errorMessage')

    for (const initialLink of createInitialLinks()) {
        await page.goto(initialLink)

        const links = await getWordLinks()

        for (let link of links) {
            try {
                console.log(link)
                link = checkLink(link)

                await page.goto(link)

                const phrases = await getPhrases()

                phrases.forEach(phrase => {
                    writePhaseToStream(phrase, phrasesStream)
                })
            }
            catch (error) {
                writeErrorToStream(link, error, errorStream)
            }
        }
    }

    await browser.close()
})()