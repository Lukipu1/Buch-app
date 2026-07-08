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
| Kamera | **expo-camera** | Scan-Aufnahme. |
| Import | **expo-image-picker** | Seiten aus der Galerie importieren. |
| Haptik | **expo-haptics** | Dezentes taktiles Feedback. |

Kein globaler UI-Kit-Ballast: Alle Komponenten sind selbst gebaut und an ein zentrales Design-System gebunden.

---

## Setup

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Dev-Server starten
npm run start
#   → i (iOS-Simulator)  |  a (Android)  |  Expo Go via QR-Code

# Qualitätschecks
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

> **Kamera & Haptik** funktionieren nur auf echten Geräten / Simulatoren, nicht im Web-Target. Der Rest der App (Bibliothek, Reader, Suche, Settings) läuft überall.

Im Entwicklungsmodus (`__DEV__`) werden beim ersten Start automatisch **Mock-Bücher** angelegt, damit alle Screens sofort mit Inhalt gefüllt sind (siehe `src/utils/mockData.ts`).

---

## Architektur

Klare Trennung zwischen **UI**, **State** und **Datenzugriff**:

```
app/                       # Expo-Router-Routen (dünne Wrapper um Feature-Screens)
  _layout.tsx              # Root: ThemeProvider, DB-Bootstrap, Splash-Gating, Stack
  index.tsx                # Einstieg → Onboarding oder Tabs
  onboarding.tsx
  (tabs)/                  # Tab-Navigation: Bibliothek, Suche, Einstellungen
  book/[id].tsx            # Buch-Detail
  reader/[id].tsx          # Reader (Fullscreen-Modal)
  scanner.tsx              # Scanner (Fullscreen-Modal)

src/
  components/              # Wiederverwendbare UI-Primitive (Button, Card, Input, …)
  features/                # Fachlogik je Bereich (UI + Hooks)
    onboarding/
    library/               # Bibliothek + Buch-Detail
    scanner/
    reader/
    search/
    settings/
  services/
    database/              # SQLite: Schema, Migrationen, Repositories
    ocr/                   # OCR-Abstraktion (Interface + Provider-Registry)
    storage/               # Bild-Persistenz + App-Metadaten
  store/                   # Zustand-Stores (app, settings, library, scanner)
  theme/                   # Design-Tokens + ThemeProvider (Light/Dark)
  types/                   # Domänenmodelle
  utils/                   # Formatierung, IDs, Haptik, Mock-Daten
```

### Datenfluss

```
Screen (features/*)  →  Store (store/*)  →  Repository (services/database/*)  →  SQLite
                     ↘  Hook (useX)      ↗
```

Screens lesen nie direkt aus der DB. Stores und Feature-Hooks kapseln Repository-Aufrufe; Repositories sind die einzige Stelle mit SQL.

### Design-System (`src/theme`)

Zentrale Tokens: `colors` (Light + Dark), `typography` (iOS-Textstile), `spacing` (4pt-Raster), `radius`, `shadows`. Komponenten lesen ausschließlich über `useTheme()` — kein hartkodiertes Styling. Dark Mode ist vollständig vorbereitet und über **System / Hell / Dunkel** in den Einstellungen umschaltbar.

### Datenmodell

`Book` (id, title, author, coverImageUri, createdAt, updatedAt, lastOpenedAt, currentPageIndex, totalPages) · `Page` (id, bookId, pageIndex, imageUri, ocrText, createdAt) · `Settings` (theme, readerFontSize, ocrLanguage). Seiten hängen per `ON DELETE CASCADE` am Buch. Schema-Migrationen laufen versioniert über `PRAGMA user_version` (`services/database/schema.ts`).

---

## Was bereits funktioniert

- ✅ **Onboarding** (3 Screens, Paging, Skip, persistierter Abschluss-Flag)
- ✅ **Bibliothek**: Rasteransicht mit Buchkarten, Live-Suche, Sortierung (zuletzt hinzugefügt / zuletzt gelesen / Titel), Empty- & No-Result-States, Skeletons, Pull-to-Refresh
- ✅ **Buch-Detailseite**: Cover, Metadaten, Fortschritt, Seiten-Grid, Aktionen (Lesen / Weiter scannen / Bearbeiten / Löschen mit Bestätigung)
- ✅ **Scanner**: Kamera-Aufnahme, Galerie-Import (mehrfach), Draft-Vorschau-Leiste, Seiten entfernen, Reihenfolge im Store änderbar, Speichern als neues Buch oder Anhängen an bestehendes
- ✅ **OCR-Abstraktion**: `OcrProvider`-Interface + Mock-Provider, Ergebnis wird pro Seite gespeichert, Fehlerbehandlung (`OcrError`)
- ✅ **Reader**: seitenweises Paging, Bild-/Textmodus, Schriftgröße, Lesemodi (Hell/Sepia/Dunkel), Seitenübersicht (TOC), Fortschritt wird gemerkt und gespeichert
- ✅ **Suche**: global über Titel, Autor und OCR-Text; Ergebnisse nach Buch gruppiert mit Seiten-Snippets
- ✅ **Einstellungen**: Theme, Standard-Schriftgröße, Speicherübersicht, OCR-Sprache, rechtlicher Hinweis
- ✅ **Lokale Speicherung**: SQLite + persistente Bildablage; keinerlei Cloud/Upload
- ✅ **UX-Fundament**: Loading-/Empty-/Error-States, Bestätigungsdialoge, dezente Haptik, flüssige Übergänge

Verifiziert: `npm run typecheck` und `npm run lint` laufen sauber; ein vollständiger Metro-Bundle-Export (`expo export`) baut ohne Fehler.

---

## Was als Nächstes implementiert werden sollte

1. **Echte OCR** anbinden (siehe unten) und OCR bei Bedarf nachträglich pro Seite auslösen (Speicherlogik pro Seite vorhanden).
2. **Drag-&-Drop-Sortierung** der Seiten im Scanner/Detail (Logik `moveDraft` / `reorderPages` ist bereits da) — z. B. mit `react-native-reanimated` + Gesture Handler.
3. **Bildoptimierung**: automatische Kantenerkennung/Perspektivkorrektur und Kompression beim Scan.
4. **PDF-Export** eines Buchs.
5. **Reader-Feinschliff**: Pinch-to-Zoom im Bildmodus, Lesezeichen, Textsuche innerhalb eines Buchs.
6. **Tests**: Repositories und Utils sind bewusst rein/testbar gehalten (`_resetDatabaseForTests` vorhanden).
7. **Optionale Cloud-Sync** — strikt opt-in, unter Beibehaltung des Local-First-Prinzips.

---

## Hinweise zur OCR-Erweiterung

Die OCR ist vollständig hinter einem Interface abstrahiert (`src/services/ocr`):

```ts
interface OcrProvider {
  id: string;
  displayName: string;
  recognize(request: OcrRequest): Promise<OcrResult>;
  supportedLanguages(): OcrLanguage[];
}
```

Einen echten Provider anbinden:

1. Neue Klasse anlegen, die `OcrProvider` implementiert (Vorlage: `MockOcrProvider.ts`).
   - **Apple Vision** → kleines Native-/Expo-Modul, das `VNRecognizeTextRequest` bridgt (nur iOS, offline, sehr gut für Deutsch/Englisch).
   - **Google ML Kit** → via Config-Plugin + nativer Text-Recognizer (iOS + Android, offline).
   - **Tesseract** → WASM- oder Native-Binding (plattformübergreifend, größer).
   - **Cloud-API** → `fetch()` an den eigenen Endpunkt. ⚠️ Nur mit ausdrücklicher Nutzerzustimmung hochladen — das Local-First-Versprechen der App gilt.
2. Provider in `src/services/ocr/index.ts` registrieren und `activeProviderId` setzen.
3. Rest der App bleibt unverändert — `useScannerStore.commit()` ruft nur `getOcrProvider().recognize(...)` auf und speichert das Ergebnis pro Seite.

Die gewählte OCR-Sprache liegt in den Settings (`ocrLanguage`) und wird an `recognize()` durchgereicht.

---

## Hinweise zur Kamera-Integration

Die Scan-Ansicht (`src/features/scanner`) nutzt bereits `expo-camera` (`CameraView`) mit Permission-Gate, Auslöser, Galerie-Import und Draft-Verwaltung. Für den Produktionsausbau:

- **Berechtigungen**: Texte sind in `app.json` (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, Android-Permissions) hinterlegt.
- **Bildqualität**: aktuell `quality: 0.8`. Für Dokumentenscans empfiehlt sich zusätzlich Kantenerkennung + Perspektivkorrektur (z. B. ein Dokumentenscanner-Native-Modul) und anschließende Kompression.
- **Speicherung**: Kamera-/Galerie-URIs sind temporär. `imageStorage.persist()` kopiert sie ins Dokumentenverzeichnis — nur dieser stabile URI landet in der DB.
- **Reihenfolge**: `useScannerStore.moveDraft()` (vor dem Speichern) und `pageRepository.reorderPages()` (persistiert) sind vorhanden; es fehlt nur die Drag-&-Drop-UI.

---

## Datenschutz

Buch ist **lokal-first**: Alle Scans, Seiten und Metadaten bleiben ausschließlich auf dem Gerät (SQLite + App-Dokumentenverzeichnis). Es gibt **keine Cloud-Anbindung und keine externen Uploads** im Fundament. Zukünftige Netzwerkfunktionen (Cloud-OCR, Sync) müssen explizit implementiert und vom Nutzer bestätigt werden.
