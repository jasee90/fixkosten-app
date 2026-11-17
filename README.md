# Fixkosten

Persönliche Web-App (PWA) für Gas, Strom und Fixkosten. Sie läuft auf dem iPhone wie eine normale App, braucht kein Xcode, keinen App Store und kein Entwicklerkonto.

- Gas und Strom: Zählerstände eintragen, Verbrauch pro Tag, Kosten pro Monat, Hochrechnung gegen den Abschlag
- Fixkosten: beliebige Posten, auch halbjährlich oder jährlich, werden auf den Monat umgerechnet
- Geplante Preisänderungen mit Meldung etwa 60 Tage vorher
- Export und Import der Daten als JSON-Datei
- Läuft offline, keine Konten, kein Tracking, keine externen Anfragen

## Daten und Datenschutz

Alle Daten liegen ausschließlich im Speicher des Geräts (`localStorage`). Im Repo steckt **kein** persönlicher Wert, nur der Code. Das Repo kann deshalb auch öffentlich sein, zum Beispiel für GitHub Pages.

Wichtig: Daten im Browserspeicher können verloren gehen, etwa beim Löschen der Website-Daten oder bei einem Gerätewechsel. **Exportiere deshalb regelmäßig** (Zahnrad oben rechts, dann „Daten exportieren“) und speichere die Datei in iCloud Drive.

## Installation auf dem iPhone

1. Die App einmal über HTTPS hosten (siehe unten).
2. Die Adresse in **Safari** öffnen.
3. Teilen-Symbol, dann **„Zum Home-Bildschirm“**, dann „Hinzufügen“.
4. Die App über das neue Symbol starten. Sie läuft im Vollbild und auch offline.
5. Zahnrad, dann „Daten importieren“, um eine vorhandene Sicherung einzulesen.

Die installierte Home-Bildschirm-App hat einen eigenen Speicher. Daten aus dem Safari-Tab sind dort nicht sichtbar. Importiere also nach der Installation.

## Erste Einrichtung auf GitHub (ohne Kommandozeile)

1. Auf github.com ein neues Repository `fixkosten-app` anlegen, **Public**.
2. *Add file, Upload files*: den **Inhalt** der entpackten ZIP-Datei hineinziehen (nicht den Ordner selbst, `index.html` muss oben im Repo liegen), *Commit changes*.
3. *Settings, Pages*: Branch `main`, Ordner `/ (root)`, speichern.
4. Nach etwa einer Minute ist die App unter `https://<dein-github-name>.github.io/fixkosten-app/` erreichbar.

## Hosting

Jeder statische Webserver mit HTTPS reicht, die App besteht nur aus Dateien.

**GitHub Pages:** Repo anlegen und pushen, dann *Settings, Pages, Deploy from branch, `main`, `/ (root)`*. Für Pages aus privaten Repos ist ein bezahlter GitHub-Tarif nötig. Da im Repo keine persönlichen Daten liegen, ist ein öffentliches Repo unkritisch.

**Eigener Server / Cloudflare Pages / Netlify:** Den Ordnerinhalt ins Webroot legen. Die Adresse darf in einem Unterpfad liegen, alle Pfade sind relativ.

Lokal testen:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Export und Import

- **Export:** erzeugt `fixkosten-JJJJ-MM-TT.json`. Auf dem iPhone öffnet sich das Teilen-Menü, dort „In Dateien sichern“ wählen.
- **Import:** wählt eine solche Datei aus. Vor dem Ersetzen siehst du, wie viele Einträge sie enthält. Die aktuellen Daten werden dabei ersetzt.

Dateiformat:

```json
{
  "app": "fixkosten",
  "version": 1,
  "exportedAt": "2026-11-17T12:00:00.000Z",
  "data": {
    "gas":   { "unit": "m³", "kwh": 10.6, "preisCt": 8.64, "grundJahr": 231.03, "abschlag": 106, "readings": [{ "d": "2026-11-16", "v": 434.219 }] },
    "strom": { "unit": "kWh", "kwh": 1, "preisCt": 0, "grundJahr": 0, "abschlag": 0, "readings": [] },
    "fix":   [{ "id": "x", "name": "Internet", "betrag": 19.99, "rhythmus": "monat", "icon": "internet",
                "aenderungen": [{ "ab": "2027-05-02", "betrag": 44.99 }] }]
  }
}
```

`rhythmus`: `monat`, `quartal`, `halbjahr`, `jahr`. `icon`: `wohnen`, `internet`, `handy`, `versicherung`, `auto`, `abo`, `other`.

## Aufbau

```
index.html            Einstieg
css/style.css         Design (dunkel, hell über prefers-color-scheme)
js/version.js         Versionsnummer (einzige Stelle)
js/app.js             gesamte Logik, keine Abhängigkeiten
sw.js                 Service Worker (Offline-Cache)
manifest.webmanifest  PWA-Angaben
icons/                App-Symbole
```

## Updates ausliefern

1. Änderungen an den Dateien machen (oder die ZIP-Datei mit dem Update entpacken).
2. In `js/version.js` die Versionsnummer erhöhen, zum Beispiel `1.0.1`. Ohne neue Nummer erkennt das iPhone keine neue Version.
3. Auf GitHub hochladen: *Add file, Upload files*, die Dateien hineinziehen, *Commit changes*. Alternativ per `git push`.
4. Beim nächsten Öffnen mit Internet zeigt die App oben **„Neue Version verfügbar“**. Auf *Aktualisieren* tippen, die App lädt neu. Die Daten bleiben erhalten, sie liegen getrennt vom App-Code im Gerätespeicher.

## Berechnung

- Verbrauch = Differenz zweier Zählerstände, Dauer in Tagen
- kWh = m³ × Umrechnungsfaktor (Brennwert × Zustandszahl, Standard 10,6, unter Tarife anpassbar)
- Kosten = kWh × Arbeitspreis + Grundpreis pro Tag (Jahresgrundpreis / 365)
- Monatswerte: Verbrauch eines Zeitraums wird gleichmäßig auf seine Tage verteilt
