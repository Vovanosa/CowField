const it = {
  CowField: 'CowField',

  // ---------------------------------------------------------------------------------------------
  // Italian, added 2026-09-22. Terminology agreed before any of this was written — see
  // `claude/adding-a-language.md`, which carries the reasoning for each choice.
  //
  //   Star Battle    -> Star Battle, with "battaglia stellare" named alongside
  //   Two Not Touch  -> Due stelle
  //   pen            -> recinto          bull -> toro
  //   cow            -> mucca            dot  -> punto
  //   difficulties   -> Molto facile / Facile / Medio / Difficile / Estremo
  //
  // **Four conventions this file follows:**
  //
  // 1. **"tu", not "Lei."** The user's call, and the same answer as German for a different reason:
  //    Italian consumer software is overwhelmingly informal, and "Lei" would put a counter between
  //    the first-person author voice and the reader.
  // 2. **The English name leads**, as in French. There is no Italian equivalent of `janko.at` —
  //    no Italian Wikipedia article either — and the Italian App Store sells this as "Star
  //    Battle: Puzzle Logici". *Battaglia stellare* is real but descriptive, so it is named in the
  //    prose and never in a title.
  // 3. **`mucca`, never `vacca`.** *Vacca* is the correct farming term and a coarse insult aimed
  //    at women in ordinary Italian. The same class of decision as German's *Stier* over *Bulle*.
  // 4. **Italian typography**: « caporali » with **no inner spaces**, unlike French, and a period
  //    as the thousands separator (1.000). Elisions take the typographic apostrophe — `l’ora`,
  //    `un po’` — which is most of what a proofreading pass over this file is looking for.
  //
  // Search-facing copy uses the genre's vocabulary (*stella*, *regione*) and the app uses the
  // game's (*toro*, *recinto*) — the same split `en.ts`, `de.ts` and `fr.ts` make. Titles stay
  // under 60 characters including the ` - CowField` suffix, descriptions under 160.
  // ---------------------------------------------------------------------------------------------
  'Play Star Battle online, free': 'Gioca a Star Battle online, gratis',
  'Play Star Battle online, free - CowField': 'Gioca a Star Battle online, gratis - CowField',
  'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.':
    'Gioca a Star Battle online, gratis e senza account. 1.000 rompicapi da 6x6 a 15x15, il gioco di logica noto anche come Two Not Touch. Timer solo se lo vuoi.',
  'Star Battle, played with cows. The grid is split into coloured pens, and every row, every column and every pen needs the same number of bulls. No two bulls may touch, not even at a corner. If you have played Two Not Touch, you already know it.':
    'Star Battle, la battaglia stellare giocata con le mucche. La griglia è divisa in recinti colorati, e ogni riga, ogni colonna e ogni recinto vuole lo stesso numero di tori. Due tori non possono mai toccarsi, nemmeno con un angolo. Se hai già giocato a Two Not Touch, sai come funziona.',
  'Play now': 'Gioca ora',
  'Starting...': 'Avvio...',
  'Sign in to save your progress': 'Accedi per salvare i tuoi progressi',
  "You don't need an account. Pick any level and start.":
    'Non serve un account. Scegli un livello e inizia.',
  'The server is waking up. First visit of the day takes a few seconds.':
    'Il server si sta svegliando. La prima visita della giornata richiede qualche secondo.',
  "Couldn't start a game. Check your connection and try again.":
    'Non è stato possibile avviare una partita. Controlla la connessione e riprova.',
  'How to play': 'Come si gioca',
  'Every row, column and pen gets the same number of bulls. One on the small boards, three on the biggest.':
    'Ogni riga, colonna e recinto riceve lo stesso numero di tori. Uno sulle griglie piccole, tre sulla più grande.',
  'Two bulls can never touch, including diagonally at a corner.':
    'Due tori non possono mai toccarsi, nemmeno in diagonale con un angolo.',
  "Dots are your own notes. They don't count as bulls.":
    'I punti sono appunti tuoi. Non contano come tori.',
  'Read the full rules': 'Leggi le regole complete',
  'Solving techniques': 'Tecniche di soluzione',
  'No timer unless you want one': 'Nessun timer, a meno che tu non lo voglia',
  'There is a clock if you want to race yourself, and a setting that hides it. Put a bull where it breaks a rule and it lights up straight away. It will not tell you what is correct, only what is illegal.':
    'C’è un cronometro se vuoi correre contro te stesso, e un’impostazione che lo nasconde. Metti un toro dove infrange una regola e si illumina subito. Non ti dice cosa è giusto, solo cosa è vietato.',
  '1,000 levels, five board sizes': '1.000 livelli, cinque formati di griglia',
  'Two hundred levels in each of five difficulties. Light is 6x6 with one bull per row, column and pen. Easy is 8x8, medium is 10x10, hard is 10x10 with two. Extreme is 15x15 with three.':
    'Duecento livelli per ognuna delle cinque difficoltà. Molto facile è 6x6 con un toro per riga, colonna e recinto. Facile è 8x8, medio è 10x10, difficile è 10x10 con due. Estremo è 15x15 con tre.',
  'Every board is generated and then solved again to check it. Light through hard have exactly one answer. Any arrangement that follows the rules counts as a win.':
    'Ogni griglia viene generata e poi risolta di nuovo per verificarla. Da molto facile a difficile hanno una sola soluzione. Qualsiasi disposizione che rispetti le regole vale come vittoria.',
  '1,000 levels': '1.000 livelli',
  'Five difficulties': 'Cinque difficoltà',
  'Up to 15x15': 'Fino a 15x15',
  'No sign-up': 'Senza registrazione',
  'Try it yourself.': 'Provaci tu.',

  'Page not found': 'Pagina non trovata',
  'That link does not lead anywhere.': 'Questo link non porta da nessuna parte.',
  'Back to the start': 'Torna all’inizio',

  'The rules of Star Battle, also called Two Not Touch: the same number of bulls in every row, column and region, and no two touching. Plus what the dots do.':
    'Le regole di Star Battle, detto anche Two Not Touch: lo stesso numero di tori in ogni riga, colonna e regione, e mai due a contatto. E cosa fanno i punti.',
  'Six techniques for solving Star Battle and Two Not Touch puzzles, from fencing off stars to counting regions against rows, plus what to do when you get stuck.':
    'Sei tecniche per risolvere Star Battle e Two Not Touch, dal recintare le stelle al contare le regioni contro le righe, e cosa fare quando ti blocchi.',
  'What changes between a 6x6 one-bull Star Battle board and a 15x15 three-bull one, how many levels each size has, and which difficulty to start with.':
    'Cosa cambia tra una griglia Star Battle 6x6 con un toro e una 15x15 con tre, quanti livelli ha ogni formato e da quale difficoltà conviene partire.',
  'Loading...': 'Caricamento...',
  Hidden: 'Nascosto',
  'Back to home': 'Torna alla home',
  'Back to the rules': 'Torna alle regole',
  'Back to levels': 'Torna ai livelli',
  'Back to all difficulties': 'Torna a tutte le difficoltà',
  Restart: 'Ricomincia',
  'Next Level': 'Livello successivo',
  Cancel: 'Annulla',
  Save: 'Salva',
  Delete: 'Elimina',
  Role: 'Ruolo',
  Player: 'Giocatore',
  Admin: 'Admin',
  Volume: 'Volume',
  Language: 'Lingua',
  // `Annulla` alone is Italian for both Cancel and Undo. The board button says which one it is.
  Undo: 'Annulla mossa',
  Home: 'Home',
  'Level {{levelNumber}}': 'Livello {{levelNumber}}',
  Light: 'Molto facile',
  Easy: 'Facile',
  Medium: 'Medio',
  Hard: 'Difficile',
  Extreme: 'Estremo',
  'Home menu': 'Menu principale',
  'Site links': 'Link del sito',
  'Share CowField': 'Condividi CowField',
  'Send someone the game, or let them scan it.':
    'Manda il gioco a qualcuno, o faglielo scansionare.',
  'Link to CowField': 'Link a CowField',
  'Copy link': 'Copia link',
  'Copied': 'Copiato',
  "Couldn't copy the link. Select it and copy manually.":
    'Non è stato possibile copiare il link. Selezionalo e copialo a mano.',
  'QR code linking to CowField': 'Codice QR che porta a CowField',
  'Point a phone camera at this to open the game.':
    'Inquadralo con la fotocamera del telefono per aprire il gioco.',
  'Copy image': 'Copia immagine',
  'Image copied': 'Immagine copiata',
  'Paste it anywhere that takes a picture.': 'Incollala ovunque accetti un’immagine.',
  "Couldn't copy the image.": 'Non è stato possibile copiare l’immagine.',
  'Close': 'Chiudi',
  'Puzzle board': 'Griglia del rompicapo',
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}':
    'Riga {{row}}, colonna {{column}}, recinto {{pen}}. {{state}}',
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}. Breaks a rule.':
    'Riga {{row}}, colonna {{column}}, recinto {{pen}}. {{state}}. Infrange una regola.',
  'Row {{row}}, column {{column}}': 'Riga {{row}}, colonna {{column}}',
  'Pen {{pen}}': 'Recinto {{pen}}',
  'No pen': 'Nessun recinto',
  'This board is cramped on a screen this size.':
    'Questa griglia sta stretta su uno schermo di queste dimensioni.',
  'Turning your phone sideways gives it more room.':
    'Girando il telefono di lato le dai più spazio.',
  'Light levels are a better fit for narrow screens.':
    'I livelli molto facili stanno meglio sugli schermi stretti.',
  Dismiss: 'Nascondi',
  Play: 'Gioca',
  About: 'Regole',
  Statistics: 'Statistiche',
  Settings: 'Impostazioni',
  '1,000 free Star Battle puzzles': '1.000 rompicapi Star Battle gratis',
  'Choose a difficulty to play.': 'Scegli una difficoltà e gioca.',
  'Pick a size to see its 200 levels. They run from 6x6 with one bull per row up to 15x15 with three.':
    'Scegli un formato per vedere i suoi 200 livelli. Vanno dal 6x6 con un toro per riga al 15x15 con tre.',
  'Browse all 1,000 levels': 'Sfoglia tutti i 1.000 livelli',
  'Every Star Battle puzzle on CowField, 200 in each of five sizes. Pick 6x6, 8x8, 10x10 with one or two stars, or 15x15 with three, and start without an account.':
    'Tutti i rompicapi Star Battle di CowField, 200 per ogni formato. Scegli 6x6, 8x8, 10x10 con una o due stelle, o 15x15 con tre, e inizia senza account.',
  'What changes between sizes': 'Cosa cambia tra un formato e l’altro',
  '6x6 Star Battle puzzles, one star per row': 'Rompicapi Star Battle 6x6, una stella per riga',
  'Two hundred 6x6 Star Battle puzzles, free, with one star in every row, column and region. The smallest boards here, and where the dots start to make sense.':
    'Duecento rompicapi Star Battle 6x6, gratis, con una stella in ogni riga, colonna e regione. Le griglie più piccole qui, dove i punti iniziano ad avere senso.',
  'Light is the smallest size here. Every board is 6 by 6, with one bull in every row, every column and every pen.':
    'Molto facile è il formato più piccolo. Ogni griglia è 6 per 6, con un toro in ogni riga, ogni colonna e ogni recinto.',
  'Thirty-six cells is small enough to hold the whole grid in your head. Start here if you have not used the dots before.':
    'Trentasei caselle sono abbastanza poche da tenere tutta la griglia in testa. Comincia da qui se non hai mai usato i punti.',
  '8x8 Star Battle puzzles, one star per row': 'Rompicapi Star Battle 8x8, una stella per riga',
  'An 8x8 grid, one star in every row, column and region, and 200 free puzzles. Twenty-eight more cells than a 6x6 board, and the obvious rows run out sooner.':
    'Una griglia 8x8, una stella in ogni riga, colonna e regione, e 200 rompicapi gratis. Ventotto caselle in più del 6x6, e le righe ovvie finiscono prima.',
  'Easy keeps one bull in every row, column and pen, and moves the board to 8 by 8. Same rules as the 6x6 boards, with twenty-eight more cells to be wrong in.':
    'Facile tiene un toro in ogni riga, colonna e recinto, e porta la griglia a 8 per 8. Stesse regole del 6x6, con ventotto caselle in più in cui sbagliare.',
  'Counting rows stops being enough on its own at this size, and the shape of the pens starts to matter.':
    'A questo formato contare le righe non basta più da solo, e la forma dei recinti comincia a contare.',
  '10x10 Star Battle puzzles, one star per row': 'Rompicapi Star Battle 10x10, una stella',
  'The size most Star Battle puzzles come in. 200 free 10x10 boards with one star in every row, column and region, and the usual place to start.':
    'Il formato più comune per Star Battle. 200 griglie 10x10 gratis con una stella in ogni riga, colonna e regione, e il punto di partenza abituale.',
  'Medium is 10 by 10 with one bull in every row, column and pen. Most Star Battle puzzles come in this size, so it should feel familiar if you have played elsewhere.':
    'Medio è 10 per 10 con un toro in ogni riga, colonna e recinto. La maggior parte dei rompicapi Star Battle esce in questo formato, quindi ti sembrerà familiare se hai già giocato altrove.',
  'A hundred cells is enough that guessing stops paying and you have to eliminate properly.':
    'Cento caselle bastano perché tirare a indovinare non convenga più e tocchi eliminare sul serio.',
  '10x10 Star Battle puzzles, two stars per row': 'Rompicapi Star Battle 10x10, due stelle',
  'Two stars in every row, column and region of a 10x10 grid. This is what most people mean by Two Not Touch, and there are 200 of them here, free.':
    'Due stelle in ogni riga, colonna e regione di una griglia 10x10. È questo che di solito si intende per Two Not Touch, e qui ce ne sono 200, gratis.',
  'Hard stays at 10 by 10 and puts two bulls in every row, column and pen. This is the version most people mean by Two Not Touch.':
    'Difficile resta a 10 per 10 e mette due tori in ogni riga, colonna e recinto. È questa la versione che di solito si chiama Two Not Touch.',
  'Finding one bull in a row no longer retires the row, because the second is still out there. The rule that no two bulls may touch ends up doing most of the work.':
    'Trovare un toro in una riga non chiude più la riga, perché il secondo è ancora là fuori. La regola che vieta a due tori di toccarsi finisce per fare quasi tutto il lavoro.',
  '15x15 Star Battle puzzles, three stars per row': 'Rompicapi Star Battle 15x15, tre stelle',
  'Three stars in every row, column and region of a 15x15 grid. 225 cells, 45 stars and 200 puzzles, the hardest Star Battle boards on CowField.':
    'Tre stelle in ogni riga, colonna e regione di una griglia 15x15. 225 caselle, 45 stelle e 200 rompicapi, le griglie Star Battle più dure di CowField.',
  'Extreme is 15 by 15 with three bulls in every row, column and pen. That is 225 cells and 45 bulls, and one of these will take a while.':
    'Estremo è 15 per 15 con tre tori in ogni riga, colonna e recinto. Sono 225 caselle e 45 tori, e una di queste ti porterà via un po’ di tempo.',
  'Unlike the smaller sizes, these boards are not checked to have exactly one answer. A few have several. Any legal arrangement wins, and you will never be told you found the wrong one.':
    'A differenza dei formati più piccoli, queste griglie non vengono verificate per avere una sola soluzione. Alcune ne hanno più di una. Qualsiasi disposizione valida vince, e non ti verrà mai detto che hai trovato quella sbagliata.',
  'Available levels': 'Livelli disponibili',
  'Unknown difficulty.': 'Difficoltà sconosciuta.',
  'Choose one of the available difficulty groups to browse levels.':
    'Scegli uno dei gruppi di difficoltà disponibili per sfogliare i livelli.',
  Levels: 'Livelli',
  '{{difficulty}} Levels': 'Livelli {{difficulty}}',
  Previous: 'Precedente',
  Next: 'Successivo',
  'Page {{page}} of {{totalPages}}': 'Pagina {{page}} di {{totalPages}}',
  '{{completed}} of {{total}} solved': '{{completed}} di {{total}} risolti',
  '{{percent}}% done': '{{percent}}% completato',
  '{{count}} levels_one': '{{count}} livello',
  '{{count}} levels_other': '{{count}} livelli',
  'Open level {{levelNumber}}': 'Apri il livello {{levelNumber}}',
  'Level {{levelNumber}} solved': 'Livello {{levelNumber}} risolto',
  'Edit level {{levelNumber}}': 'Modifica il livello {{levelNumber}}',
  'How to play Star Battle': 'Come si gioca a Star Battle',
  'CowField is a Star Battle puzzle, the game also known as Two Not Touch. The stars are bulls here and the regions are pens. Nothing else about the rules changes.':
    'CowField è un rompicapo Star Battle, in italiano la battaglia stellare, detto anche Due stelle o Two Not Touch. Qui le stelle sono tori e le regioni sono recinti. Per il resto le regole non cambiano.',
  'How cell marks work': 'Come funzionano i segni nelle caselle',
  'Each cell changes like this:': 'Ogni casella cambia così:',
  empty: 'vuota',
  'dot note': 'punto di nota',
  bull: 'toro',
  'Every board has a number attached to it, depending on its size. One, two or three. Each row has to end up holding exactly that many bulls, and so does each column and each coloured pen. Get all three to agree at once and the level is done.':
    'Ogni griglia ha un numero associato, a seconda della sua dimensione. Uno, due o tre. Ogni riga deve contenere alla fine esattamente quel numero di tori, e lo stesso vale per ogni colonna e per ogni recinto colorato. Falli quadrare tutti e tre insieme e il livello è finito.',
  'The second rule. No two bulls may sit in neighbouring cells, side by side, one above the other, or touching at a single corner. Every bull needs an empty ring around it.':
    'La seconda regola. Due tori non possono stare in caselle vicine, né affiancati, né uno sopra l’altro, né a contatto per un solo angolo. Ogni toro ha bisogno di un anello vuoto intorno a sé.',
  'Light, easy and medium: one bull per row, column and pen.':
    'Molto facile, facile e medio: un toro per riga, colonna e recinto.',
  'Hard: two. Extreme: three, on a 15x15 board.':
    'Difficile: due. Estremo: tre, su una griglia 15x15.',
  'Dots are notes. They never count as bulls.':
    'I punti sono appunti. Non contano mai come tori.',
  'You win on bull placement alone.': 'Si vince solo con la posizione dei tori.',
  'Dots are how most people actually solve these. Mark the cells you have ruled out and the board narrows itself. You can also place a bull you are unsure about. If it breaks a rule it lights up and you can take it straight back. Leftover dots do not matter at the end.':
    'I punti sono il modo in cui quasi tutti risolvono davvero queste griglie. Segna le caselle che hai escluso e la griglia si restringe da sola. Puoi anche mettere un toro di cui non sei sicuro. Se infrange una regola si illumina e puoi toglierlo subito. I punti rimasti alla fine non contano.',
  'A few things live in Settings. Take your time hides the timers. Auto-place dots rings each bull for you, which saves a lot of clicking on the big boards. There is a dark theme, and sound and music have their own volumes. Guests get take your time switched on and locked.':
    'Qualche opzione sta nelle Impostazioni. «Prenditi il tuo tempo» nasconde i timer. «Punti automatici» circonda ogni toro al posto tuo, il che risparmia parecchi clic sulle griglie grandi. C’è un tema scuro, e suoni e musica hanno volumi separati. Per gli ospiti «Prenditi il tuo tempo» è attivo e bloccato.',
  'I built CowField because I wanted a puzzle I could think through at my own pace. Nothing to keep up with, nothing waiting for me if I put it down for a month.':
    'Ho fatto CowField perché volevo un rompicapo su cui ragionare con i miei tempi. Niente a cui stare dietro, niente che mi aspetti se lo lascio lì per un mese.',

  'Common questions': 'Domande frequenti',
  'What is Star Battle?': 'Che cos’è Star Battle?',
  'A logic puzzle on a grid split into coloured regions. You place a fixed number of stars in every row, every column and every region, and no two stars may touch, including diagonally. In CowField the stars are bulls and the regions are pens.':
    'Un rompicapo di logica su una griglia divisa in regioni colorate. Metti un numero fisso di stelle in ogni riga, ogni colonna e ogni regione, e due stelle non possono toccarsi, nemmeno in diagonale. In CowField le stelle sono tori e le regioni sono recinti.',
  'Is Two Not Touch the same puzzle?': 'Two Not Touch è lo stesso rompicapo?',
  'Yes. Two Not Touch is the name usually given to the two-star version on a 10x10 board, which is what hard is here. Same rules, different name.':
    'Sì. Two Not Touch è il nome che di solito si dà alla versione con due stelle su una griglia 10x10, cioè la difficoltà difficile. Stesse regole, nome diverso.',
  'Do I need an account?': 'Serve un account?',
  'No. The guest button drops you straight onto a board and keeps your progress in your browser. An account only matters if you want that progress on a second device.':
    'No. Il pulsante ospite ti porta dritto su una griglia e tiene i tuoi progressi nel browser. L’account serve solo se vuoi ritrovarli su un secondo dispositivo.',
  'Is it free?': 'È gratis?',
  'Yes, all 1,000 levels. No ads, and nothing to buy.':
    'Sì, tutti e 1.000 i livelli. Niente pubblicità, e niente da comprare.',
  'Does every puzzle have one solution?': 'Ogni rompicapo ha una sola soluzione?',
  'Light, easy, medium and hard do, so every one of them can be reasoned out without guessing. Extreme boards can have more than one valid answer. Whichever you find, if it follows the rules it wins.':
    'Molto facile, facile, medio e difficile sì, quindi si risolvono tutti ragionando, senza tirare a indovinare. Le griglie estreme possono avere più di una soluzione valida. Qualunque tu trovi, se rispetta le regole vince.',
  'Can I play on a phone?': 'Posso giocare dal telefono?',
  'Yes. The small boards fit a phone screen comfortably. For 10x10 and 15x15 turn the phone sideways, or use a tablet, since 225 cells need the room.':
    'Sì. Le griglie piccole stanno comode sullo schermo del telefono. Per il 10x10 e il 15x15 gira il telefono di lato, o usa un tablet, perché 225 caselle hanno bisogno di spazio.',
  'How to solve Star Battle puzzles': 'Come risolvere i rompicapi Star Battle',
  'None of this is specific to CowField. It is how Star Battle works, so it carries over to any board you meet, under any of the names the puzzle goes by. Roughly in the order the moves tend to come up.':
    'Niente di tutto questo è specifico di CowField. È così che funziona Star Battle, quindi vale per qualsiasi griglia ti capiti, sotto qualunque nome il rompicapo si presenti. Più o meno nell’ordine in cui le mosse vengono fuori.',
  'Fence off every bull you place': 'Recinta ogni toro che metti',
  'The moment a bull goes down, the eight cells around it are dead. Dot them. Those dots are what the next three techniques read. Turn on auto-place dots in Settings and the game does it for you.':
    'Nel momento in cui un toro scende, le otto caselle intorno sono morte. Mettici i punti. Sono quei punti che le tre tecniche successive leggono. Attiva i punti automatici nelle Impostazioni e ci pensa il gioco.',
  'A pen trapped in one row finishes that row': 'Un recinto chiuso in una riga chiude quella riga',
  'If a whole pen sits inside a single row, that pen has to spend its bulls in that row, and the row has no quota left for anyone else. Every other cell in the row is dead. The same works for columns, and it works with the pen only mostly contained too: what matters is where its empty cells are, not its full shape.':
    'Se un intero recinto sta dentro una sola riga, quel recinto deve spendere i suoi tori in quella riga, e alla riga non resta quota per nessun altro. Ogni altra casella della riga è morta. Lo stesso vale per le colonne, e funziona anche con un recinto contenuto solo in gran parte: quello che conta è dove sono le sue caselle vuote, non la sua forma piena.',
  'Count pens against rows': 'Conta i recinti contro le righe',
  'The strongest move in the game, and the one people miss. If three pens fit entirely inside three rows, those three rows are spoken for: every cell in them belonging to a fourth pen is dead. It reads backwards as well. If three rows only ever touch three pens, those pens are used up and cannot appear anywhere else on the board.':
    'La mossa più forte del gioco, e quella che sfugge. Se tre recinti stanno interamente dentro tre righe, quelle tre righe sono impegnate: ogni casella al loro interno che appartiene a un quarto recinto è morta. Si legge anche al contrario. Se tre righe toccano soltanto tre recinti, quei recinti sono esauriti e non possono comparire da nessun’altra parte della griglia.',
  'Watch where a pen has room left': 'Guarda dove a un recinto resta spazio',
  'A pen spread across five rows is not free if its remaining cells only sit in two of them. Needing two bulls in two rows claims both. On the two and three bull boards this is most of the work, because a pen with three bulls and barely enough room is almost solved already.':
    'Un recinto sparso su cinque righe non è libero se le caselle che gli restano stanno solo in due di esse. Se gli servono due tori e ha solo due righe, se le prende entrambe. Sulle griglie da due e da tre tori è qui che sta quasi tutto il lavoro, perché un recinto con tre tori e appena lo spazio necessario è già quasi risolto.',
  'Start where the choices are fewest': 'Comincia dove le scelte sono meno',
  'Small pens, corners and edges. A three-cell pen on a one-bull board offers three options; a twenty-cell pen offers twenty. Corners have fewer neighbours to rule out, so a bull placed there costs the board less. Open in the cramped part and the loose part solves itself later.':
    'Recinti piccoli, angoli e bordi. Un recinto da tre caselle su una griglia da un toro offre tre possibilità; uno da venti caselle ne offre venti. Gli angoli hanno meno vicini da escludere, quindi un toro messo lì costa meno alla griglia. Apri nella parte stretta e la parte larga si risolve da sola più tardi.',
  'When nothing moves, assume one and follow it': 'Quando non si muove niente, ipotizzane uno e seguilo',
  'Take a pen with two options left, pick one, and push the consequences until something breaks. If it breaks, the cell you picked is dead and you have learned something real. Place actual bulls while you do this rather than working it out in your head: an illegal one lights up the instant it lands, so the board tells you where the chain failed.':
    'Prendi un recinto con due possibilità rimaste, scegline una e spingi le conseguenze finché qualcosa non si rompe. Se si rompe, la casella che hai scelto è morta e hai imparato qualcosa di vero. Metti tori veri mentre lo fai, invece di calcolarlo a mente: uno illegale si illumina nell’istante in cui atterra, quindi è la griglia a dirti dove la catena è saltata.',
  'Go and try one': 'Vai a provarne uno',

  'Board sizes': 'Formati di griglia',
  'Star Battle board sizes and difficulty': 'Formati e difficoltà di Star Battle',
  'Five sizes, 200 levels each. Level 1 of light and level 173 of extreme are both one click away.':
    'Cinque formati, 200 livelli ciascuno. Il livello 1 di molto facile e il livello 173 di estremo sono entrambi a un clic.',
  '200 levels': '200 livelli',
  '6x6 board, one bull per row, column and pen.': 'Griglia 6x6, un toro per riga, colonna e recinto.',
  '8x8 board, one bull per row, column and pen.': 'Griglia 8x8, un toro per riga, colonna e recinto.',
  '10x10 board, one bull per row, column and pen.':
    'Griglia 10x10, un toro per riga, colonna e recinto.',
  '10x10 board, two bulls per row, column and pen.':
    'Griglia 10x10, due tori per riga, colonna e recinto.',
  '15x15 board, three bulls per row, column and pen.':
    'Griglia 15x15, tre tori per riga, colonna e recinto.',
  'Where to start. Small enough to hold the whole board in your head while you work out what the dots do.':
    'Da dove cominciare. Abbastanza piccola da tenere tutta la griglia in testa mentre capisci a cosa servono i punti.',
  'The same puzzle with more room to be wrong in. Rows stop being obvious and you start leaning on the pens.':
    'Lo stesso rompicapo con più spazio in cui sbagliare. Le righe smettono di essere ovvie e cominci ad appoggiarti ai recinti.',
  'The size most Star Battle puzzles come in. If you have played this elsewhere, start here and it will feel familiar.':
    'Il formato più comune per Star Battle. Se ci hai già giocato altrove, comincia da qui e ti sembrerà familiare.',
  'What most people mean by Two Not Touch. With two bulls per row, finding one bull no longer finishes the row.':
    'Quello che di solito si intende per Two Not Touch. Con due tori per riga, trovarne uno non chiude più la riga.',
  '225 cells, 15 pens, 45 bulls. Expect to sit with one of these. They are also the boards that can have more than one valid answer.':
    '225 caselle, 15 recinti, 45 tori. Mettiti comodo. Sono anche le griglie che possono avere più di una soluzione valida.',
  'What changes when the star count goes up': 'Cosa cambia quando le stelle aumentano',
  "A 6x6 board and a 10x10 board ask for the same work, just more of it. One bull per row and two bulls per row ask different questions. With one, finding a row's bull retires the row. With two, it tells you almost nothing on its own, because the second is still out there and the no-touching rule is all that holds it. That is the step from medium to hard, and again from hard to extreme.":
    'Una griglia 6x6 e una 10x10 chiedono lo stesso lavoro, solo in quantità diversa. Un toro per riga e due tori per riga chiedono cose diverse. Con uno, trovare il toro di una riga manda la riga in pensione. Con due, da solo non dice quasi niente, perché il secondo è ancora là fuori e a tenerlo c’è solo la regola del non contatto. È questo il salto da medio a difficile, e di nuovo da difficile a estremo.',

  'About the project': 'Il progetto',
  'CowField is a side project by Volodymyr Mykhailiuk, a Star Battle puzzle built solo to try out new tools and to have one finished thing worth showing.':
    'CowField è un progetto personale di Volodymyr Mykhailiuk, un rompicapo Star Battle fatto da solo per provare strumenti nuovi e finire una cosa da mostrare.',
  'CowField is a personal project. I am Volodymyr Mykhailiuk, and I built it on my own, front to back.':
    'CowField è un progetto personale. Sono Volodymyr Mykhailiuk, e l’ho costruito da solo, da cima a fondo.',
  'Why a puzzle game': 'Perché un gioco di logica',
  'A todo list would have been quicker. I play these puzzles, and the part I actually wanted to understand was how the boards get made. Whether a generator can be trusted to produce one with a single answer, and what checking that costs. Most of that question lives on the server, so building it was a way to get properly better at backend work. The front end got the rest of the attention, most of it spent calibrating things nobody is meant to notice.':
    'Una lista di cose da fare sarebbe stata più veloce. Questi rompicapi li gioco, e la parte che volevo davvero capire era come nascono le griglie. Se ci si può fidare di un generatore perché ne produca una con una sola soluzione, e quanto costa verificarlo. Quasi tutta questa domanda vive sul server, quindi costruirlo è stato un modo per migliorare sul serio nel lavoro di backend. Il resto dell’attenzione è andato al front end, in gran parte speso a calibrare cose che nessuno dovrebbe notare.',
  'Something finished, not a demo': 'Una cosa finita, non una demo',
  'I wanted one thing I could point at. A game a stranger can open and play without being told what it is, with everything a real product needs somewhere inside it, including the dull parts.':
    'Volevo una cosa sola da poter indicare. Un gioco che uno sconosciuto può aprire e giocare senza che gli si spieghi cos’è, con dentro da qualche parte tutto quello che serve a un prodotto vero, comprese le parti noiose.',
  'Built alone, on purpose': 'Fatto da solo, di proposito',
  'Working solo means every part is mine. The board rules, the generator and the solver, the API, the database schema, the layout, the copy, and both languages. There is nobody to hand the half I am worse at.':
    'Lavorare da soli vuol dire che ogni parte è mia. Le regole della griglia, il generatore e il risolutore, l’API, lo schema del database, il layout, i testi, e tutte le lingue. Non c’è nessuno a cui passare la metà in cui sono più scarso.',
  'A place to try things': 'Un posto dove provare cose',
  'Small libraries I would otherwise never have a reason to install get tried out here, and a few of them I ended up writing myself once I had seen what they cost. The QR code in the share dialog is about 450 lines of Reed-Solomon and bit placement, with no dependency behind it.':
    'Piccole librerie che altrimenti non avrei mai motivo di installare qui vengono provate, e alcune ho finito per scrivermele da solo una volta visto quanto costavano. Il codice QR nella finestra di condivisione sono circa 450 righe di Reed-Solomon e posizionamento di bit, senza nessuna dipendenza dietro.',
  'Learning the newer tooling': 'Imparare gli strumenti più nuovi',
  'The other thing I practise here is working well with the newer tools that sit alongside the editor. Getting something genuinely useful out of them is a skill of its own, and it only develops on a real project, where a bad decision has to be lived with for weeks.':
    'L’altra cosa che mi alleno a fare qui è lavorare bene con gli strumenti più recenti che stanno accanto all’editor. Tirarne fuori qualcosa di davvero utile è un’abilità a sé, e si sviluppa solo su un progetto vero, dove una scelta sbagliata va poi tenuta per settimane.',
  'Getting in touch': 'Come contattarmi',
  'Or find me on Telegram as': 'Oppure trovami su Telegram come',
  'If any of this is worth a message, mine is': 'Se qualcosa di tutto questo merita un messaggio, la mia mail è',
  '. Work, questions about how something here is built, or a bug you hit on level 143.':
    '. Lavoro, domande su come è fatto qualcosa qui dentro, o un bug che hai trovato al livello 143.',
  'What it is built with': 'Con cosa è fatto',
  'React, TypeScript and Vite in the browser. Express, Prisma and Postgres behind it. The board rules, the generator and the solver sit in one shared folder that both sides import, so the browser and the server can never disagree about what a legal board is. The site runs on Vercel and the API on Render.':
    'React, TypeScript e Vite nel browser. Express, Prisma e Postgres dietro. Le regole della griglia, il generatore e il risolutore stanno in una sola cartella condivisa che entrambe le parti importano, così browser e server non possono mai essere in disaccordo su cosa sia una griglia valida. Il sito gira su Vercel e l’API su Render.',

  'Adjust your preferences here.': 'Regola qui le tue preferenze.',
  'Sound effects': 'Effetti sonori',
  'Enable sound effects.': 'Attiva gli effetti sonori.',
  Music: 'Musica',
  'Enable background music during play.': 'Attiva la musica di sottofondo durante il gioco.',
  'Dark mode': 'Tema scuro',
  'Switch to dark colours for playing in low light.':
    'Passa ai colori scuri per giocare con poca luce.',
  'Choose the language used across the game.': 'Scegli la lingua usata in tutto il gioco.',
  'Switch to dark mode': 'Passa al tema scuro',
  'Switch to light mode': 'Passa al tema chiaro',
  'Take your time': 'Prenditi il tuo tempo',
  'Hide the timers so nothing on screen is counting.':
    'Nascondi i timer, così sullo schermo non conta niente.',
  'Auto-place dots': 'Punti automatici',
  'Ring each bull with dots the moment you place it.':
    'Circonda di punti ogni toro nel momento in cui lo metti.',
  'Player statistics': 'Statistiche del giocatore',
  'Most progress': 'Progressi maggiori',
  'No data': 'Nessun dato',
  'Completed levels': 'Livelli completati',
  'Placed bulls': 'Tori piazzati',
  'Total completion time': 'Tempo totale di completamento',
  'Performance breakdown by difficulty:': 'Dettaglio dei risultati per difficoltà:',
  Difficulty: 'Difficoltà',
  'Fastest level': 'Livello più veloce',
  'Average per level': 'Media per livello',
  'No completed level': 'Nessun livello completato',
  '{{count}} completed levels': '{{count}} livelli completati',
  '{{count}} completed levels_one': '{{count}} livello completato',
  '{{count}} completed levels_other': '{{count}} livelli completati',
  'The requested level route is invalid.': 'Il percorso del livello richiesto non è valido.',
  'This level does not exist yet.': 'Questo livello non esiste ancora.',
  'Create level': 'Crea livello',
  'Edit level': 'Modifica livello',
  'Remaining bulls': 'Tori rimasti',
  Timer: 'Cronometro',
  Back: 'Indietro',
  'Failed to load level data.': 'Caricamento dei dati del livello non riuscito.',
  'Admin role is required to create or edit levels.':
    'Per creare o modificare livelli serve il ruolo admin.',
  'Fix those problems and try again.': 'Correggi questi problemi e riprova.',
  'Add a level title.': 'Aggiungi un titolo al livello.',
  'Grid size must stay {{size}} x {{size}} for {{difficulty}}.':
    'Per {{difficulty}} la griglia deve restare {{size}} x {{size}}.',
  'The pen grid is incomplete.': 'La griglia dei recinti è incompleta.',
  'The authored bull layout is incomplete.': 'La disposizione dei tori è incompleta.',
  'Every cell must belong to a pen.': 'Ogni casella deve appartenere a un recinto.',
  'A {{size}} x {{size}} level must use exactly {{size}} pens.':
    'Un livello {{size}} x {{size}} deve usare esattamente {{size}} recinti.',
  'Pen {{penId}} is too small for {{count}} bull placements.':
    'Il recinto {{penId}} è troppo piccolo per {{count}} tori.',
  'Pen {{penId}} is too small for {{count}} bull placements._one':
    'Il recinto {{penId}} è troppo piccolo per {{count}} toro.',
  'Pen {{penId}} is too small for {{count}} bull placements._other':
    'Il recinto {{penId}} è troppo piccolo per {{count}} tori.',
  'Pen {{penId}} must be one connected region.':
    'Il recinto {{penId}} deve essere un’unica regione collegata.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.':
    'Per {{difficulty}} la disposizione deve contenere esattamente {{count}} tori.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._one':
    'Per {{difficulty}} la disposizione deve contenere esattamente {{count}} toro.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._other':
    'Per {{difficulty}} la disposizione deve contenere esattamente {{count}} tori.',
  'Each row must contain exactly {{count}} bulls.':
    'Ogni riga deve contenere esattamente {{count}} tori.',
  'Each row must contain exactly {{count}} bulls._one':
    'Ogni riga deve contenere esattamente {{count}} toro.',
  'Each row must contain exactly {{count}} bulls._other':
    'Ogni riga deve contenere esattamente {{count}} tori.',
  'Each column must contain exactly {{count}} bulls.':
    'Ogni colonna deve contenere esattamente {{count}} tori.',
  'Each column must contain exactly {{count}} bulls._one':
    'Ogni colonna deve contenere esattamente {{count}} toro.',
  'Each column must contain exactly {{count}} bulls._other':
    'Ogni colonna deve contenere esattamente {{count}} tori.',
  'Pen {{penId}} must contain exactly {{count}} bulls.':
    'Il recinto {{penId}} deve contenere esattamente {{count}} tori.',
  'Pen {{penId}} must contain exactly {{count}} bulls._one':
    'Il recinto {{penId}} deve contenere esattamente {{count}} toro.',
  'Pen {{penId}} must contain exactly {{count}} bulls._other':
    'Il recinto {{penId}} deve contenere esattamente {{count}} tori.',
  'Bulls may not touch, including diagonally.':
    'I tori non possono toccarsi, nemmeno in diagonale.',
  'This level has no valid solution.': 'Questo livello non ha nessuna soluzione valida.',
  'Level saved': 'Livello salvato',
  'Failed to save level.': 'Salvataggio del livello non riuscito.',
  'Failed to delete level.': 'Eliminazione del livello non riuscita.',
  'Deleting...': 'Eliminazione...',
  'Delete level': 'Elimina livello',
  'Discard unsaved changes?': 'Scartare le modifiche non salvate?',
  'This level has unsaved changes. Leaving now discards them.':
    'Questo livello ha modifiche non salvate. Uscendo adesso le perdi.',
  'This level has unsaved changes. This action replaces the board and discards them.':
    'Questo livello ha modifiche non salvate. Questa azione sostituisce la griglia e le scarta.',
  'Leave and discard': 'Esci e scarta',
  Discard: 'Scarta',
  'Delete level?': 'Eliminare il livello?',
  'Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.':
    'Eliminare il livello {{levelNumber}} di {{difficulty}}? Questo rimuove il file del livello dal progetto.',
  'Board cleared': 'Griglia svuotata',
  'Validation passed': 'Validazione superata',
  'Exactly one solution.': 'Esattamente una soluzione.',
  'This level has more than one solution.': 'Questo livello ha più di una soluzione.',
  'Found {{count}} solutions. A good level has exactly one.':
    'Trovate {{count}} soluzioni. Un buon livello ne ha esattamente una.',
  'Found {{count}} solutions. A good level has exactly one._one':
    'Trovata {{count}} soluzione. Un buon livello ne ha esattamente una.',
  'Found {{count}} solutions. A good level has exactly one._other':
    'Trovate {{count}} soluzioni. Un buon livello ne ha esattamente una.',
  'Found {{count}}+ solutions. A good level has exactly one.':
    'Trovate {{count}}+ soluzioni. Un buon livello ne ha esattamente una.',
  'Found {{count}}+ solutions. A good level has exactly one._one':
    'Trovate {{count}}+ soluzioni. Un buon livello ne ha esattamente una.',
  'Found {{count}}+ solutions. A good level has exactly one._other':
    'Trovate {{count}}+ soluzioni. Un buon livello ne ha esattamente una.',
  'Generate builds a level with exactly one solution.':
    'Genera costruisce un livello con esattamente una soluzione.',
  'Generation ran out of time. Try again.': 'La generazione ha esaurito il tempo. Riprova.',
  'The generator searches for a board with exactly one solution, which takes longer on medium and hard.':
    'Il generatore cerca una griglia con esattamente una soluzione, e su medio e difficile ci mette di più.',
  'Nothing on the board was changed, so you can run Generate again.':
    'Sulla griglia non è cambiato niente, quindi puoi rilanciare Genera.',
  'Level generated': 'Livello generato',
  'Generating...': 'Generazione...',
  'Create/Edit Level': 'Crea/Modifica livello',
  Generate: 'Genera',
  'Validate level': 'Valida livello',
  'Validating...': 'Validazione...',
  'Save level': 'Salva livello',
  'Clear board': 'Svuota griglia',
  'Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.':
    'Scegli un colore, poi clicca le caselle per assegnarle a quella regione. Ogni casella deve appartenere a un colore prima che il livello si possa salvare, e dentro ogni colore vanno messe le mucche. Questa griglia richiede esattamente {{gridSize}} colori collegati e {{requiredCowCount}} mucche.',
  'Color palette': 'Tavolozza dei colori',
  Erase: 'Cancella',
  Cow: 'Mucca',
  'Color {{colorId}}': 'Colore {{colorId}}',
  'Level color editor': 'Editor dei colori del livello',
  Profile: 'Profilo',
  Guest: 'Ospite',
  User: 'Utente',
  'Preview role': 'Anteprima ruolo',
  'Log out': 'Esci',
  Login: 'Accesso',
  'Sign in with your email and password, create an account, or continue as a guest.':
    'Accedi con email e password, crea un account, oppure continua come ospite.',
  Email: 'Email',
  Password: 'Password',
  'Log in': 'Accedi',
  'Continue with Google': 'Continua con Google',
  'Completing Google login...': 'Completamento dell’accesso con Google...',
  'Verifying your email...': 'Verifica dell’email...',
  'Play as guest': 'Gioca come ospite',
  'Ready when you are': 'Quando vuoi tu',
  'Play right away without an account, or make one so your times follow you between devices.':
    'Gioca subito senza account, oppure creane uno così i tuoi tempi ti seguono tra i dispositivi.',
  Share: 'Condividi',
  'Play this Star Battle level on CowField': 'Gioca questo livello di Star Battle su CowField',
  'Link copied.': 'Link copiato.',
  "Couldn't share this level.": 'Non è stato possibile condividere questo livello.',
  'Sign in': 'Accedi',
  'Your guest progress stays here': 'I tuoi progressi da ospite restano qui',
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._one':
    'Accedendo lasci indietro il livello che hai finito come ospite su questo dispositivo. Crea invece un account e viene con te.',
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._other':
    'Accedendo lasci indietro i {{count}} livelli che hai finito come ospite su questo dispositivo. Crea invece un account e vengono con te.',
  'Sign in anyway': 'Accedi lo stesso',
  'Statistics is available only for logged users.':
    'Le statistiche sono disponibili solo per gli utenti registrati.',
  'Create account': 'Crea un account',
  'Forgot password?': 'Password dimenticata?',
  'Passwords do not match.': 'Le password non coincidono.',
  'Request failed.': 'Richiesta non riuscita.',
  'Create a user account with your email and password.':
    'Crea un account utente con la tua email e una password.',
  'Confirm password': 'Conferma password',
  'Back to login': 'Torna all’accesso',
  'Reset password': 'Reimposta password',
  'Enter your email and we will send you a password reset link.':
    'Inserisci la tua email e ti mandiamo un link per reimpostare la password.',
  'If the account exists, a reset link has been sent to that email address.':
    'Se l’account esiste, a quell’indirizzo è stato inviato un link per reimpostare la password.',
  'Send reset link': 'Invia il link',
  'I already have a reset link': 'Ho già un link di reimpostazione',
  'Your password has been updated.': 'La tua password è stata aggiornata.',
  'Open the reset link from your email and choose a new password.':
    'Apri il link che hai ricevuto per email e scegli una nuova password.',
  'Reset token': 'Codice di reimpostazione',
  'New password': 'Nuova password',
  'Save new password': 'Salva la nuova password',
  'Account created. Check your email to verify it before logging in.':
    'Account creato. Controlla l’email per verificarlo prima di accedere.',
  'Verification email sent again.': 'Email di verifica inviata di nuovo.',
  'Resend verification email': 'Invia di nuovo l’email di verifica',
  'Show password': 'Mostra password',
  'Hide password': 'Nascondi password',
  'You are playing as a Guest.': 'Stai giocando come ospite.',
  'This browser is blocking saved data, so these choices will reset when you close the tab.':
    'Questo browser blocca i dati salvati, quindi queste scelte si azzereranno quando chiudi la scheda.',
  'Incorrect email or password.': 'Email o password non corretti.',
  'Too many requests. Try again in a moment.': 'Troppe richieste. Riprova tra un momento.',
  'Too many attempts. Wait a few minutes and try again.':
    'Troppi tentativi. Aspetta qualche minuto e riprova.',
  'Guests cannot access this resource.': 'Gli ospiti non possono accedere a questa risorsa.',
  'Invalid email or password': 'Email o password non corretti.',
  'User already exists': 'Esiste già un account con questa email.',
  'Email not verified': 'Email non verificata.',
  'Invalid token': 'Questo link di reimpostazione non è più valido. Chiedine uno nuovo.',
  'Password too short': 'Questa password è troppo corta. Usane una di almeno 8 caratteri.',
  'Password too long': 'Questa password è troppo lunga.',
  'Failed to restore session after login.':
    'Ripristino della sessione dopo l’accesso non riuscito.',
  'Google login failed.': 'Accesso con Google non riuscito.',
  'Sign-in failed. Try again.': 'Accesso non riuscito. Riprova.',
  "Couldn't create your account. Try again.":
    'Non è stato possibile creare il tuo account. Riprova.',
  "Couldn't send the reset link. Try again.": 'Non è stato possibile inviare il link. Riprova.',
  "Couldn't update your password. Try again.":
    'Non è stato possibile aggiornare la tua password. Riprova.',
  'What is CowField?': 'Che cos’è CowField?',
  'Back to your levels': 'Torna ai tuoi livelli',
  'Email verification failed.': 'Verifica dell’email non riuscita.',
  'Your email is verified. You can log in now.':
    'La tua email è verificata. Ora puoi accedere.',
  'Neon Auth is not configured.': 'Neon Auth non è configurato.',
  'Invalid request payload.': 'Payload della richiesta non valido.',
  'Level complete': 'Livello completato',
  'Best time: {{time}}': 'Tempo migliore: {{time}}',
  'New best time.': 'Nuovo record personale.',
  "Couldn't save your progress. Check your connection and try again.":
    'Non è stato possibile salvare i tuoi progressi. Controlla la connessione e riprova.',
  'Try again': 'Riprova',
  'You completed the last available level.': 'Hai completato l’ultimo livello disponibile.',
  'Your progress has been saved.': 'I tuoi progressi sono stati salvati.',
  'Saving your progress...': 'Salvataggio dei progressi...',

  'Something went wrong. Reloading the page usually fixes it.':
    'Qualcosa è andato storto. Di solito basta ricaricare la pagina.',
  'Reload the page': 'Ricarica la pagina',
  "Couldn't load your progress. Check your connection and try again.":
    'Non è stato possibile caricare i tuoi progressi. Controlla la connessione e riprova.',
  "Couldn't load these levels. Check your connection and try again.":
    'Non è stato possibile caricare questi livelli. Controlla la connessione e riprova.',
  "Couldn't load your statistics. Check your connection and try again.":
    'Non è stato possibile caricare le tue statistiche. Controlla la connessione e riprova.',
  "Couldn't load this level. Check your connection and try again.":
    'Non è stato possibile caricare questo livello. Controlla la connessione e riprova.',
} as const

export default it
