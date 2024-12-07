const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Umożliwienie CORS
app.use(cors());
app .use(express.json());

// Endpoint do śledzenia przesyłek
app.get('/track/:trackingNumber', async (req, res) => {
    const trackingNumber = req.params.trackingNumber;
    const url = `https://inpost.pl/sledzenie-przesylek?number=${trackingNumber}`;

    console.log(`Otrzymano żądanie śledzenia przesyłki: ${trackingNumber}`);
    
    try {
        console.log('Uruchamianie przeglądarki...');
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        console.log(`Przechodzenie do URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log('Czekanie na załadowanie elementu...');
        await page.waitForSelector("body > div.dialog-off-canvas-main-canvas > div > div > div > main > div:nth-child(3) > div > div.track--parcel--content.trackParcelContent > div > div > div.col-lg-6.offset-lg-3 > div", { timeout: 20000 });

        console.log('Pobieranie danych z elementu...');
        const parcelDetails = await page.evaluate(() => {
            const element = document.querySelector("body > div.dialog-off-canvas-main-canvas > div > div > div > main > div:nth-child(3) > div > div.track--parcel--content.trackParcelContent > div > div > div.col-lg-6.offset-lg-3 > div");
            if (element) {
                return element.innerText; // Zwróć tekst z elementu
            } else {
                return 'Brak danych';
            }
        });

        console.log('Zamykam przeglądarkę...');
        await browser.close();

        console.log('Zwracanie danych do klienta...');
        res.json({
            parcelDetails: parcelDetails.split('\n').map(line => line.trim()).join('\n') // Upewnij się, że dane są odpowiednio sformatowane
        });
    } catch (error) {
        console.error('Wystąpił błąd:', error);
        res.status(500).send('Błąd podczas pobierania informacji o przesyłce');
    }
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});