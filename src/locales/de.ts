const de = {
  CowField: 'CowField',

  // ---------------------------------------------------------------------------------------------
  // German, added 2026-09-21. The terminology was agreed before any of this was written — see
  // `claude/adding-a-language.md`, which carries the reasoning for each choice.
  //
  //   Star Battle    -> Sternenschlacht, with "Star Battle" kept alongside it
  //   Two Not Touch  -> Doppelstern
  //   pen            -> Koppel          bull -> Stier (never "Bulle": "Bullen" is slang for police)
  //   cow            -> Kuh             dot  -> Punkt
  //   difficulties   -> Sehr leicht / Leicht / Mittel / Schwer / Extrem
  //
  // **Two conventions this file follows, both copied from the English:**
  //
  // 1. **Search-facing copy uses the genre's vocabulary; the game uses the game's.** English says
  //    "star" and "region" in titles and meta descriptions, and "bull" and "pen" everywhere inside
  //    the app. German does the same with *Stern* / *Gebiet* against *Stier* / *Koppel*. It is not
  //    an inconsistency: the first set is what people type into a search box, the second is what
  //    the board is made of.
  // 2. **"du", not "Sie".** The site speaks in the first person and says "I built CowField because
  //    I wanted a puzzle I could think through at my own pace". "Sie" would put a counter between
  //    the author and the reader that the English does not have.
  //
  // Titles stay under 60 characters and descriptions under 160 — `npm run check:seo` enforces both,
  // which matters here because German runs longer than English for the same sentence.
  // ---------------------------------------------------------------------------------------------
  'Play Star Battle online, free': 'Star Battle online spielen, kostenlos',
  'Play Star Battle online, free - CowField': 'Star Battle online spielen, kostenlos - CowField',
  'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.':
    'Star Battle kostenlos online spielen, ohne Konto. 1.000 Rätsel von 6x6 bis 15x15, das Logikrätsel Sternenschlacht. Eine Uhr nur, wenn du sie willst.',
  'Star Battle, played with cows. The grid is split into coloured pens, and every row, every column and every pen needs the same number of bulls. No two bulls may touch, not even at a corner. If you have played Two Not Touch, you already know it.':
    'Star Battle, gespielt mit Kühen. Das Gitter ist in farbige Koppeln geteilt, und jede Reihe, jede Spalte und jede Koppel braucht gleich viele Stiere. Zwei Stiere dürfen sich nie berühren, nicht einmal an einer Ecke. Wer Sternenschlacht oder Doppelstern kennt, kennt das hier schon.',
  'Play now': 'Jetzt spielen',
  'Starting...': 'Startet ...',
  'Sign in to save your progress': 'Anmelden und Fortschritt sichern',
  "You don't need an account. Pick any level and start.":
    'Du brauchst kein Konto. Wähl ein Level und leg los.',
  'The server is waking up. First visit of the day takes a few seconds.':
    'Der Server wacht gerade auf. Der erste Besuch am Tag dauert ein paar Sekunden.',
  "Couldn't start a game. Check your connection and try again.":
    'Das Spiel konnte nicht gestartet werden. Prüf deine Verbindung und versuch es noch einmal.',
  'How to play': 'So wird gespielt',
  'Every row, column and pen gets the same number of bulls. One on the small boards, three on the biggest.':
    'Jede Reihe, jede Spalte und jede Koppel bekommt gleich viele Stiere. Einen auf den kleinen Brettern, drei auf dem größten.',
  'Two bulls can never touch, including diagonally at a corner.':
    'Zwei Stiere dürfen sich nie berühren, auch nicht diagonal an einer Ecke.',
  "Dots are your own notes. They don't count as bulls.":
    'Punkte sind deine eigenen Notizen. Sie zählen nicht als Stiere.',
  'Read the full rules': 'Alle Regeln lesen',
  'Solving techniques': 'Lösungstechniken',
  'No timer unless you want one': 'Eine Uhr nur, wenn du sie willst',
  'There is a clock if you want to race yourself, and a setting that hides it. Put a bull where it breaks a rule and it lights up straight away. It will not tell you what is correct, only what is illegal.':
    'Es gibt eine Uhr, wenn du gegen dich selbst antreten willst, und eine Einstellung, die sie versteckt. Setz einen Stier auf ein Feld, auf dem er eine Regel bricht, und er leuchtet sofort auf. Das Brett sagt dir nicht, was richtig ist, nur was verboten ist.',
  '1,000 levels, five board sizes': '1.000 Level, fünf Brettgrößen',
  'Two hundred levels in each of five difficulties. Light is 6x6 with one bull per row, column and pen. Easy is 8x8, medium is 10x10, hard is 10x10 with two. Extreme is 15x15 with three.':
    'Zweihundert Level in jeder der fünf Schwierigkeiten. Sehr leicht ist 6x6 mit einem Stier pro Reihe, Spalte und Koppel. Leicht ist 8x8, Mittel ist 10x10, Schwer ist 10x10 mit zwei. Extrem ist 15x15 mit drei.',
  'Every board is generated and then solved again to check it. Light through hard have exactly one answer. Any arrangement that follows the rules counts as a win.':
    'Jedes Brett wird erzeugt und danach noch einmal gelöst, um es zu prüfen. Sehr leicht bis Schwer haben genau eine Lösung. Jede Anordnung, die den Regeln folgt, zählt als gewonnen.',
  '1,000 levels': '1.000 Level',
  'Five difficulties': 'Fünf Schwierigkeiten',
  'Up to 15x15': 'Bis 15x15',
  'No sign-up': 'Ohne Anmeldung',
  'Try it yourself.': 'Probier es selbst.',

  // The not-found view, which replaced a silent redirect to `/`.
  'Page not found': 'Seite nicht gefunden',
  'That link does not lead anywhere.': 'Dieser Link führt nirgendwohin.',
  'Back to the start': 'Zurück zum Anfang',

  // Page descriptions — `<meta name="description">`. Each one is under 160 characters *in German*,
  // which is the constraint that bites here: the same sentence is reliably longer than its English
  // original, so several of these are shorter thoughts rather than translated ones.
  'The rules of Star Battle, also called Two Not Touch: the same number of bulls in every row, column and region, and no two touching. Plus what the dots do.':
    'Die Regeln von Star Battle, auch Sternenschlacht genannt: gleich viele Sterne in jeder Reihe, Spalte und Region, und keine zwei berühren sich.',
  'Six techniques for solving Star Battle and Two Not Touch puzzles, from fencing off stars to counting regions against rows, plus what to do when you get stuck.':
    'Sechs Techniken für Star Battle und Sternenschlacht: Sterne einzäunen, Gebiete gegen Reihen zählen, und was hilft, wenn nichts mehr geht.',
  'What changes between a 6x6 one-bull Star Battle board and a 15x15 three-bull one, how many levels each size has, and which difficulty to start with.':
    'Was sich zwischen einem 6x6-Brett mit einem Stern und einem 15x15-Brett mit dreien ändert, wie viele Level jede Größe hat und wo du anfängst.',
  'Loading...': 'Lädt ...',
  Hidden: 'Versteckt',
  'Back to home': 'Zurück zur Startseite',
  'Back to the rules': 'Zurück zu den Regeln',
  'Back to levels': 'Zurück zu den Leveln',
  'Back to all difficulties': 'Zurück zu allen Schwierigkeiten',
  Restart: 'Neu starten',
  'Next Level': 'Nächstes Level',
  Cancel: 'Abbrechen',
  Save: 'Speichern',
  Delete: 'Löschen',
  Role: 'Rolle',
  Player: 'Spieler',
  Admin: 'Admin',
  Volume: 'Lautstärke',
  Language: 'Sprache',
  Undo: 'Rückgängig',
  Home: 'Start',
  'Level {{levelNumber}}': 'Level {{levelNumber}}',
  Light: 'Sehr leicht',
  Easy: 'Leicht',
  Medium: 'Mittel',
  Hard: 'Schwer',
  Extreme: 'Extrem',
  'Home menu': 'Startmenü',
  'Site links': 'Seitenlinks',
  'Share CowField': 'CowField teilen',
  'Send someone the game, or let them scan it.':
    'Schick jemandem das Spiel oder lass es scannen.',
  'Link to CowField': 'Link zu CowField',
  'Copy link': 'Link kopieren',
  'Copied': 'Kopiert',
  "Couldn't copy the link. Select it and copy manually.":
    'Der Link ließ sich nicht kopieren. Markier ihn und kopier ihn von Hand.',
  'QR code linking to CowField': 'QR-Code zu CowField',
  'Point a phone camera at this to open the game.':
    'Halt eine Handykamera darauf, um das Spiel zu öffnen.',
  'Copy image': 'Bild kopieren',
  'Image copied': 'Bild kopiert',
  'Paste it anywhere that takes a picture.': 'Füg es überall ein, wo ein Bild hinpasst.',
  "Couldn't copy the image.": 'Das Bild ließ sich nicht kopieren.',
  'Close': 'Schließen',
  'Puzzle board': 'Rätselbrett',
  // Cell names. Every one of these describes something conveyed only visually — the pen by its
  // colour, the mark by an `aria-hidden` icon, the rule break by an animation.
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}':
    'Reihe {{row}}, Spalte {{column}}, Koppel {{pen}}. {{state}}',
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}. Breaks a rule.':
    'Reihe {{row}}, Spalte {{column}}, Koppel {{pen}}. {{state}}. Bricht eine Regel.',
  'Row {{row}}, column {{column}}': 'Reihe {{row}}, Spalte {{column}}',
  'Pen {{pen}}': 'Koppel {{pen}}',
  'No pen': 'Keine Koppel',
  'This board is cramped on a screen this size.':
    'Auf einem Bildschirm dieser Größe wird es auf dem Brett eng.',
  'Turning your phone sideways gives it more room.':
    'Quer gehalten hat das Handy mehr Platz dafür.',
  'Light levels are a better fit for narrow screens.':
    'Auf schmalen Bildschirmen passen die Level in Sehr leicht besser.',
  Dismiss: 'Ausblenden',
  Play: 'Spielen',
  About: 'Regeln',
  Statistics: 'Statistik',
  Settings: 'Einstellungen',
  // -------------------------------------------------------------------------------------------
  // `/levels` and `/levels/:difficulty`. These are the pages asked to rank, so the headings and
  // descriptions use *Stern* and *Region* — the words a German speaker types — while the body copy
  // below them uses *Stier* and *Koppel*, which is what the board is actually made of.
  // -------------------------------------------------------------------------------------------
  '1,000 free Star Battle puzzles': '1.000 kostenlose Star-Battle-Rätsel',
  'Choose a difficulty to play.': 'Wähl eine Schwierigkeit zum Spielen.',
  'Pick a size to see its 200 levels. They run from 6x6 with one bull per row up to 15x15 with three.':
    'Wähl eine Größe und sieh ihre 200 Level. Sie reichen von 6x6 mit einem Stier pro Reihe bis 15x15 mit drei.',
  'Browse all 1,000 levels': 'Alle 1.000 Level ansehen',
  'Every Star Battle puzzle on CowField, 200 in each of five sizes. Pick 6x6, 8x8, 10x10 with one or two stars, or 15x15 with three, and start without an account.':
    'Alle Star-Battle-Rätsel auf CowField, 200 in jeder von fünf Größen. 6x6, 8x8, 10x10 mit einem oder zwei Sternen oder 15x15 mit drei. Ohne Konto spielbar.',
  'What changes between sizes': 'Was sich zwischen den Größen ändert',
  '6x6 Star Battle puzzles, one star per row': '6x6 Star Battle: ein Stern pro Reihe',
  'Two hundred 6x6 Star Battle puzzles, free, with one star in every row, column and region. The smallest boards here, and where the dots start to make sense.':
    'Zweihundert 6x6-Star-Battle-Rätsel, kostenlos, mit einem Stern in jeder Reihe, Spalte und Region. Die kleinsten Bretter, und wo die Punkte Sinn ergeben.',
  'Light is the smallest size here. Every board is 6 by 6, with one bull in every row, every column and every pen.':
    'Sehr leicht ist die kleinste Größe hier. Jedes Brett ist 6 mal 6, mit einem Stier in jeder Reihe, jeder Spalte und jeder Koppel.',
  'Thirty-six cells is small enough to hold the whole grid in your head. Start here if you have not used the dots before.':
    'Sechsunddreißig Felder sind wenig genug, um das ganze Gitter im Kopf zu behalten. Fang hier an, wenn du die Punkte noch nie benutzt hast.',
  '8x8 Star Battle puzzles, one star per row': '8x8 Star Battle: ein Stern pro Reihe',
  'An 8x8 grid, one star in every row, column and region, and 200 free puzzles. Twenty-eight more cells than a 6x6 board, and the obvious rows run out sooner.':
    'Ein 8x8-Gitter, ein Stern in jeder Reihe, Spalte und Region, 200 kostenlose Rätsel. 28 Felder mehr als 6x6, und die klaren Reihen sind schneller weg.',
  'Easy keeps one bull in every row, column and pen, and moves the board to 8 by 8. Same rules as the 6x6 boards, with twenty-eight more cells to be wrong in.':
    'Leicht behält einen Stier in jeder Reihe, Spalte und Koppel und geht auf 8 mal 8. Dieselben Regeln wie auf den 6x6-Brettern, mit achtundzwanzig Feldern mehr, auf denen man danebenliegen kann.',
  'Counting rows stops being enough on its own at this size, and the shape of the pens starts to matter.':
    'Reihen zu zählen reicht bei dieser Größe allein nicht mehr, und die Form der Koppeln fängt an zu zählen.',
  '10x10 Star Battle puzzles, one star per row': '10x10 Star Battle: ein Stern pro Reihe',
  'The size most Star Battle puzzles come in. 200 free 10x10 boards with one star in every row, column and region, and the usual place to start.':
    'Die Größe, in der die meisten Star-Battle-Rätsel kommen. 200 kostenlose 10x10-Bretter mit einem Stern in jeder Reihe, Spalte und Region.',
  'Medium is 10 by 10 with one bull in every row, column and pen. Most Star Battle puzzles come in this size, so it should feel familiar if you have played elsewhere.':
    'Mittel ist 10 mal 10 mit einem Stier in jeder Reihe, Spalte und Koppel. Die meisten Star-Battle-Rätsel kommen in dieser Größe, es sollte dir also bekannt vorkommen, wenn du woanders gespielt hast.',
  'A hundred cells is enough that guessing stops paying and you have to eliminate properly.':
    'Bei hundert Feldern lohnt sich Raten nicht mehr und du musst sauber ausschließen.',
  '10x10 Star Battle puzzles, two stars per row': '10x10 Star Battle: zwei Sterne pro Reihe',
  'Two stars in every row, column and region of a 10x10 grid. This is what most people mean by Two Not Touch, and there are 200 of them here, free.':
    'Zwei Sterne in jeder Reihe, Spalte und Region eines 10x10-Gitters. Das ist der Doppelstern, den die meisten meinen, und 200 davon gibt es hier kostenlos.',
  'Hard stays at 10 by 10 and puts two bulls in every row, column and pen. This is the version most people mean by Two Not Touch.':
    'Schwer bleibt bei 10 mal 10 und setzt zwei Stiere in jede Reihe, Spalte und Koppel. Das ist die Variante, die als Doppelstern bekannt ist.',
  'Finding one bull in a row no longer retires the row, because the second is still out there. The rule that no two bulls may touch ends up doing most of the work.':
    'Einen Stier in einer Reihe zu finden erledigt die Reihe nicht mehr, denn der zweite fehlt noch. Die Regel, dass sich zwei Stiere nie berühren dürfen, macht am Ende die meiste Arbeit.',
  '15x15 Star Battle puzzles, three stars per row': '15x15 Star Battle: drei Sterne pro Reihe',
  'Three stars in every row, column and region of a 15x15 grid. 225 cells, 45 stars and 200 puzzles, the hardest Star Battle boards on CowField.':
    'Drei Sterne in jeder Reihe, Spalte und Region eines 15x15-Gitters. 225 Felder, 45 Sterne und 200 Rätsel, die schwersten Star-Battle-Bretter hier.',
  'Extreme is 15 by 15 with three bulls in every row, column and pen. That is 225 cells and 45 bulls, and one of these will take a while.':
    'Extrem ist 15 mal 15 mit drei Stieren in jeder Reihe, Spalte und Koppel. Das sind 225 Felder und 45 Stiere, und an so einem sitzt man eine Weile.',
  'Unlike the smaller sizes, these boards are not checked to have exactly one answer. A few have several. Any legal arrangement wins, and you will never be told you found the wrong one.':
    'Anders als die kleineren Größen werden diese Bretter nicht darauf geprüft, ob sie genau eine Lösung haben. Ein paar haben mehrere. Jede erlaubte Anordnung gewinnt, und dir wird nie gesagt, du hättest die falsche gefunden.',
  'Available levels': 'Verfügbare Level',
  'Unknown difficulty.': 'Unbekannte Schwierigkeit.',
  'Choose one of the available difficulty groups to browse levels.':
    'Wähl eine der verfügbaren Schwierigkeiten, um die Level durchzusehen.',
  Levels: 'Level',
  // "Level" is the same in the singular and the plural in German, so the heading needs the
  // difficulty to carry the difference. A dash reads better here than "Schwer-Level" would.
  '{{difficulty}} Levels': 'Level – {{difficulty}}',
  Previous: 'Zurück',
  Next: 'Weiter',
  'Page {{page}} of {{totalPages}}': 'Seite {{page}} von {{totalPages}}',
  '{{completed}} of {{total}} solved': '{{completed}} von {{total}} gelöst',
  // The space before the percent sign is correct German typography, not a typo.
  '{{percent}}% done': '{{percent}} % geschafft',
  // Both forms are identical because "Level" does not inflect. They are still both spelled out:
  // without `_other` i18next would fall back to the bare key, and a reader could not tell a
  // deliberate choice from a forgotten one.
  '{{count}} levels_one': '{{count}} Level',
  '{{count}} levels_other': '{{count}} Level',
  'Open level {{levelNumber}}': 'Level {{levelNumber}} öffnen',
  'Level {{levelNumber}} solved': 'Level {{levelNumber}} gelöst',
  'Edit level {{levelNumber}}': 'Level {{levelNumber}} bearbeiten',
  // -------------------------------------------------------------------------------------------
  // `/about` — the rules page, and the best keyword surface on the site. The first sentence names
  // all three words a German speaker might search: Star Battle, Sternenschlacht, Doppelstern.
  // -------------------------------------------------------------------------------------------
  'How to play Star Battle': 'Star Battle Regeln: so geht Sternenschlacht',
  'CowField is a Star Battle puzzle, the game also known as Two Not Touch. The stars are bulls here and the regions are pens. Nothing else about the rules changes.':
    'CowField ist ein Star-Battle-Rätsel, auf Deutsch auch Sternenschlacht oder Doppelstern genannt. Die Sterne sind hier Stiere und die Regionen sind Koppeln. Sonst ändert sich an den Regeln nichts.',
  'How cell marks work': 'Wie die Markierungen funktionieren',
  'Each cell changes like this:': 'Jedes Feld wechselt so:',
  empty: 'leer',
  'dot note': 'Notizpunkt',
  bull: 'Stier',
  'Every board has a number attached to it, depending on its size. One, two or three. Each row has to end up holding exactly that many bulls, and so does each column and each coloured pen. Get all three to agree at once and the level is done.':
    'Zu jedem Brett gehört eine Zahl, je nach Größe. Eins, zwei oder drei. Jede Reihe muss am Ende genau so viele Stiere halten, und jede Spalte und jede farbige Koppel ebenso. Bring alle drei gleichzeitig zur Deckung, und das Level ist fertig.',
  'The second rule. No two bulls may sit in neighbouring cells, side by side, one above the other, or touching at a single corner. Every bull needs an empty ring around it.':
    'Die zweite Regel. Zwei Stiere dürfen nie auf Nachbarfeldern stehen, nebeneinander, übereinander oder an einer einzelnen Ecke. Jeder Stier braucht einen leeren Ring um sich.',
  'Light, easy and medium: one bull per row, column and pen.':
    'Sehr leicht, Leicht und Mittel: ein Stier pro Reihe, Spalte und Koppel.',
  'Hard: two. Extreme: three, on a 15x15 board.': 'Schwer: zwei. Extrem: drei, auf einem 15x15-Brett.',
  'Dots are notes. They never count as bulls.': 'Punkte sind Notizen. Sie zählen nie als Stiere.',
  'You win on bull placement alone.': 'Gewonnen wird allein über die Stiere.',
  'Dots are how most people actually solve these. Mark the cells you have ruled out and the board narrows itself. You can also place a bull you are unsure about. If it breaks a rule it lights up and you can take it straight back. Leftover dots do not matter at the end.':
    'Über die Punkte lösen die meisten diese Rätsel wirklich. Markier die Felder, die du ausgeschlossen hast, und das Brett engt sich von selbst ein. Du kannst auch einen Stier setzen, bei dem du dir unsicher bist. Bricht er eine Regel, leuchtet er auf und du nimmst ihn gleich wieder zurück. Übrig gebliebene Punkte spielen am Ende keine Rolle.',
  'A few things live in Settings. Take your time hides the timers. Auto-place dots rings each bull for you, which saves a lot of clicking on the big boards. There is a dark theme, and sound and music have their own volumes. Guests get take your time switched on and locked.':
    'Ein paar Dinge stehen in den Einstellungen. „Lass dir Zeit“ versteckt die Uhren. „Punkte automatisch setzen“ legt den Ring um jeden Stier für dich, was auf den großen Brettern viele Klicks spart. Es gibt ein dunkles Design, und Ton und Musik haben eigene Lautstärken. Bei Gästen ist „Lass dir Zeit“ an und festgestellt.',
  'I built CowField because I wanted a puzzle I could think through at my own pace. Nothing to keep up with, nothing waiting for me if I put it down for a month.':
    'Ich habe CowField gebaut, weil ich ein Rätsel wollte, das ich in meinem eigenen Tempo durchdenken kann. Nichts, womit man Schritt halten muss, nichts, das auf mich wartet, wenn ich es einen Monat liegen lasse.',

  // The FAQ. Question-shaped headings with short answers, the shape Google lifts into an answer
  // box, plus `FAQPage` structured data on the same content.
  'Common questions': 'Häufige Fragen',
  'What is Star Battle?': 'Was ist Star Battle?',
  'A logic puzzle on a grid split into coloured regions. You place a fixed number of stars in every row, every column and every region, and no two stars may touch, including diagonally. In CowField the stars are bulls and the regions are pens.':
    'Ein Logikrätsel auf einem Gitter, das in farbige Regionen geteilt ist. Du setzt in jede Reihe, jede Spalte und jede Region gleich viele Sterne, und keine zwei Sterne dürfen sich berühren, auch nicht diagonal. Auf Deutsch heißt es Sternenschlacht. In CowField sind die Sterne Stiere und die Regionen Koppeln.',
  'Is Two Not Touch the same puzzle?': 'Ist Doppelstern dasselbe Rätsel?',
  'Yes. Two Not Touch is the name usually given to the two-star version on a 10x10 board, which is what hard is here. Same rules, different name.':
    'Ja. Doppelstern ist der übliche Name für die Variante mit zwei Sternen auf einem 10x10-Brett, und das ist hier Schwer. Gleiche Regeln, anderer Name.',
  'Do I need an account?': 'Brauche ich ein Konto?',
  'No. The guest button drops you straight onto a board and keeps your progress in your browser. An account only matters if you want that progress on a second device.':
    'Nein. Der Gast-Knopf setzt dich direkt auf ein Brett und behält deinen Fortschritt in deinem Browser. Ein Konto zählt erst, wenn du diesen Fortschritt auf einem zweiten Gerät willst.',
  'Is it free?': 'Ist es kostenlos?',
  'Yes, all 1,000 levels. No ads, and nothing to buy.':
    'Ja, alle 1.000 Level. Keine Werbung, und nichts zu kaufen.',
  'Does every puzzle have one solution?': 'Hat jedes Rätsel genau eine Lösung?',
  'Light, easy, medium and hard do, so every one of them can be reasoned out without guessing. Extreme boards can have more than one valid answer. Whichever you find, if it follows the rules it wins.':
    'Sehr leicht, Leicht, Mittel und Schwer schon, jedes davon lässt sich also ohne Raten herleiten. Bretter in Extrem können mehr als eine gültige Lösung haben. Welche du auch findest: Folgt sie den Regeln, gewinnt sie.',
  'Can I play on a phone?': 'Kann ich am Handy spielen?',
  'Yes. The small boards fit a phone screen comfortably. For 10x10 and 15x15 turn the phone sideways, or use a tablet, since 225 cells need the room.':
    'Ja. Die kleinen Bretter passen bequem auf einen Handybildschirm. Für 10x10 und 15x15 halt das Handy quer oder nimm ein Tablet, denn 225 Felder brauchen Platz.',
  // -------------------------------------------------------------------------------------------
  // `/how-to-solve` — the page with the clearest search intent on the site. "star battle lösen"
  // and "sternenschlacht lösen" are both things people type, so the heading takes the first and
  // the body carries the second.
  // -------------------------------------------------------------------------------------------
  'How to solve Star Battle puzzles': 'Star Battle lösen: sechs Techniken',
  'None of this is specific to CowField. It is how Star Battle works, so it carries over to any board you meet, under any of the names the puzzle goes by. Roughly in the order the moves tend to come up.':
    'Nichts davon gilt nur für CowField. So funktioniert Sternenschlacht, es überträgt sich also auf jedes Brett, das dir begegnet, unter welchem Namen das Rätsel auch läuft. Ungefähr in der Reihenfolge, in der die Züge meistens vorkommen.',
  'Fence off every bull you place': 'Zäun jeden gesetzten Stier ein',
  'The moment a bull goes down, the eight cells around it are dead. Dot them. Those dots are what the next three techniques read. Turn on auto-place dots in Settings and the game does it for you.':
    'In dem Moment, in dem ein Stier steht, sind die acht Felder um ihn herum tot. Setz Punkte darauf. Genau diese Punkte lesen die nächsten drei Techniken. Schalt in den Einstellungen „Punkte automatisch setzen“ ein, dann macht das Spiel es für dich.',
  'A pen trapped in one row finishes that row': 'Eine Koppel in einer Reihe erledigt die Reihe',
  'If a whole pen sits inside a single row, that pen has to spend its bulls in that row, and the row has no quota left for anyone else. Every other cell in the row is dead. The same works for columns, and it works with the pen only mostly contained too: what matters is where its empty cells are, not its full shape.':
    'Sitzt eine ganze Koppel in einer einzigen Reihe, muss sie ihre Stiere in dieser Reihe ausgeben, und die Reihe hat für niemanden sonst noch Platz. Jedes andere Feld der Reihe ist tot. Für Spalten gilt dasselbe, und es gilt auch, wenn die Koppel nur größtenteils in der Reihe liegt: Es zählt, wo ihre freien Felder sind, nicht ihre volle Form.',
  'Count pens against rows': 'Zähl Koppeln gegen Reihen',
  'The strongest move in the game, and the one people miss. If three pens fit entirely inside three rows, those three rows are spoken for: every cell in them belonging to a fourth pen is dead. It reads backwards as well. If three rows only ever touch three pens, those pens are used up and cannot appear anywhere else on the board.':
    'Der stärkste Zug im Spiel, und der, den die meisten übersehen. Passen drei Koppeln vollständig in drei Reihen, sind diese drei Reihen vergeben: Jedes Feld darin, das zu einer vierten Koppel gehört, ist tot. Es gilt auch rückwärts. Berühren drei Reihen nur drei Koppeln, sind diese Koppeln aufgebraucht und können nirgendwo sonst auf dem Brett auftauchen.',
  'Watch where a pen has room left': 'Achte darauf, wo eine Koppel noch Platz hat',
  'A pen spread across five rows is not free if its remaining cells only sit in two of them. Needing two bulls in two rows claims both. On the two and three bull boards this is most of the work, because a pen with three bulls and barely enough room is almost solved already.':
    'Eine Koppel über fünf Reihen ist nicht frei, wenn ihre übrigen Felder nur in zweien davon liegen. Zwei Stiere in zwei Reihen belegen beide. Auf den Brettern mit zwei und drei Stieren ist das die meiste Arbeit, denn eine Koppel mit drei Stieren und knapp genug Platz ist fast schon gelöst.',
  'Start where the choices are fewest': 'Fang dort an, wo es die wenigsten Möglichkeiten gibt',
  'Small pens, corners and edges. A three-cell pen on a one-bull board offers three options; a twenty-cell pen offers twenty. Corners have fewer neighbours to rule out, so a bull placed there costs the board less. Open in the cramped part and the loose part solves itself later.':
    'Kleine Koppeln, Ecken und Ränder. Eine Koppel aus drei Feldern bietet auf einem Brett mit einem Stier drei Möglichkeiten, eine aus zwanzig Feldern zwanzig. Ecken haben weniger Nachbarn auszuschließen, ein Stier dort kostet das Brett also weniger. Eröffne im engen Teil, der lose Teil löst sich später von selbst.',
  'When nothing moves, assume one and follow it': 'Wenn nichts geht, nimm einen an und folge ihm',
  'Take a pen with two options left, pick one, and push the consequences until something breaks. If it breaks, the cell you picked is dead and you have learned something real. Place actual bulls while you do this rather than working it out in your head: an illegal one lights up the instant it lands, so the board tells you where the chain failed.':
    'Nimm eine Koppel mit zwei verbliebenen Möglichkeiten, wähl eine und treib die Folgen weiter, bis etwas bricht. Bricht es, ist das gewählte Feld tot und du hast etwas Echtes gelernt. Setz dabei wirklich Stiere, statt es im Kopf durchzurechnen: Ein verbotener leuchtet in dem Moment auf, in dem er landet, und das Brett sagt dir damit, wo die Kette gerissen ist.',
  'Go and try one': 'Probier eins aus',

  // -------------------------------------------------------------------------------------------
  // `/difficulties` — the long tail: "star battle 10x10", "star battle 2 sterne", "15x15". Also
  // the honest place to say that extreme trades uniqueness for existing at all.
  // -------------------------------------------------------------------------------------------
  'Board sizes': 'Brettgrößen',
  'Star Battle board sizes and difficulty': 'Star Battle: Brettgrößen und Schwierigkeit',
  'Five sizes, 200 levels each. Level 1 of light and level 173 of extreme are both one click away.':
    'Fünf Größen, je 200 Level. Level 1 in Sehr leicht und Level 173 in Extrem sind beide einen Klick entfernt.',
  '200 levels': '200 Level',
  '6x6 board, one bull per row, column and pen.':
    '6x6-Brett, ein Stier pro Reihe, Spalte und Koppel.',
  '8x8 board, one bull per row, column and pen.':
    '8x8-Brett, ein Stier pro Reihe, Spalte und Koppel.',
  '10x10 board, one bull per row, column and pen.':
    '10x10-Brett, ein Stier pro Reihe, Spalte und Koppel.',
  '10x10 board, two bulls per row, column and pen.':
    '10x10-Brett, zwei Stiere pro Reihe, Spalte und Koppel.',
  '15x15 board, three bulls per row, column and pen.':
    '15x15-Brett, drei Stiere pro Reihe, Spalte und Koppel.',
  'Where to start. Small enough to hold the whole board in your head while you work out what the dots do.':
    'Der Anfang. Klein genug, um das ganze Brett im Kopf zu behalten, während du herausfindest, was die Punkte tun.',
  'The same puzzle with more room to be wrong in. Rows stop being obvious and you start leaning on the pens.':
    'Dasselbe Rätsel mit mehr Platz, danebenzuliegen. Reihen sind nicht mehr offensichtlich und du stützt dich auf die Koppeln.',
  'The size most Star Battle puzzles come in. If you have played this elsewhere, start here and it will feel familiar.':
    'Die Größe, in der die meisten Star-Battle-Rätsel kommen. Wenn du das woanders gespielt hast, fang hier an, es kommt dir bekannt vor.',
  'What most people mean by Two Not Touch. With two bulls per row, finding one bull no longer finishes the row.':
    'Was die meisten mit Doppelstern meinen. Mit zwei Stieren pro Reihe erledigt ein gefundener Stier die Reihe nicht mehr.',
  '225 cells, 15 pens, 45 bulls. Expect to sit with one of these. They are also the boards that can have more than one valid answer.':
    '225 Felder, 15 Koppeln, 45 Stiere. Rechne damit, an so einem zu sitzen. Es sind auch die Bretter, die mehr als eine gültige Lösung haben können.',
  'What changes when the star count goes up': 'Was sich ändert, wenn die Sternzahl steigt',
  "A 6x6 board and a 10x10 board ask for the same work, just more of it. One bull per row and two bulls per row ask different questions. With one, finding a row's bull retires the row. With two, it tells you almost nothing on its own, because the second is still out there and the no-touching rule is all that holds it. That is the step from medium to hard, and again from hard to extreme.":
    'Ein 6x6-Brett und ein 10x10-Brett verlangen dieselbe Arbeit, nur mehr davon. Ein Stier pro Reihe und zwei Stiere pro Reihe stellen verschiedene Fragen. Bei einem erledigt der gefundene Stier die Reihe. Bei zweien sagt er für sich genommen fast nichts, denn der zweite fehlt noch und nur die Berührungsregel hält ihn. Das ist der Schritt von Mittel zu Schwer, und noch einmal von Schwer zu Extrem.',

  // -------------------------------------------------------------------------------------------
  // `/about-project` — who built this. The only page whose job is a **name** rather than a query.
  // -------------------------------------------------------------------------------------------
  'About the project': 'Über das Projekt',
  'CowField is a side project by Volodymyr Mykhailiuk, a Star Battle puzzle built solo to try out new tools and to have one finished thing worth showing.':
    'CowField ist ein Nebenprojekt von Volodymyr Mykhailiuk, ein Star-Battle-Rätsel, allein gebaut, um neue Werkzeuge zu testen und etwas Fertiges vorzuzeigen.',
  'CowField is a personal project. I am Volodymyr Mykhailiuk, and I built it on my own, front to back.':
    'CowField ist ein persönliches Projekt. Ich bin Volodymyr Mykhailiuk und habe es allein gebaut, vom Frontend bis zum Backend.',
  'Why a puzzle game': 'Warum ein Rätselspiel',
  'A todo list would have been quicker. I play these puzzles, and the part I actually wanted to understand was how the boards get made. Whether a generator can be trusted to produce one with a single answer, and what checking that costs. Most of that question lives on the server, so building it was a way to get properly better at backend work. The front end got the rest of the attention, most of it spent calibrating things nobody is meant to notice.':
    'Eine To-do-Liste wäre schneller gegangen. Ich spiele diese Rätsel selbst, und verstehen wollte ich vor allem, wie die Bretter entstehen. Ob man einem Generator zutrauen kann, eines mit genau einer Lösung zu liefern, und was es kostet, das zu prüfen. Der größte Teil dieser Frage lebt auf dem Server, das Projekt war also ein Weg, im Backend richtig besser zu werden. Der Rest der Aufmerksamkeit ging ins Frontend, das meiste davon in das Kalibrieren von Dingen, die niemand bemerken soll.',
  'Something finished, not a demo': 'Etwas Fertiges, keine Demo',
  'I wanted one thing I could point at. A game a stranger can open and play without being told what it is, with everything a real product needs somewhere inside it, including the dull parts.':
    'Ich wollte eine Sache, auf die ich zeigen kann. Ein Spiel, das eine fremde Person öffnen und spielen kann, ohne dass man ihr erklärt, was es ist, und in dem irgendwo alles steckt, was ein echtes Produkt braucht, auch die langweiligen Teile.',
  'Built alone, on purpose': 'Absichtlich allein gebaut',
  'Working solo means every part is mine. The board rules, the generator and the solver, the API, the database schema, the layout, the copy, and both languages. There is nobody to hand the half I am worse at.':
    'Allein zu arbeiten heißt, dass jeder Teil meiner ist. Die Brettregeln, der Generator und der Löser, die API, das Datenbankschema, das Layout, die Texte und alle Sprachen. Es gibt niemanden, dem ich die Hälfte geben kann, in der ich schlechter bin.',
  'A place to try things': 'Ein Ort zum Ausprobieren',
  'Small libraries I would otherwise never have a reason to install get tried out here, and a few of them I ended up writing myself once I had seen what they cost. The QR code in the share dialog is about 450 lines of Reed-Solomon and bit placement, with no dependency behind it.':
    'Kleine Bibliotheken, für die ich sonst nie einen Grund hätte, probiere ich hier aus, und ein paar davon habe ich am Ende selbst geschrieben, als ich sah, was sie kosten. Der QR-Code im Teilen-Dialog sind ungefähr 450 Zeilen Reed-Solomon und Bitplatzierung, ohne eine Abhängigkeit dahinter.',
  'Learning the newer tooling': 'Die neueren Werkzeuge lernen',
  'The other thing I practise here is working well with the newer tools that sit alongside the editor. Getting something genuinely useful out of them is a skill of its own, and it only develops on a real project, where a bad decision has to be lived with for weeks.':
    'Das andere, was ich hier übe, ist der gute Umgang mit den neueren Werkzeugen, die neben dem Editor sitzen. Wirklich Brauchbares aus ihnen herauszuholen ist ein eigenes Können, und das entsteht nur an einem echten Projekt, wo man mit einer schlechten Entscheidung wochenlang leben muss.',
  'Getting in touch': 'Kontakt',
  'Or find me on Telegram as': 'Oder finde mich auf Telegram als',
  // Split around the address, which is not a translatable string and is rendered as a `mailto:`.
  'If any of this is worth a message, mine is':
    'Wenn davon etwas eine Nachricht wert ist: meine Adresse ist',
  '. Work, questions about how something here is built, or a bug you hit on level 143.':
    '. Arbeit, Fragen dazu, wie hier etwas gebaut ist, oder ein Fehler, den du auf Level 143 gefunden hast.',
  'What it is built with': 'Womit es gebaut ist',
  'React, TypeScript and Vite in the browser. Express, Prisma and Postgres behind it. The board rules, the generator and the solver sit in one shared folder that both sides import, so the browser and the server can never disagree about what a legal board is. The site runs on Vercel and the API on Render.':
    'React, TypeScript und Vite im Browser. Express, Prisma und Postgres dahinter. Die Brettregeln, der Generator und der Löser liegen in einem gemeinsamen Ordner, den beide Seiten importieren, damit Browser und Server sich nie darüber uneinig sein können, was ein erlaubtes Brett ist. Die Seite läuft auf Vercel, die API auf Render.',

  'Adjust your preferences here.': 'Stell hier deine Vorlieben ein.',
  'Sound effects': 'Soundeffekte',
  'Enable sound effects.': 'Soundeffekte einschalten.',
  Music: 'Musik',
  'Enable background music during play.': 'Hintergrundmusik beim Spielen einschalten.',
  'Dark mode': 'Dunkelmodus',
  'Switch to dark colours for playing in low light.':
    'Auf dunkle Farben umschalten, zum Spielen bei wenig Licht.',
  'Choose the language used across the game.': 'Wähl die Sprache für das ganze Spiel.',
  'Switch to dark mode': 'Zum Dunkelmodus wechseln',
  'Switch to light mode': 'Zum Hellmodus wechseln',
  'Take your time': 'Lass dir Zeit',
  'Hide the timers so nothing on screen is counting.':
    'Die Uhren verstecken, damit auf dem Bildschirm nichts mitzählt.',
  'Auto-place dots': 'Punkte automatisch setzen',
  'Ring each bull with dots the moment you place it.':
    'Jeden Stier in dem Moment mit Punkten umranden, in dem du ihn setzt.',
  'Player statistics': 'Spielerstatistik',
  'Most progress': 'Größter Fortschritt',
  'No data': 'Keine Daten',
  'Completed levels': 'Abgeschlossene Level',
  'Placed bulls': 'Gesetzte Stiere',
  'Total completion time': 'Gesamte Spielzeit',
  'Performance breakdown by difficulty:': 'Aufschlüsselung nach Schwierigkeit:',
  Difficulty: 'Schwierigkeit',
  'Fastest level': 'Schnellstes Level',
  'Average per level': 'Durchschnitt pro Level',
  'No completed level': 'Kein abgeschlossenes Level',
  // i18next picks the `_one` / `_other` variant from `count` and falls back to the bare key, which
  // is kept so the string still resolves if a variant is ever missing. German has the same two
  // categories as English.
  '{{count}} completed levels': '{{count}} abgeschlossene Level',
  '{{count}} completed levels_one': '{{count}} abgeschlossenes Level',
  '{{count}} completed levels_other': '{{count}} abgeschlossene Level',
  'The requested level route is invalid.': 'Die angeforderte Level-Adresse ist ungültig.',
  'This level does not exist yet.': 'Dieses Level gibt es noch nicht.',
  'Create level': 'Level anlegen',
  'Edit level': 'Level bearbeiten',
  'Remaining bulls': 'Verbleibende Stiere',
  Timer: 'Uhr',
  Back: 'Zurück',
  'Failed to load level data.': 'Die Leveldaten konnten nicht geladen werden.',
  'Admin role is required to create or edit levels.':
    'Zum Anlegen oder Bearbeiten von Leveln wird die Admin-Rolle gebraucht.',
  'Fix those problems and try again.': 'Behebe diese Probleme und versuch es noch einmal.',
  // The editor's validation issues. `shared/game/validation.ts` hands back a code and its numbers
  // instead of a sentence, and `translateValidationIssue` chooses the wording — which is what lets
  // a German admin read these at all. German has the same two plural categories as English.
  'Add a level title.': 'Gib dem Level einen Titel.',
  'Grid size must stay {{size}} x {{size}} for {{difficulty}}.':
    'Die Gittergröße muss für {{difficulty}} bei {{size}} x {{size}} bleiben.',
  'The pen grid is incomplete.': 'Das Koppelgitter ist unvollständig.',
  'The authored bull layout is incomplete.': 'Die eingetragene Stieranordnung ist unvollständig.',
  'Every cell must belong to a pen.': 'Jedes Feld muss zu einer Koppel gehören.',
  'A {{size}} x {{size}} level must use exactly {{size}} pens.':
    'Ein Level mit {{size}} x {{size}} muss genau {{size}} Koppeln verwenden.',
  'Pen {{penId}} is too small for {{count}} bull placements.':
    'Koppel {{penId}} ist zu klein für {{count}} Stiere.',
  'Pen {{penId}} is too small for {{count}} bull placements._one':
    'Koppel {{penId}} ist zu klein für {{count}} Stier.',
  'Pen {{penId}} is too small for {{count}} bull placements._other':
    'Koppel {{penId}} ist zu klein für {{count}} Stiere.',
  'Pen {{penId}} must be one connected region.':
    'Koppel {{penId}} muss eine zusammenhängende Fläche sein.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.':
    'Die eingetragene Stieranordnung muss für {{difficulty}} genau {{count}} Stiere setzen.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._one':
    'Die eingetragene Stieranordnung muss für {{difficulty}} genau {{count}} Stier setzen.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._other':
    'Die eingetragene Stieranordnung muss für {{difficulty}} genau {{count}} Stiere setzen.',
  'Each row must contain exactly {{count}} bulls.':
    'Jede Reihe muss genau {{count}} Stiere enthalten.',
  'Each row must contain exactly {{count}} bulls._one':
    'Jede Reihe muss genau {{count}} Stier enthalten.',
  'Each row must contain exactly {{count}} bulls._other':
    'Jede Reihe muss genau {{count}} Stiere enthalten.',
  'Each column must contain exactly {{count}} bulls.':
    'Jede Spalte muss genau {{count}} Stiere enthalten.',
  'Each column must contain exactly {{count}} bulls._one':
    'Jede Spalte muss genau {{count}} Stier enthalten.',
  'Each column must contain exactly {{count}} bulls._other':
    'Jede Spalte muss genau {{count}} Stiere enthalten.',
  'Pen {{penId}} must contain exactly {{count}} bulls.':
    'Koppel {{penId}} muss genau {{count}} Stiere enthalten.',
  'Pen {{penId}} must contain exactly {{count}} bulls._one':
    'Koppel {{penId}} muss genau {{count}} Stier enthalten.',
  'Pen {{penId}} must contain exactly {{count}} bulls._other':
    'Koppel {{penId}} muss genau {{count}} Stiere enthalten.',
  'Bulls may not touch, including diagonally.':
    'Stiere dürfen sich nicht berühren, auch nicht diagonal.',
  'This level has no valid solution.': 'Dieses Level hat keine gültige Lösung.',
  'Level saved': 'Level gespeichert',
  'Failed to save level.': 'Das Level konnte nicht gespeichert werden.',
  'Failed to delete level.': 'Das Level konnte nicht gelöscht werden.',
  'Deleting...': 'Wird gelöscht ...',
  'Delete level': 'Level löschen',
  'Discard unsaved changes?': 'Nicht gespeicherte Änderungen verwerfen?',
  'This level has unsaved changes. Leaving now discards them.':
    'Dieses Level hat nicht gespeicherte Änderungen. Wenn du jetzt gehst, gehen sie verloren.',
  'This level has unsaved changes. This action replaces the board and discards them.':
    'Dieses Level hat nicht gespeicherte Änderungen. Diese Aktion ersetzt das Brett und verwirft sie.',
  'Leave and discard': 'Gehen und verwerfen',
  Discard: 'Verwerfen',
  'Delete level?': 'Level löschen?',
  'Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.':
    'Level {{levelNumber}} in {{difficulty}} löschen? Das entfernt die Leveldatei aus dem Projekt.',
  'Board cleared': 'Brett geleert',
  'Validation passed': 'Prüfung bestanden',
  'Exactly one solution.': 'Genau eine Lösung.',
  'This level has more than one solution.': 'Dieses Level hat mehr als eine Lösung.',
  'Found {{count}} solutions. A good level has exactly one.':
    'Es wurden {{count}} Lösungen gefunden. Ein gutes Level hat genau eine.',
  'Found {{count}} solutions. A good level has exactly one._one':
    'Es wurde {{count}} Lösung gefunden. Ein gutes Level hat genau eine.',
  'Found {{count}} solutions. A good level has exactly one._other':
    'Es wurden {{count}} Lösungen gefunden. Ein gutes Level hat genau eine.',
  // "N+" reads as plural at every count, including one, so both variants are the plural wording —
  // the same choice `en.ts` makes. They are still spelled out: without them i18next resolves
  // `_one` to the bare key, and a reader cannot tell a deliberate choice from a forgotten one.
  'Found {{count}}+ solutions. A good level has exactly one.':
    'Es wurden {{count}}+ Lösungen gefunden. Ein gutes Level hat genau eine.',
  'Found {{count}}+ solutions. A good level has exactly one._one':
    'Es wurden {{count}}+ Lösungen gefunden. Ein gutes Level hat genau eine.',
  'Found {{count}}+ solutions. A good level has exactly one._other':
    'Es wurden {{count}}+ Lösungen gefunden. Ein gutes Level hat genau eine.',
  'Generate builds a level with exactly one solution.':
    'Generieren baut ein Level mit genau einer Lösung.',
  'Generation ran out of time. Try again.':
    'Dem Generator ist die Zeit ausgegangen. Versuch es noch einmal.',
  'The generator searches for a board with exactly one solution, which takes longer on medium and hard.':
    'Der Generator sucht ein Brett mit genau einer Lösung, und das dauert bei Mittel und Schwer länger.',
  'Nothing on the board was changed, so you can run Generate again.':
    'Auf dem Brett wurde nichts geändert, du kannst Generieren also noch einmal laufen lassen.',
  'Level generated': 'Level generiert',
  'Generating...': 'Wird generiert ...',
  'Create/Edit Level': 'Level anlegen/bearbeiten',
  Generate: 'Generieren',
  'Validate level': 'Level prüfen',
  'Validating...': 'Wird geprüft ...',
  'Save level': 'Level speichern',
  'Clear board': 'Brett leeren',
  'Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.':
    'Wähl eine Farbe und klick dann auf Felder, um sie dieser Fläche zuzuweisen. Jedes Feld muss zu einer Farbe gehören, bevor das Level gespeichert werden kann, und in jeder Farbe sollten Kühe stehen. Dieses Brett braucht genau {{gridSize}} zusammenhängende Farben und {{requiredCowCount}} Kühe.',
  'Color palette': 'Farbpalette',
  Erase: 'Radieren',
  Cow: 'Kuh',
  'Color {{colorId}}': 'Farbe {{colorId}}',
  'Level color editor': 'Farbeditor für Level',
  Profile: 'Profil',
  Guest: 'Gast',
  User: 'Nutzer',
  'Preview role': 'Rolle zur Vorschau',
  'Log out': 'Abmelden',
  Login: 'Anmeldung',
  'Sign in with your email and password, create an account, or continue as a guest.':
    'Melde dich mit E-Mail und Passwort an, erstell ein Konto oder mach als Gast weiter.',
  Email: 'E-Mail',
  Password: 'Passwort',
  'Log in': 'Anmelden',
  'Continue with Google': 'Mit Google fortfahren',
  'Completing Google login...': 'Google-Anmeldung wird abgeschlossen ...',
  'Verifying your email...': 'Deine E-Mail-Adresse wird bestätigt ...',
  'Play as guest': 'Als Gast spielen',
  // -------------------------------------------------------------------------------------------
  // P18 — the level gate, sharing, and the guest-to-account handover.
  // -------------------------------------------------------------------------------------------
  'Ready when you are': 'Bereit, wenn du es bist',
  'Play right away without an account, or make one so your times follow you between devices.':
    'Spiel sofort ohne Konto, oder erstell eines, damit deine Zeiten dir zwischen Geräten folgen.',
  Share: 'Teilen',
  'Play this Star Battle level on CowField': 'Spiel dieses Star-Battle-Level auf CowField',
  'Link copied.': 'Link kopiert.',
  "Couldn't share this level.": 'Dieses Level ließ sich nicht teilen.',
  'Sign in': 'Anmelden',
  'Your guest progress stays here': 'Dein Gast-Fortschritt bleibt hier',
  // `{{count}}` does not appear in the singular on purpose: "das 1 Level" is not a sentence anyone
  // writes. i18next picks the form, and each form is allowed its own wording.
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._one':
    'Beim Anmelden bleibt das Level zurück, das du als Gast auf diesem Gerät geschafft hast. Erstell stattdessen ein Konto, dann kommt es mit.',
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._other':
    'Beim Anmelden bleiben die {{count}} Level zurück, die du als Gast auf diesem Gerät geschafft hast. Erstell stattdessen ein Konto, dann kommen sie mit.',
  'Sign in anyway': 'Trotzdem anmelden',
  'Statistics is available only for logged users.':
    'Die Statistik gibt es nur für angemeldete Nutzer.',
  'Create account': 'Konto erstellen',
  'Forgot password?': 'Passwort vergessen?',
  'Passwords do not match.': 'Die Passwörter stimmen nicht überein.',
  'Request failed.': 'Die Anfrage ist fehlgeschlagen.',
  'Create a user account with your email and password.':
    'Erstell ein Konto mit deiner E-Mail-Adresse und einem Passwort.',
  'Confirm password': 'Passwort bestätigen',
  'Back to login': 'Zurück zur Anmeldung',
  'Reset password': 'Passwort zurücksetzen',
  'Enter your email and we will send you a password reset link.':
    'Gib deine E-Mail-Adresse ein, und wir schicken dir einen Link zum Zurücksetzen.',
  'If the account exists, a reset link has been sent to that email address.':
    'Falls das Konto existiert, wurde ein Link zum Zurücksetzen an diese Adresse geschickt.',
  'Send reset link': 'Link zum Zurücksetzen senden',
  'I already have a reset link': 'Ich habe schon einen Link',
  'Your password has been updated.': 'Dein Passwort wurde geändert.',
  'Open the reset link from your email and choose a new password.':
    'Öffne den Link aus deiner E-Mail und wähl ein neues Passwort.',
  'Reset token': 'Token zum Zurücksetzen',
  'New password': 'Neues Passwort',
  'Save new password': 'Neues Passwort speichern',
  'Account created. Check your email to verify it before logging in.':
    'Konto erstellt. Bestätige es über die E-Mail, bevor du dich anmeldest.',
  'Verification email sent again.': 'Die Bestätigungsmail wurde erneut geschickt.',
  'Resend verification email': 'Bestätigungsmail erneut senden',
  'Show password': 'Passwort anzeigen',
  'Hide password': 'Passwort verbergen',
  'You are playing as a Guest.': 'Du spielst als Gast.',
  'This browser is blocking saved data, so these choices will reset when you close the tab.':
    'Dieser Browser blockiert gespeicherte Daten, diese Einstellungen gehen also verloren, wenn du den Tab schließt.',
  'Incorrect email or password.': 'E-Mail-Adresse oder Passwort stimmt nicht.',
  'Too many requests. Try again in a moment.':
    'Zu viele Anfragen. Versuch es gleich noch einmal.',
  'Too many attempts. Wait a few minutes and try again.':
    'Zu viele Versuche. Warte ein paar Minuten und versuch es noch einmal.',
  'Guests cannot access this resource.': 'Gäste haben darauf keinen Zugriff.',
  // Neon Auth's own raw error text. The browser signs in against Neon directly, so these strings
  // reach `translateAuthMessage` verbatim — without a key here they render as English for everyone.
  'Invalid email or password': 'E-Mail-Adresse oder Passwort stimmt nicht.',
  'User already exists': 'Mit dieser E-Mail-Adresse gibt es schon ein Konto.',
  'Email not verified': 'E-Mail-Adresse nicht bestätigt.',
  // The reset-password endpoint's codes, same idea. Anything not listed here — "User not found" on
  // a forgotten-password request, for one, which would otherwise tell a stranger which addresses
  // have accounts — falls through to the caller's generic message instead of being shown.
  'Invalid token': 'Dieser Link gilt nicht mehr. Fordere einen neuen an.',
  'Password too short': 'Dieses Passwort ist zu kurz. Nimm mindestens 8 Zeichen.',
  'Password too long': 'Dieses Passwort ist zu lang.',
  'Failed to restore session after login.':
    'Die Sitzung konnte nach der Anmeldung nicht wiederhergestellt werden.',
  'Google login failed.': 'Die Google-Anmeldung ist fehlgeschlagen.',
  // Shown instead of `?error=` when the address bar carries something we do not ship a string for.
  // Everything above is the allowlist `translateKnownAuthMessage` checks against.
  'Sign-in failed. Try again.': 'Anmeldung fehlgeschlagen. Versuch es noch einmal.',
  // The other generic fallbacks, one per form, so a failure at least says which thing failed.
  "Couldn't create your account. Try again.":
    'Dein Konto konnte nicht erstellt werden. Versuch es noch einmal.',
  "Couldn't send the reset link. Try again.":
    'Der Link zum Zurücksetzen konnte nicht geschickt werden. Versuch es noch einmal.',
  "Couldn't update your password. Try again.":
    'Dein Passwort konnte nicht geändert werden. Versuch es noch einmal.',
  'What is CowField?': 'Was ist CowField?',
  'Back to your levels': 'Zurück zu deinen Leveln',
  'Email verification failed.': 'Die Bestätigung der E-Mail-Adresse ist fehlgeschlagen.',
  'Your email is verified. You can log in now.':
    'Deine E-Mail-Adresse ist bestätigt. Du kannst dich jetzt anmelden.',
  'Neon Auth is not configured.': 'Neon Auth ist nicht konfiguriert.',
  'Invalid request payload.': 'Ungültige Anfragedaten.',
  'Level complete': 'Level geschafft',
  'Best time: {{time}}': 'Bestzeit: {{time}}',
  'New best time.': 'Neue Bestzeit.',
  "Couldn't save your progress. Check your connection and try again.":
    'Dein Fortschritt konnte nicht gespeichert werden. Prüf deine Verbindung und versuch es noch einmal.',
  'Try again': 'Noch einmal versuchen',
  'You completed the last available level.': 'Du hast das letzte verfügbare Level geschafft.',
  'Your progress has been saved.': 'Dein Fortschritt wurde gespeichert.',
  'Saving your progress...': 'Dein Fortschritt wird gespeichert ...',

  // Error boundaries and failed page loads.
  'Something went wrong. Reloading the page usually fixes it.':
    'Etwas ist schiefgelaufen. Die Seite neu zu laden hilft meistens.',
  'Reload the page': 'Seite neu laden',
  "Couldn't load your progress. Check your connection and try again.":
    'Dein Fortschritt konnte nicht geladen werden. Prüf deine Verbindung und versuch es noch einmal.',
  "Couldn't load these levels. Check your connection and try again.":
    'Diese Level konnten nicht geladen werden. Prüf deine Verbindung und versuch es noch einmal.',
  "Couldn't load your statistics. Check your connection and try again.":
    'Deine Statistik konnte nicht geladen werden. Prüf deine Verbindung und versuch es noch einmal.',
  "Couldn't load this level. Check your connection and try again.":
    'Dieses Level konnte nicht geladen werden. Prüf deine Verbindung und versuch es noch einmal.',
} as const

export default de
