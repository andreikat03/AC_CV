# QA REPORT — THE APPLICATION.exe V1.0 FINAL

**Data:** 25 octombrie 2026  
**Bază:** V0.5.6 Final Decision ZIP  
**Scop:** audit real + remedieri punctuale, fără redesign sau noi capitole

## Executive Summary

Site-ul static V1.0 păstrează povestea în 6 momente (Hook + 5 capitole), experiențele demonstrative și video-ul DetailLane. Auditul a identificat o problemă de izolare a focusului în dialogul de ieșire și o problemă de focus în quiz, corectate. S-a îmbunătățit accesul rapid la invitația finală pentru recruiterii grăbiți. Nu s-au identificat resurse locale lipsă sau erori JavaScript în rulările complete ale harnessului.

## Probleme găsite și tratament

| Severitate | Problemă observată | Acțiune |
|---|---|---|
| Major — accesibilitate | Dialogul de închidere permitea focus în fundal; o primă corecție seta `inert` pe părintele dialogului însuși | Corectat: numai frații dialogului și elementele din afara containerului său primesc `inert`; Tab rămâne în dialog, Escape restaurează focusul. Retestat PASS |
| Mediu — accesibilitate | Quizul înlocuia nodurile radio după selectare, pierzând focusul; săgețile nu erau tratate | Focus restaurat pe opțiunea selectată, navigare Arrow/Home/End; verificat separat în Chromium |
| Mediu — UX | Pentru un recruiter grăbit, accesul la invitația finală din primul ecran nu era explicit | Adăugat un link discret „Mergi direct la concluzie”; testat PASS pe desktop și în responsive |
| Mic — claritate | `title` al paginii conținea versiunea veche, documentația era pentru V0.5.5 | Actualizat titlul, meta description și fișierele documentației |
| Mic — design | Final Decision avea un CTA secundar neaprobat, care dilua butonul principal | Păstrat un singur CTA „Hai să vorbim” și mesajul final agreat |
| Mediu — no-JS | În lipsa JavaScript, capitolele după Hook erau ascunse | Adăugat fallback `<noscript>` pentru conținutul textual; jocurile rămân JS-only |

## Rezultate efective

### Browser / Chromium cu CSS & JS originale inlined

Rularea completă `qa/browser_audit.py` pe V1.0 a produs **42 PASS / 0 FAIL** pentru: 
- 16 teste de responsive (main + pagină suplimentară la **320, 375, 390, 430, 768, 1024, 1440, 1920 px**), fără overflow orizontal;
- structura capitolelor, intro, shortcut, dialog, focus, navigarea dots;
- puzzle cu cod greșit și IDEE corect, 4 indicii;
- quiz în 5 întrebări, rezultat și reset;
- Beauty Circle cu 4 scenarii și reset;
- Arcade: nouă ținte atinse, cupon demonstrativ și reluare; testul a scurtat expirarea printr-un ceas virtual în harness, nu a așteptat 25s reali;
- video (46 secunde, 1920×1080), navigarea la Proof/Plan/Final, CTA exact, touch Hook și surse analiză.

**Detaliu de execuție:** După această rulare completă s-a adăugat navigarea cu săgeți în quiz. Acea ajustare a fost retestată separat în Chromium: ArrowDown selectează următorul radio, focusul rămâne pe opțiunea activă, iar „Următoarea” se activează. O repetare integrală a suitei după acest ultim patch nu s-a finalizat înaintea limitării de rulare; nu este prezentată ca PASS suplimentar.

Fișierul `qa/browser_results.json` conține cele 42 rezultate din rularea completă; `qa/browser_stdout.txt` poate conține jurnalul ultimei tentative întrerupte, deci fișierul JSON este sursa numerică a testelor încheiate.

### Static, HTTP și media

`qa/static_audit.py`: **25 PASS / 0 FAIL**, inclusiv:
- ID-uri unice, imagini cu alt, butoane cu nume accesibile, legături relative existente;
- exact cinci capitole după Hook, fără Creative Assets;
- numele `Catana` fără diacritice și linkul Google Calendar exact;
- sintaxă JS validă pentru toate cele șase fișiere JS;
- FFprobe: H.264, 1920×1080, durata 46,000 secunde; FFmpeg: decodare integrală fără erori;
- **24 cereri HTTP 200** de pe un server static Python local (fișierele celor două pagini și resursele lor), efectuate prin requests;
- fallback no-JS vizibil și suport redus de animații.

### Surse verificate public

- Euromonitor, raport mai 2026: **RON 11,9 mld. în 2025**, vânzări retail românești pentru *beauty & personal care*, **+9% în valoare** față de 2024. https://www.euromonitor.com/beauty-and-personal-care-in-romania/report
- McKinsey, raport iunie 2026: **~5% creștere anuală estimată până în 2030**, piața **globală** de beauty, nu România. https://www.mckinsey.com/industries/consumer-packaged-goods/our-insights/state-of-beauty
- CBRE, iulie 2026: Food și Health & Beauty au înregistrat cea mai puternică creștere e-commerce în România în perioada 2021–2025. https://www.cbre.ro/insights/reports/romania-s-e-commerce-market
- Farmec, Cupio, Melkior și Ivatherm: paginile publice corespunzătoare au fost accesibile și oferă exemple de mecanisme, nu dovezi de performanță financiară sau concurență directă.

## Riscuri și limitări

| Status | Ce nu a putut fi confirmat |
|---|---|
| LIMITED | Chromium automat a blocat navigarea propriu-zisă la URL-urile localhost și file://; testele browser au folosit aceleași CSS/JS inline într-un document de test. Nu s-a executat un test end-to-end al deschiderii/întoarcerii între cele două pagini pe un domeniu public. |
| LIMITED | Redirectul public al URL-ului Google Calendar este observabil; nu s-a confirmat că pagina finală afișează intervalele tale sau permite efectiv o rezervare. Nu a fost creată vreo rezervare. |
| NOT TESTED | Compatibilitatea pe iPhone/Android fizic, Safari real și publicarea pe GitHub Pages. |
| NOT TESTED | Audit WCAG automatizat complet cu axe-core/screen reader real. S-au făcut doar verificări accesibilitate specifice, focus, semantică și reduced motion. |
| LIMITED | Rata reală de abandon a recruiterilor sau reacția Ioanei — scenariile sunt evaluări euristice, nu interviuri sau date observate. |

## Checklist înainte de lansare

- [ ] Încarcă toate fișierele din rădăcina ZIP-ului în GitHub Pages, nu folderul părinte.
- [ ] Deschide site-ul public în desktop Chrome și în Safari pe iPhone.
- [ ] Verifică vizual primul ecran, Hook-ul, meniul cu puncte, Marketing Lab și finalul.
- [ ] Deschide analiza detaliată; folosește „Înapoi la plan” și Back din browser; verifică restaurarea poziției.
- [ ] Redă videoclipul DetailLane pe telefon, cu controale active.
- [ ] Deschide Google Calendar dintr-o fereastră privată și confirmă că există intervale disponibile și că numele afișat este corect.
- [ ] Verifică ultima dată numele Andrei **Catana**, copy-ul și disponibilitatea publică a surselor.

**Verdict:** candidat bun pentru publicare după checklistul pe domeniul real; nu s-a afirmat compatibilitate „100%” ori testare pe dispozitive inexistente.
