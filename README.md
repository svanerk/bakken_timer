# Bakken

Een eenvoudige PWA voor het meten van baktijden met zes personen en een gedeeld Supabase-scoreboard.

## 1. Supabase instellen

1. Maak een gratis Supabase-project.
2. Open **SQL Editor**.
3. Plak de inhoud van `supabase.sql`.
4. Voer het script uit.
5. Ga naar de API/project settings en kopieer:
   - Project URL
   - anon/public/publishable key
6. Vul deze in in `config.js`.

Gebruik **nooit** een `service_role` of secret key in `config.js`.

## 2. Namen aanpassen

Pas de zes personen aan in zowel:
- `app.js` → `PEOPLE`
- `supabase.sql` → de INSERT van `people`

Gebruik voor beide dezelfde `id`.

## 3. Lokaal testen

Je kunt de bestanden niet betrouwbaar openen via `file://` omdat een service worker een HTTP(S)-omgeving nodig heeft.

Met Python:

```bash
python3 -m http.server 8000
```

Open daarna:

http://localhost:8000

## 4. GitHub Pages

Maak een GitHub repository en upload alle bestanden.

Ga naar:

**Repository → Settings → Pages**

Kies:
- Source: **GitHub Actions**

of gebruik een Pages workflow.

De website moet via HTTPS worden aangeboden. GitHub Pages doet dit voor je.

## 5. PWA

Op een telefoon kan de website vervolgens aan het beginscherm worden toegevoegd. De app opent dan in standalone-modus.

## Belangrijk over beveiliging

Deze versie heeft bewust geen login. Iedereen die de URL heeft kan een tijd toevoegen.

De publieke Supabase key is geschikt om in een frontend te gebruiken zolang Row Level Security correct is ingesteld. De database-policy staat alleen INSERT toe voor pogingen en voorkomt publieke UPDATE/DELETE.

Als je later wilt voorkomen dat mensen willekeurige tijden insturen, kun je bijvoorbeeld een pincode, QR-code of beheerdersfunctie toevoegen.
