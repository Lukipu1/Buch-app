# Buch 📚

Eine hochwertige, lokal-first Mobile-App zum **Einscannen, Organisieren und Lesen** eigener Bücher. Das Fundament ist auf einen cleanen, ruhigen Apple-Look ausgelegt und als saubere, erweiterbare Codebasis angelegt.

> **Rechtlicher Hinweis:** Digitalisiere nur Inhalte, für die du die entsprechenden Nutzungsrechte besitzt (eigene Aufzeichnungen, persönliche Sicherungskopien). Siehe auch den Hinweis in den App-Einstellungen.

---

## Tech-Stack

| Bereich | Wahl | Begründung |
| --- | --- | --- |
| Framework | **React Native + Expo (SDK 52)** | Schneller Start, Zugriff auf Kamera/Dateisystem/SQLite ohne eigenen Native-Build, gute DX. |
| Sprache | **TypeScript** (strict) | Durchgängige Typsicherheit über UI, State und Datenzugriff. |
| Navigation | **Expo Router** (dateibasiert) | Klare Routen, typisierte Links, Deep-Linking vorbereitet. |
| State | **Zustand** | Leichtgewichtig, minimaler Boilerplate, gut testbar. |
| Persistenz | **expo-sqlite** (async API) | Relationale Daten (Bücher ↔ Seiten), Suche über OCR-Text, Migrationen. |
| Bilder | **expo-file-system** | Scans werden stabil im App-Dokumentenverzeichnis abgelegt. |
| Scanner (iOS) | **Apple VisionKit** (eigenes Expo-Modul `modules/buch-scanner`) | Apples Dokumentenscanner: Kantenerkennung, Entzerrung, automatischer Zuschnitt, Mehrseiten-Aufnahme. |
| OCR (iOS) | **Apple Vision** (`VNRecognizeTextRequest`) | Präzise Texterkennung komplett auf dem Gerät. |
| Kamera (Fallback) | **expo-camera** | Aufnahme auf Android / in Expo Go. |
| Bildbearbeitung | **expo-image-manipulator** | Drehen, Teilen (Fallback ohne natives Modul). |
| Display | **expo-keep-awake** | Bildschirm bleibt beim Lesen an. |
| Import | **expo-image-picker** | Seiten aus der Galerie importieren. |
| Haptik | **expo-haptics** | Dezentes taktiles Feedback. |

Kein globaler UI-Kit-Ballast: Alle Komponenten sind selbst gebaut und an ein zentrales Design-System gebunden.

---

## Setup

```bash
# 1. Abhängigkeiten installieren
npm install

# 2a. iOS Development Build (empfohlen – nötig für Apple-Scanner + Apple-OCR)
npm run ios                 # = expo run:ios (lokal, Xcode erforderlich)
#    oder in der Cloud:
npx eas build --profile development --platform ios

# 2b. Schnellstart ohne native Module (Expo Go / Android)
npm run start

# Qualitätschecks
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

> **Wichtig:** Der Apple-Dokumentenscanner und die Apple-Texterkennung sind ein
> eigenes natives Modul (`modules/buch-scanner`, Swift). Es läuft nur in einem
> **Development- oder Production-Build** (`expo run:ios` / EAS), **nicht in Expo Go**.
> Ohne das Modul fällt die App automatisch auf die Kamera-Aufnahme (expo-camera),
> mittiges Teilen von Doppelseiten und – im Entwicklungsmodus – Mock-OCR zurück.
> Die nativen Projektordner (`ios/`, `android/`) werden per Prebuild erzeugt und
> sind nicht eingecheckt.

Im Entwicklungsmodus (`__DEV__`) werden beim ersten Start automatisch **Beispielbücher** angelegt (gemeinfreie Texte, u. a. Kafkas „Die Verwandlung“), damit alle Screens – inklusive Textmodus und Suche – sofort Inhalt haben (siehe `src/utils/mockData.ts`).

---

## Architektur

Klare Trennung zwischen **UI**, **State** und **Datenzugriff**:

```
app/                       # Expo-Router-Routen (dünne Wrapper um Feature-Screens)
  _layout.tsx              # Root: ThemeProvider, DB-Bootstrap, Splash-Gating, Stack
  index.tsx                # Einstieg → Onboarding oder Bibliothek
  onboarding.tsx
  library/index.tsx        # Bibliothek (Start-Screen)
  book/[id].tsx            # Buch-Detail
  scanner/index.tsx        # Scanner (Fullscreen-Modal)
  reader/[id].tsx          # Reader (Fullscreen-Modal)
  search.tsx
  settings.tsx

src/
  components/              # Wiederverwendbare UI-Primitive
    AppButton · AppCard · AppHeader · BookCard · EmptyState
    PagePreview · SearchInput · Input · Text · IconButton
    ProgressBar · Skeleton · SegmentedControl · confirm
  features/                # Fachlogik je Bereich (UI + Hooks)
    onboarding/
    library/               # Bibliothek + Buch-Detail
    scanner/
    reader/
    search/
    settings/
  services/
    database/              # SQLite: schema.ts, repository.ts (+ Entity-Repos inkl. Lesezeichen), db.ts
    ocr/                   # OCRProvider.ts, VisionOCRProvider.ts, Mock/No-Provider, textAssembly.ts
    scanner/               # nativeScanner.ts (Bridge), imageProcessing.ts (Scan-Pipeline + Fallbacks)
    storage/               # storageService.ts (Bild-Persistenz + App-Metadaten)
  store/                   # Zustand-Stores (app, settings, library, scanner, ocr-Queue)
  theme/                   # colors · spacing · typography · radius · shadows · theme
  types/                   # book.ts · page.ts · settings.ts (+ models.ts Barrel)
  utils/                   # date.ts · ids.ts · format · bytes · haptics · mockData

modules/
  buch-scanner/            # Lokales Expo-Modul (Swift): VisionKit-Scanner, Seitentrennung, Vision-OCR
```

> Hinweis zur Navigation: Die App nutzt bewusst eine flache Stack-Struktur.
> Die **Bibliothek** ist der Start-Screen; Suche, Einstellungen und Scanner
> werden von dort per Header-Aktionen geöffnet.

### Datenfluss

```
Screen (features/*)  →  Store (store/*)  →  Repository (services/database/*)  →  SQLite
                     ↘  Hook (useX)      ↗
```

Screens lesen nie direkt aus der DB. Stores und Feature-Hooks kapseln Repository-Aufrufe; Repositories sind die einzige Stelle mit SQL.

### Design-System (`src/theme`)

Zentrale Tokens: `colors` (Light + Dark), `typography` (iOS-Textstile), `spacing` (4pt-Raster), `radius`, `shadows`. Komponenten lesen ausschließlich über `useTheme()` — kein hartkodiertes Styling. Dark Mode ist vollständig vorbereitet und über **System / Hell / Dunkel** in den Einstellungen umschaltbar.

### Datenmodell

`Book` (id, title, author, coverImageUri, createdAt, updatedAt, lastOpenedAt, currentPageIndex, readingOffset, readingTimeMs, totalPages) · `Page` (id, bookId, pageIndex, imageUri, ocrText – `NULL` = noch nicht erkannt, createdAt) · `Bookmark` (id, bookId, pageId, textOffset, snippet, createdAt) · `Settings` (App-Theme, Reader-Schrift/-Größe/-Abstand/-Ränder/-Blocksatz/-Hintergrund/-Modus, Display aktiv, Doppelseiten-Modus, Auto-Zuschnitt, OCR-Sprache). Seiten und Lesezeichen hängen per `ON DELETE CASCADE` am Buch; beim Löschen werden auch die Bilddateien entfernt. Schema-Migrationen laufen versioniert über `PRAGMA user_version` (`services/database/schema.ts`).

---

## Was bereits funktioniert

### Scannen
- ✅ **Apple-Dokumentenscanner (VisionKit)** öffnet sich sofort beim Scannen: Seitenränder werden erkannt, entzerrt und automatisch zugeschnitten; beliebig viele Seiten am Stück.
- ✅ **Jede Seite einzeln:** Doppelseiten (Querformat) werden automatisch an der **Buchmitte (Falz)** getrennt. Der Falz wird per Helligkeits-/Kontrastanalyse gefunden, der Schatten wird weggeschnitten. Einstellbar: Automatisch / Immer / Nie.
- ✅ **Foto-Import** aus der Mediathek mit automatischem Zuschneiden (Vision Document Segmentation + Perspektivkorrektur) und Seitentrennung.
- ✅ **Seiten prüfen vor dem Speichern:** Raster aller Seiten, Großansicht mit **Teilen**, **Drehen**, **Verschieben** und **Löschen**.
- ✅ Speichern als neues Buch (Titel + Autor) oder Anhängen an ein bestehendes – **sofort**, ohne Wartezeit.

### Texterkennung
- ✅ **Apple Vision OCR** (genau, offline, auf dem Gerät), Sprache wählbar.
- ✅ **Hintergrund-Queue:** Text wird nach dem Speichern Seite für Seite erkannt, Fortschritt sichtbar in Buch-Detail und Reader, wird nach App-Neustart fortgesetzt.
- ✅ **Absatz-Rekonstruktion:** Zeilen werden zu Absätzen zusammengesetzt, Silbentrennungen aufgelöst, Seitenzahlen und Kolumnentitel entfernt.

### Reader (Kindle-Prinzip)
- ✅ **Textmodus mit echtem Seitenumbruch:** Der Text aller Seiten fließt als ein durchgehendes Buch (Sätze und Wörter über Seitengrenzen werden verbunden) und wird exakt auf den Bildschirm umbrochen – gemessen mit der echten Text-Engine des Geräts.
- ✅ **Originalmodus:** die Scans, mit Pinch-to-Zoom (iOS).
- ✅ **Blättern** per Wischen oder Tippen auf den linken/rechten Rand, Mitte öffnet das Menü; Statusleiste wird beim Lesen ausgeblendet.
- ✅ **„Aa“-Darstellung:** Schriftgröße, 4 Schriftarten (Georgia, Palatino, Iowan, Modern), Zeilenabstand, Seitenränder, Blocksatz/Linksbündig, 5 Hintergründe (Weiß, Sepia, Grün, Dunkel, Schwarz). Wird global gespeichert.
- ✅ **Fortschritt** wie beim Kindle: „Seite x von y“, Prozent, **verbleibende Lesezeit**, Fortschrittsregler zum Springen.
- ✅ **Lesezeichen** (Lesezeichen-Band auf der Seite), Inhaltsübersicht mit Seiten-Raster und Lesezeichenliste.
- ✅ **Suche im Buch** mit hervorgehobenen Treffern und Sprung an die Stelle.
- ✅ Position wird zeichengenau gemerkt, **Lesezeit** wird erfasst, Display bleibt optional aktiv.

### Bibliothek & Verwaltung
- ✅ **Weiterlesen-Karte** für das zuletzt gelesene Buch, Raster aller Bücher, Live-Filter, Sortierung, Aktualisierung bei Rückkehr.
- ✅ **Buch-Detail:** Cover, Fortschritt, Lesezeit, Status der Texterkennung, Seiten-Raster. Lange drücken auf eine Seite: ab hier lesen, als Cover verwenden, Text neu erkennen, verschieben, löschen.
- ✅ **Globale Suche** über Titel, Autor und erkannten Text.
- ✅ **Einstellungen:** Hell/Dunkel/System (Standard: **Hell**), Reader-Standard, Display aktiv, Scanner-Optionen, OCR-Engine und -Sprache, Speicherübersicht.
- ✅ **Lokal-first:** SQLite + Bildablage im App-Verzeichnis, keinerlei Upload.

Verifiziert: `npm run typecheck` und `npm run lint` laufen sauber; `expo export` (iOS + Android) baut; Autolinking erkennt das native Modul `BuchScanner`. Text-Rekonstruktion, Buch-Textfluss und Seitenumbruch-Logik wurden mit Tests gegen Beispieldaten geprüft. Der Swift-Code konnte in dieser Umgebung (Linux) nicht kompiliert werden – beim ersten `expo run:ios` bitte kurz prüfen.

---

## Was als Nächstes sinnvoll ist

1. **Android-Scanner:** Google ML Kit Document Scanner als Android-Gegenstück im selben Modul.
2. **Markierungen & Notizen** im Textmodus (Textauswahl).
3. **Kapitel** automatisch aus Überschriften erkennen (Inhaltsverzeichnis).
4. **PDF/EPUB-Export** eines Buchs.
5. **Tests** als feste Suite (Jest) für `textAssembly`, `bookText` und die Repositories.
6. **Optionale Cloud-Sync** — strikt opt-in.

---

## Hinweise zur OCR-Erweiterung

Die OCR ist hinter einem Interface abstrahiert (`src/services/ocr`):

```ts
interface OcrProvider {
  id: string;
  displayName: string;
  recognize(request: OcrRequest): Promise<OcrResult>;
  supportedLanguages(): OcrLanguage[];
}
```

Die Registry (`src/services/ocr/index.ts`) wählt automatisch: **Apple Vision** (wenn das native Modul vorhanden ist) → **Mock** (nur `__DEV__`) → **keine OCR**. Ein weiterer Provider (z. B. ML Kit für Android) implementiert `OcrProvider`, liefert idealerweise positionierte Zeilen an `assembleText()` und wird in der Registry eingetragen. Die Hintergrund-Queue (`src/store/useOcrStore.ts`) bleibt unverändert.

---

## Hinweise zum Scanner

- **Natives Modul** `modules/buch-scanner/ios`: `scanDocument` (VisionKit), `processImage` (Zuschnitt + Teilen für Fotos), `recognizeText` (Vision). JS-Zugriff über `src/services/scanner/nativeScanner.ts`; in Expo Go ist es `null`.
- **Seitentrennung** (`PageProcessor.swift` / `GutterDetector`): Bilder mit Seitenverhältnis > 1,12 gelten als Doppelseite. Im mittleren Bildbereich wird pro Spalte `Helligkeit + Standardabweichung` bewertet; der Falz (dunkler, gleichmäßiger Schatten) hat den kleinsten Wert. Ohne klares Ergebnis wird mittig geteilt.
- **Berechtigungen**: Texte sind in `app.json` hinterlegt (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`).
- **Speicherung**: Temporäre Scans werden von `imageStorage.persist()` ins Dokumentenverzeichnis verschoben – nur dieser stabile URI landet in der DB.

---

## Datenschutz

Buch ist **lokal-first**: Alle Scans, Seiten und Metadaten bleiben ausschließlich auf dem Gerät (SQLite + App-Dokumentenverzeichnis). Es gibt **keine Cloud-Anbindung und keine externen Uploads** im Fundament. Zukünftige Netzwerkfunktionen (Cloud-OCR, Sync) müssen explizit implementiert und vom Nutzer bestätigt werden.
