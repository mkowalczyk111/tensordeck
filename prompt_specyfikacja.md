# Zaktualizowany Prompt i Specyfikacja: Rebudowa Aplikacji Fiszki (FSRS + MD3 Expressive)

Skopiuj poniższą treść i wklej ją do czatu z asystentem AI w nowym projekcie:

```markdown
Jesteś ekspertem web developmentu. Stwórzmy od zera aplikację do nauki języków za pomocą fiszek o nazwie "Fiszki" (interfejs w języku polskim). 
Aplikacja ma działać w przeglądarce, na desktopie (Tauri) oraz na Androidzie (Capacitor).

Zastosuj następujące zasady techniczne i projektowe:

### 1. ZASADY OGÓLNE I RENDEROWANIE
- **Technologia:** React (v18+) + TypeScript + Vite.
- **Stylizowanie:** Vanilla CSS. Żadnych frameworków typu TailwindCSS. Pisz czytelne, semantyczne reguły.
- **Design:** Zastosuj zasady projektowania **Material 3 Expressive**
- **Modułowość:** Żaden plik z kodem (TS, TSX, CSS) nie może przekraczać 300 linii.
- Aplikacja ma wspierać Predictive Back Gestures

### 2. MODELE DANYCH I ALGORYTM FSRS (src/types/models.ts)
Aplikacja musi używać algorytmu **FSRS (Free Spaced Repetition Scheduler)** Zdefiniuj następujące interfejsy:

- **FSRS State:**
  ```typescript
  export interface SrsState {
    difficulty: number;          // Trudność (1-10)
    stability: number;           // Stabilność
    repetitions: number;         // Liczba powtórzeń (repetitions >= 1 oznacza, że karta została "nauczona")
    state: number;               // Stan FSRS (0: New, 1: Learning, 2: Review, 3: Relearning)
    lastReviewTimestamp: number; // Znacznik czasu ostatniej powtórki
    nextReviewTimestamp: number; // Znacznik czasu kolejnej powtórki
  }
  ```
- **Fiszki i Grupy:**
  - `Flashcard`: zawiera `id`, `pages: string[]` (tablica stron fiszki, np. słowo, tłumaczenie, przykład) oraz `srsState: SrsState`.
  - `FlashcardGroup`: zawiera `id`, `name`, `cards: Flashcard[]`, `activeModeId`, `pageLanguages: string[]` (tagi BCP-47 dla stron) i `pageNames: string[]` (np. ['Słowo', 'Tłumaczenie', 'Przykład']).
- **Kroki trybów nauki (ModeStep):**
  - Dyskryminowana unia typów dla kroku sesji: 
    - `show_page` (wyświetlenie strony o indeksie `pageIndex`)
    - `speak_page` (przeczytanie TTS o indeksie `pageIndex` z pauzą `extraPauseMs`)
    - `dynamic_pause` (pauza liczona z długości tekstu kolejnej strony `nextPageIndex` + `extraPauseMs`)
    - `wait` (stałe odczekanie ms)
    - `listen_and_branch` (nagrywanie STT na języku przypisanym do `pageIndex`. Wynik porównuje z oryginałem. Jeśli podobieństwo jest mniejsze niż `successThreshold` (%), czyta poprawny tekst przez TTS z indeksu `incorrectTtsPageIndex` (jeśli podany)).

### 3. SILNIK FSRS (src/srs/srsEngine.ts)
https://github.com/open-spaced-repetition/fsrs4anki
- Zaimplementuj model FSRS do aktualizacji parametrów `difficulty`, `stability` i `nextReviewTimestamp` w oparciu o oceny użytkownika (1: Again, 2: Hard, 3: Good, 4: Easy).
- **Dopasowanie mowy:** Zaimplementuj funkcję porównywania wypowiedzi STT z tekstem oryginalnym: normalizacja (usunięcie znaków interpunkcyjnych, małe litery) + hybrydowe porównanie (maksimum z globalnego Levenshteina oraz podobieństwa na poziomie pojedynczych słów, aby tolerować przerywniki typu "uhm"). Wynik 0-100% zmapuj na oceny FSRS:
  - Podobieństwo >= 90% -> 5 (Easy)
  - Podobieństwo >= 70% -> 4 (Good)
  - Podobieństwo >= 50% -> 3 (Hard)
  - Podobieństwo < 50% -> 1 (Again)

### 4. ARCHITEKTURA SPEECH & CLOUD (src/services/*)
- **sttService.ts:** Zintegrowany serwis STT (Factory pattern) obsługujący:
  - **Tauri:** Wywołanie komendy IPC `invoke('start_native_stt', { language })` dla natywnego API systemu PC.
  - **Capacitor:** Obsługa natywnej wtyczki `@capacitor-community/speech-recognition` (sprawdzenie/nadanie uprawnień, nasłuchiwanie zdarzeń `partialResults` oraz stanu `listeningState` z automatycznym timeoutem po 15 sekundach).
  - **Web:** Nagrywanie MediaRecorder (webm/opus), konwersja do Base64 i wysłanie zapytania POST do Google Cloud Speech-to-Text API.
- **ttsService.ts:** Synteza mowy Web Speech API z rankingiem głosów (wybieranie najlepszego lokalnego/neuralnego głosu dla danego kodu BCP-47, np. Wavenet/Neural).
- **firebase.ts:** Integracja z Firebase Auth oraz Firestore (z włączoną IndexedDB persistence dla pełnego wsparcia offline i synchronizacji po powrocie sieci).

### 5. NIESTANDARDOWE HOOKI (src/hooks/*)
- `useLocalStorage`: SSR-safe hook z automatyczną synchronizacją stanu między kartami przeglądarki.
- `useFlashcardStore`: CRUD dla grup, fiszek, trybów nauki oraz rejestracja dni aktywności (do heatmapy). Przy pierwszym uruchomieniu tworzy dane startowe (seed).
- `useStudySession`: Maszyna stanów sterująca krokiem po kroku sesją nauki (tylko dla fiszek należnych: `nextReviewTimestamp <= Date.now()`), odtwarzająca TTS/STT i aktualizująca stan FSRS.

### 6. SZCZEGÓŁOWY OPIS WIDOKÓW APLIKACJI (src/pages/* i src/App.tsx)
Aplikacja ma stanowy router w `src/App.tsx` z animacjami przejść stron (framer-motion) i składa się z 7 ekranów:

1. **DashboardPage (Panel główny):**
   - **Górny pasek:** Tytuł aplikacji "Fiszki" z ikoną książki oraz przyciski nawigacji do Statystyk i Ustawień Ogólnych.
   - **Lista grup:** Grid kart w stylu MD3 Expressive. Każda karta prezentuje:
     - Nazwę grupy, liczbę kart w zestawie (np. "4 fiszek").
     - Pasek postępu (procent opanowanych fiszek z przynajmniej 1 powtórką w FSRS) oraz tekstowy licznik kart do powtórki (np. "2 do powtórki").
     - Wiersz akcji: "Ustawienia", "Przeglądaj", "Tryb" (ustawienia trybu nauki grupy, rozwijany przycisk taką strzałką z boku (to ma swoja nazwe w MD3E), i w rozwijanej liście tryby nauki do wyboru).
   - **Przycisk FAB:** Pływający okrągły przycisk (strzałka w gore/upload) w dolnym prawym rogu do przejścia do kreatora importu.
   - **Przycisk FAB:** Pływający okrągły przycisk (+) w dolnym prawym rogu do przejścia do stworzenia nowej grupy.
2. **StudyPage (Ekran nauki):**
   - **Górny pasek:** Przycisk powrotu, nazwa grupy i licznik postępu (np. "3/10").
   - **Boks z fiszką:** Wyśrodkowany kontener w stylu z animacją obracania karty w przestrzeni 3D podczas przejścia między fiszkami. Wyświetla kolejno ujawniane strony fiszki (każda ze swoją etykietą, np. "Strona 1, Strona 2, Strona 3" i wartością tekstową).
   - **Wskaźnik fazy:** Animowane ikony pod kartą: głośnik pulsuje podczas czytania TTS, mikrofon pulsuje podczas nasłuchu STT.
   - **Wynik STT:** Po zakończeniu nagrywania pod kartą wysuwa się panel pokazujący rozpoznany tekst oraz procent dopasowania mowy, oznaczony kolorem (zielony/żółty/czerwony w zależności od progu).
   - **Dolny panel ocen SRS (Rating Bar):** Pojawia się w fazie wyniku. Zawiera 4 przyciski: "Powtórz" (rating 1, czerwony), "Trudne" (rating 2 lub 3, żółty), "Dobrze" (rating 4, fioletowo-niebieski), "Łatwe" (rating 5, zielony).
   - **Ekran ukończenia:** Kiedy wszystkie należne fiszki zostaną powtórzone, pojawia się dedykowany widok z dużą zieloną ikoną Checkmark, nagłówkiem "Brawo! 🎉" i przyciskiem powrotu.

3. **BrowsePage (Przeglądanie i edycja):**
   - **Górny pasek:** Przycisk powrotu, nazwa grupy i badge z liczbą fiszek.
   - **Wyszukiwarka:** Pasek wyszukiwania u góry filtrujący fiszki na żywo na podstawie dopasowania tekstu na dowolnej ze stron.
   - **Lista kart:** Przewijana lista fiszek.
     - **Widok zwykły:** Karta wyświetla wszystkie strony w formie pionowego stosu (np. "Phrase: Good morning", "Tłumaczenie: Dzień dobry") oraz przyciski Edytuj (Edycja) i Usuń.
     - **Widok edycji inline:** Po kliknięciu "Edytuj", karta rozwija się w formularz edycji, w którym każda ze stron fiszki posiada własne pole tekstowe (input). Widoczne są przyciski "Zapisz" oraz "Anuluj".
   - **Przycisk FAB (+):** W prawym dolnym rogu do natychmiastowego dodania nowej, pustej fiszki i otwarcia jej trybu edycji.

4. **ImportPage (Kreator i import):**
   - **Formularz konfiguracji:** Umożliwia podanie nazwy grupy, wybór separatora danych (tabulator, średnik, przecinek, pionowa kreska).
   - **Konfigurowanie stron:** Suwak określający liczbę stron w fiszce (2 do 5) wraz z polami do zdefiniowania języka BCP-47 i nazwy dla każdej strony.
   - **Obszar wklejania:** Duże pole tekstowe do wklejenia zawartości lub przesłania pliku JSON.
   - **Podgląd:** Tabela generowana na bieżąco na dole ekranu prezentująca sparsowane wiersze fiszek.
   - Przycisk "Importuj" zapisuje grupę i wraca do Dashboardu.

5. **SettingsPage (Tryb grupy i kreator trybów):**
   - **Górny pasek:** Przycisk powrotu, nazwa konfiguracji i po prawej przycisk usuwania.
   - **Wybór trybu:** Lista dostępnych trybów nauki (np. Klasyczny, Słuchanie i Mówienie) z opcją natychmiastowego przypisania do grupy.
   - **Kreator trybów (Modal):** Zaawansowany kreator, w którym użytkownik może zdefiniować własne sekwencje kroków sesji nauki. Można dodawać kroki: "Pokaż stronę", "Wymawiaj stronę (TTS)", "Pauza dynamiczna", "Odczekaj (ms)" oraz "Zweryfikuj wymowę (STT)" oraz układać je w dowolnej kolejności z opcją edycji ich parametrów.
   - 

6. **StatsPage (Statystyki):**
   - **Grid metryk:** Cztery karty statystyk: "Seria dni" (streak), "Nauczone" (liczba opanowanych kart / wszystkie), "Do powtórki" (karty z zaległym timestampem), "Dni aktywności" (ogółem zalogowane dni aktywności w aplikacji).
   - **Heatmapa aktywności:** Element SVG o wielkości 20 kolumn na 7 wierszy. Każdy kwadracik reprezentuje jeden dzień. Kolory komórek zmieniają się w zależności od tego, czy użytkownik w danym dniu wykonał powtórki (z tytułem tooltipu z datą przy najechaniu).
   - **Postępy zestawów:** Lista grup z paskami postępu wskazującymi procent opanowania kart w poszczególnych zestawach.

7. **AppSettingsPage (Ustawienia ogólne):**
   - Przełącznik motywu (jasny / ciemny / system).
   - Suwak prędkości czytania syntezatora TTS (od 0.5x do 2.0x).
   - Przycisk eksportu całego stanu aplikacji do pliku JSON (pobieranie).
   - Przycisk importu stanu z pliku JSON (wczytanie).
   - Przycisk pełnego resetu bazy danych do stanu początkowego (z nasionami danych).

Zaimplementuj ten projekt w wysoce modułowej architekturze, dbając o czysty i nowoczesny wygląd zgodny z wytycznymi MD3 Expressive. Rozpocznij od przygotowania struktury katalogów i typów.
```
