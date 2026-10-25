# THE APPLICATION.exe — V1.0 FINAL

**Andrei Catana** · CV narativ interactiv pentru Ioana · pregătit pentru publicare ca site static.

## Publicare / pornire

1. Dezarhivează `THE_APPLICATION_exe_V1_0_FINAL.zip`.
2. Pentru test local: din directorul cu `index.html`, rulează `python -m http.server 8000` și vizitează `http://localhost:8000/`.
3. Pentru GitHub Pages: urcă **conținutul arhivei** în rădăcina repository-ului (sau în folderul configurat ca sursă Pages); `index.html` se află la rădăcină. Fișierul `.nojekyll` este inclus.
4. Testează adresa publică într-o fereastră privată de browser, inclusiv pagina `analiza-plan-detaliat.html`, întoarcerea la plan, redarea video și linkul de booking.
5. Nu este necesar build, npm, backend, bază de date sau API key. Nu există colectare de date și nu există formulare care trimit mesaje către server.

## Povestea

0. The Hook — personalizat pentru Ioana. Există un nou shortcut discret „Mergi direct la concluzie” pentru cine are puțin timp.
1. Who Am I?
2. Marketing Lab — The Secret Launch, Play/Quiz, Beauty Circle; toate experiențele sunt demonstrații fictive.
3. Proof of Work — DetailLane (video 46 sec) și proiectele secundare.
4. My First 30 Days — strategia scurtă + opțional `analiza-plan-detaliat.html`, cu surse și delimitarea ipotezelor.
5. Final Decision — Google Calendar booking, într-o filă nouă.

**Nume:** Andrei **Catana**, fără diacritice în numele de familie.

**Link de programare:** https://calendar.app.google/czSG1gu1BzWCy4E27

## Analiza opțională

La finalul My First 30 Days: „Vezi analiza și planul detaliat”. Butonul merge la `analiza-plan-detaliat.html`; în pagină există linkuri de revenire sus/jos. Întoarcerea utilizează istoricul dacă vine din CV și un fallback `index.html?from=analysis#plan` când pagina este accesată direct. Starea/poziția se păstrează cu sessionStorage unde browserul permite. **Testul end-to-end între documente trebuie repetat pe adresa reală, după publicare.**

## Verificările V1.0

- Chromium (copie de test HTML cu aceleași CSS/JS inline): 42/42 verificări PASS în rularea completă, inclusiv jocuri, capitole, modal, video și 8 lățimi de viewport.
- După acea rulare, am îmbunătățit și navigarea cu săgeți în opțiunile quizului; am verificat această modificare separat în Chromium.
- Audit static/HTTP: 25/25 verificări PASS, inclusiv decodarea întregului video, prezența resurselor, metadate, sintaxa JavaScript, no-JS fallback și reduced motion.
- **Limitare:** politicile Chromium din acest mediu blochează navigarea la file:// și localhost/URL-uri externe. Pentru testele de interacțiune s-a folosit o copie cu aceleași CSS și JS injectate inline; cererile HTTP au fost testate separat prin Python. Nu există o dovadă de test end-to-end a navigării reale între fișiere în browser sau a rezervării efective în Google Calendar.

Surse și rapoarte: `QA_REPORT.md`, `CHANGELOG.md`, `qa/`.

## Important înainte de trimitere

- Confirmă pe **adresa publică** deschiderea paginii detaliate și funcția „Înapoi la plan” în Chrome și Safari/mobile.
- Confirmă într-o fereastră privată că pagina Google Calendar permite rezervarea în intervalele dorite; doar existența redirectului nu garantează disponibilitatea.
- Verifică dacă toate numele, explicațiile și mesajele ți se potrivesc.
- Datele despre piață din materialul opțional sunt atribuite separat României (Euromonitor, 2025) și pieței globale (McKinsey, prognoză 2030).

Nu publica automat fără acordul proprietarului repository-ului.
