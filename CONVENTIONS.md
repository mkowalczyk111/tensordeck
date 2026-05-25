# TensorDeck — Konwencje kodu

## Stack
- **Vite** + React 19 + TypeScript (strict)
- **MUI v9** (Material UI) — WSZYSTKIE layout props w `sx={{}}`, NIGDY bezpośrednio (np. ~~`<Box display="flex">`~~ → `<Box sx={{ display: 'flex' }}>`)
- **Framer Motion** — animacje i przejścia stron
- **tsconfig**: `verbatimModuleSyntax` → używaj `import type` dla typów, `noUnusedLocals`, `noUnusedParameters` → prefixuj `_` nieużywane

## Architektura

### Nawigacja
Brak React Router. Własny `NavigationContext` w `App.tsx`:
```tsx
type PageId = 'dashboard' | 'study' | 'browse' | 'import' | 'settings' | 'stats' | 'app-settings';
```
Używaj `useNav()` → `{ navigate, goBack, nav, store }`.

### Stan (store)
`useFlashcardStore()` — hook z localStorage + opcjonalny Firebase sync.
- Zwraca: `groups, studyModes, activityHeatmap, getDueCards, updateGroup, ...`
- Filtrowanie kart: użyj eksportowanej `filterCards(cards, filter)` z `useFlashcardStore.ts`
- Typy filtrów: `CardFilter = 'all' | 'new' | 'review' | 'new+review'`

### SRS
FSRS v4.5 w `srs/srsEngine.ts`. Stany: 0=New, 1=Learning, 2=Review, 3=Relearning.
`stability` = interwał w dniach (BEZ mnożnika).

### Sesja nauki
`useStudySession(group, steps, onCardReviewed)` — obsługuje TTS, STT, hold/release, restart.

### Serwisy
- `ttsService` — Web Speech API TTS
- `getSttService()` — STT z `continuous: true`, 1s inactivity timeout
- `audioFeedback` — dźwięki mikrofonu (Web Audio API)
- `firebase` — opcjonalny, zarządzany przez env vars `VITE_FIREBASE_*`

### Wspólne komponenty
- `SegmentedProgressBar` + `computeCardStats()` z `components/SegmentedProgressBar.tsx`

## Styl kodu
- Każdy plik < 300 linii; jak przekracza → wydziel do osobnego pliku
- Cały UI po polsku
- MD3 Expressive estetyka — vibrant colors, subtle animations, premium feel
- Importy MUI: pojedyncze (`import Box from '@mui/material/Box'`), NIE destructured
- Seed data migracja: bump `SEED_VERSION` w `useFlashcardStore.ts` gdy zmienisz domyślne tryby

## Struktura plików
```
src/
├── types/models.ts          # FlashcardGroup, Flashcard, SrsState, StudyMode, ModeStep
├── srs/srsEngine.ts         # FSRS, matchSpeech, mapMatchToRating
├── services/
│   ├── ttsService.ts
│   ├── sttService.ts
│   ├── audioFeedback.ts
│   └── firebase.ts
├── hooks/
│   ├── useFlashcardStore.ts  # główny store + filterCards export
│   ├── useStudySession.ts
│   └── useLocalStorage.ts
├── components/
│   └── SegmentedProgressBar.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── StudyPage.tsx
│   ├── BrowsePage.tsx
│   ├── ImportPage.tsx
│   ├── SettingsPage.tsx
│   ├── StatsPage.tsx
│   └── AppSettingsPage.tsx
├── App.tsx                   # NavigationContext, ThemeProvider, AnimatePresence
├── theme.ts                  # createM3Theme(mode, customColors?)
└── main.tsx
```
