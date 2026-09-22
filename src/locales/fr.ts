const fr = {
  CowField: 'CowField',

  // ---------------------------------------------------------------------------------------------
  // French, added 2026-09-21. Terminology agreed before any of this was written — see
  // `claude/adding-a-language.md`, which carries the reasoning for each choice.
  //
  //   Star Battle    -> Star Battle, with "Bataille d'étoiles" named alongside
  //   Two Not Touch  -> Deux étoiles
  //   pen            -> enclos          bull -> taureau
  //   cow            -> vache           dot  -> point
  //   difficulties   -> Très facile / Facile / Moyen / Difficile / Extrême
  //
  // **Three conventions this file follows:**
  //
  // 1. **"vous", not "tu."** The user's call, and the opposite of the German file. The registers
  //    are not equivalent: a French reader notices being tutoyé by a site they do not know, where
  //    a German reader does not notice being geduzt. The warmth in this copy comes from the
  //    first-person author voice, which survives either way.
  // 2. **The English name leads.** Unlike German, where `janko.at` made *Sternenschlacht* the
  //    stronger term, French keeps *Star Battle* untranslated at least as often — the French App
  //    Store sells it that way. So titles carry *Star Battle* and the prose names *Bataille
  //    d'étoiles* beside it.
  // 3. **French typography**: « guillemets » rather than straight quotes, and a non-breaking space
  //    before a colon. Both are invisible in review and wrong to a French reader.
  //
  // Search-facing copy uses the genre's vocabulary (*étoile*, *région*) and the app uses the
  // game's (*taureau*, *enclos*) — the same split `en.ts` and `de.ts` make. Titles stay under 60
  // characters and descriptions under 160; `npm run check:seo` enforces both, and French runs
  // longer than English for the same sentence.
  // ---------------------------------------------------------------------------------------------
  'Play Star Battle online, free': 'Jouer à Star Battle en ligne, gratuitement',
  'Play Star Battle online, free - CowField': 'Star Battle en ligne, gratuit - CowField',
  'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.':
    // 172 characters in its first form, which the length check caught. French runs long; this is
    // the same thought in fewer words rather than a truncated one.
    'Jouez à Star Battle en ligne, gratuitement et sans compte. 1 000 grilles de 6x6 à 15x15, le jeu de logique appelé Bataille d’étoiles. Chrono en option.',
  'Star Battle, played with cows. The grid is split into coloured pens, and every row, every column and every pen needs the same number of bulls. No two bulls may touch, not even at a corner. If you have played Two Not Touch, you already know it.':
    'Star Battle, joué avec des vaches. La grille est découpée en enclos colorés, et chaque ligne, chaque colonne et chaque enclos demande le même nombre de taureaux. Deux taureaux ne peuvent jamais se toucher, pas même par un coin. Si vous connaissez la Bataille d’étoiles ou les Deux étoiles, vous connaissez déjà le principe.',
  'Play now': 'Jouer maintenant',
  'Starting...': 'Démarrage…',
  'Sign in to save your progress': 'Connectez-vous pour garder votre progression',
  "You don't need an account. Pick any level and start.":
    'Aucun compte n’est nécessaire. Choisissez un niveau et commencez.',
  'The server is waking up. First visit of the day takes a few seconds.':
    'Le serveur se réveille. La première visite de la journée prend quelques secondes.',
  "Couldn't start a game. Check your connection and try again.":
    'Impossible de lancer la partie. Vérifiez votre connexion et réessayez.',
  'How to play': 'Comment jouer',
  'Every row, column and pen gets the same number of bulls. One on the small boards, three on the biggest.':
    'Chaque ligne, chaque colonne et chaque enclos reçoit le même nombre de taureaux. Un sur les petites grilles, trois sur la plus grande.',
  'Two bulls can never touch, including diagonally at a corner.':
    'Deux taureaux ne peuvent jamais se toucher, pas même en diagonale par un coin.',
  "Dots are your own notes. They don't count as bulls.":
    'Les points sont vos propres notes. Ils ne comptent pas comme des taureaux.',
  'Read the full rules': 'Lire toutes les règles',
  'Solving techniques': 'Techniques de résolution',
  'No timer unless you want one': 'Pas de chrono, sauf si vous en voulez un',
  'There is a clock if you want to race yourself, and a setting that hides it. Put a bull where it breaks a rule and it lights up straight away. It will not tell you what is correct, only what is illegal.':
    'Il y a une horloge si vous voulez vous chronométrer, et un réglage qui la cache. Posez un taureau là où il enfreint une règle et il s’allume aussitôt. La grille ne vous dit pas ce qui est juste, seulement ce qui est interdit.',
  '1,000 levels, five board sizes': '1 000 niveaux, cinq tailles de grille',
  'Two hundred levels in each of five difficulties. Light is 6x6 with one bull per row, column and pen. Easy is 8x8, medium is 10x10, hard is 10x10 with two. Extreme is 15x15 with three.':
    'Deux cents niveaux dans chacune des cinq difficultés. Très facile, c’est du 6x6 avec un taureau par ligne, colonne et enclos. Facile, c’est du 8x8, Moyen du 10x10, Difficile du 10x10 avec deux. Extrême, c’est du 15x15 avec trois.',
  'Every board is generated and then solved again to check it. Light through hard have exactly one answer. Any arrangement that follows the rules counts as a win.':
    'Chaque grille est générée puis résolue à nouveau pour la vérifier. De Très facile à Difficile, il y a exactement une solution. Toute disposition qui respecte les règles compte comme gagnée.',
  '1,000 levels': '1 000 niveaux',
  'Five difficulties': 'Cinq difficultés',
  'Up to 15x15': 'Jusqu’à 15x15',
  'No sign-up': 'Sans inscription',
  'Try it yourself.': 'Essayez vous-même.',

  // The not-found view, which replaced a silent redirect to `/`.
  'Page not found': 'Page introuvable',
  'That link does not lead anywhere.': 'Ce lien ne mène nulle part.',
  'Back to the start': 'Revenir au début',

  // Page descriptions — `<meta name="description">`. Each one is under 160 characters *in French*,
  // which is the constraint that bites: the same sentence is reliably longer than its English
  // original, so several of these are shorter thoughts rather than translated ones.
  'The rules of Star Battle, also called Two Not Touch: the same number of bulls in every row, column and region, and no two touching. Plus what the dots do.':
    'Les règles de Star Battle, la Bataille d’étoiles : autant d’étoiles dans chaque ligne, colonne et région, et jamais deux qui se touchent.',
  'Six techniques for solving Star Battle and Two Not Touch puzzles, from fencing off stars to counting regions against rows, plus what to do when you get stuck.':
    'Six techniques pour résoudre Star Battle et la Bataille d’étoiles : encercler les étoiles, compter les régions contre les lignes, et débloquer une grille.',
  'What changes between a 6x6 one-bull Star Battle board and a 15x15 three-bull one, how many levels each size has, and which difficulty to start with.':
    'Ce qui change entre une grille Star Battle 6x6 à une étoile et une 15x15 à trois, combien de niveaux compte chaque taille, et par où commencer.',
  'Loading...': 'Chargement…',
  Hidden: 'Masqué',
  'Back to home': 'Retour à l’accueil',
  'Back to the rules': 'Retour aux règles',
  'Back to levels': 'Retour aux niveaux',
  'Back to all difficulties': 'Retour à toutes les difficultés',
  Restart: 'Recommencer',
  'Next Level': 'Niveau suivant',
  Cancel: 'Annuler',
  Save: 'Enregistrer',
  Delete: 'Supprimer',
  Role: 'Rôle',
  Player: 'Joueur',
  Admin: 'Admin',
  Volume: 'Volume',
  Language: 'Langue',
  Undo: 'Annuler',
  Home: 'Accueil',
  'Level {{levelNumber}}': 'Niveau {{levelNumber}}',
  Light: 'Très facile',
  Easy: 'Facile',
  Medium: 'Moyen',
  Hard: 'Difficile',
  Extreme: 'Extrême',
  'Home menu': 'Menu d’accueil',
  'Site links': 'Liens du site',
  'Share CowField': 'Partager CowField',
  'Send someone the game, or let them scan it.':
    'Envoyez le jeu à quelqu’un, ou laissez-le le scanner.',
  'Link to CowField': 'Lien vers CowField',
  'Copy link': 'Copier le lien',
  'Copied': 'Copié',
  "Couldn't copy the link. Select it and copy manually.":
    'Le lien n’a pas pu être copié. Sélectionnez-le et copiez-le à la main.',
  'QR code linking to CowField': 'QR code vers CowField',
  'Point a phone camera at this to open the game.':
    'Pointez l’appareil photo d’un téléphone dessus pour ouvrir le jeu.',
  'Copy image': 'Copier l’image',
  'Image copied': 'Image copiée',
  'Paste it anywhere that takes a picture.': 'Collez-la partout où une image est acceptée.',
  "Couldn't copy the image.": 'L’image n’a pas pu être copiée.',
  'Close': 'Fermer',
  'Puzzle board': 'Grille du casse-tête',
  // Cell names. Every one of these describes something conveyed only visually — the pen by its
  // colour, the mark by an `aria-hidden` icon, the rule break by an animation.
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}':
    'Ligne {{row}}, colonne {{column}}, enclos {{pen}}. {{state}}',
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}. Breaks a rule.':
    'Ligne {{row}}, colonne {{column}}, enclos {{pen}}. {{state}}. Enfreint une règle.',
  'Row {{row}}, column {{column}}': 'Ligne {{row}}, colonne {{column}}',
  'Pen {{pen}}': 'Enclos {{pen}}',
  'No pen': 'Aucun enclos',
  'This board is cramped on a screen this size.':
    'La grille est à l’étroit sur un écran de cette taille.',
  'Turning your phone sideways gives it more room.':
    'En tournant votre téléphone à l’horizontale, elle a plus de place.',
  'Light levels are a better fit for narrow screens.':
    'Les niveaux Très facile conviennent mieux aux écrans étroits.',
  Dismiss: 'Masquer',
  Play: 'Jouer',
  About: 'Règles',
  Statistics: 'Statistiques',
  Settings: 'Réglages',
  // -------------------------------------------------------------------------------------------
  // `/levels` and `/levels/:difficulty`. These are the pages asked to rank, so headings and
  // descriptions use *étoile* and *région* — the words a French speaker types — while the body
  // copy uses *taureau* and *enclos*, which is what the grid is actually made of.
  // -------------------------------------------------------------------------------------------
  '1,000 free Star Battle puzzles': '1 000 grilles Star Battle gratuites',
  'Choose a difficulty to play.': 'Choisissez une difficulté pour jouer.',
  'Pick a size to see its 200 levels. They run from 6x6 with one bull per row up to 15x15 with three.':
    'Choisissez une taille pour voir ses 200 niveaux. Elles vont du 6x6 à un taureau par ligne au 15x15 à trois.',
  'Browse all 1,000 levels': 'Parcourir les 1 000 niveaux',
  'Every Star Battle puzzle on CowField, 200 in each of five sizes. Pick 6x6, 8x8, 10x10 with one or two stars, or 15x15 with three, and start without an account.':
    'Toutes les grilles Star Battle de CowField, 200 par taille. 6x6, 8x8, 10x10 à une ou deux étoiles, ou 15x15 à trois. Sans compte, sans inscription.',
  'What changes between sizes': 'Ce qui change d’une taille à l’autre',
  '6x6 Star Battle puzzles, one star per row': 'Star Battle 6x6 : une étoile par ligne',
  'Two hundred 6x6 Star Battle puzzles, free, with one star in every row, column and region. The smallest boards here, and where the dots start to make sense.':
    'Deux cents grilles Star Battle 6x6 gratuites, avec une étoile par ligne, colonne et région. Les plus petites du site, et là où les points prennent leur sens.',
  'Light is the smallest size here. Every board is 6 by 6, with one bull in every row, every column and every pen.':
    'Très facile est la plus petite taille du site. Chaque grille fait 6 sur 6, avec un taureau dans chaque ligne, chaque colonne et chaque enclos.',
  'Thirty-six cells is small enough to hold the whole grid in your head. Start here if you have not used the dots before.':
    'Trente-six cases, c’est assez peu pour garder toute la grille en tête. Commencez ici si vous n’avez jamais utilisé les points.',
  '8x8 Star Battle puzzles, one star per row': 'Star Battle 8x8 : une étoile par ligne',
  'An 8x8 grid, one star in every row, column and region, and 200 free puzzles. Twenty-eight more cells than a 6x6 board, and the obvious rows run out sooner.':
    'Une grille 8x8, une étoile par ligne, colonne et région, 200 casse-tête gratuits. 28 cases de plus qu’en 6x6, et les lignes évidentes s’épuisent vite.',
  'Easy keeps one bull in every row, column and pen, and moves the board to 8 by 8. Same rules as the 6x6 boards, with twenty-eight more cells to be wrong in.':
    'Facile garde un taureau par ligne, colonne et enclos, et passe la grille en 8 sur 8. Les mêmes règles que le 6x6, avec vingt-huit cases de plus pour se tromper.',
  'Counting rows stops being enough on its own at this size, and the shape of the pens starts to matter.':
    'À cette taille, compter les lignes ne suffit plus à soi seul, et la forme des enclos commence à compter.',
  '10x10 Star Battle puzzles, one star per row': 'Star Battle 10x10 : une étoile par ligne',
  'The size most Star Battle puzzles come in. 200 free 10x10 boards with one star in every row, column and region, and the usual place to start.':
    'La taille la plus courante des grilles Star Battle. 200 grilles 10x10 gratuites avec une étoile par ligne, colonne et région.',
  'Medium is 10 by 10 with one bull in every row, column and pen. Most Star Battle puzzles come in this size, so it should feel familiar if you have played elsewhere.':
    'Moyen, c’est du 10 sur 10 avec un taureau par ligne, colonne et enclos. La plupart des grilles Star Battle sont de cette taille, vous devriez donc être en terrain connu si vous avez joué ailleurs.',
  'A hundred cells is enough that guessing stops paying and you have to eliminate properly.':
    // Compressed too far at first: 69 characters against the English 87, which dropped
    // `/fr/levels/medium` below the two-real-paragraphs bar the difficulty pages are held to.
    'À cent cases, deviner ne paie plus : il faut éliminer proprement, en écartant les possibilités une à une.',
  '10x10 Star Battle puzzles, two stars per row': 'Star Battle 10x10 : deux étoiles par ligne',
  'Two stars in every row, column and region of a 10x10 grid. This is what most people mean by Two Not Touch, and there are 200 of them here, free.':
    'Deux étoiles par ligne, colonne et région sur une grille 10x10. C’est ce qu’on appelle les Deux étoiles, et il y en a 200 ici, gratuites.',
  'Hard stays at 10 by 10 and puts two bulls in every row, column and pen. This is the version most people mean by Two Not Touch.':
    'Difficile reste en 10 sur 10 et met deux taureaux dans chaque ligne, colonne et enclos. C’est la version connue sous le nom de Deux étoiles.',
  'Finding one bull in a row no longer retires the row, because the second is still out there. The rule that no two bulls may touch ends up doing most of the work.':
    'Trouver un taureau dans une ligne ne règle plus la ligne, puisque le second reste à placer. C’est la règle qui interdit à deux taureaux de se toucher qui finit par faire le plus gros du travail.',
  '15x15 Star Battle puzzles, three stars per row': 'Star Battle 15x15 : trois étoiles par ligne',
  'Three stars in every row, column and region of a 15x15 grid. 225 cells, 45 stars and 200 puzzles, the hardest Star Battle boards on CowField.':
    'Trois étoiles par ligne, colonne et région sur une grille 15x15. 225 cases, 45 étoiles et 200 grilles, les plus dures du site.',
  'Extreme is 15 by 15 with three bulls in every row, column and pen. That is 225 cells and 45 bulls, and one of these will take a while.':
    'Extrême, c’est du 15 sur 15 avec trois taureaux par ligne, colonne et enclos. Cela fait 225 cases et 45 taureaux, et on reste un moment sur une grille pareille.',
  'Unlike the smaller sizes, these boards are not checked to have exactly one answer. A few have several. Any legal arrangement wins, and you will never be told you found the wrong one.':
    'Contrairement aux tailles plus petites, ces grilles ne sont pas vérifiées pour n’avoir qu’une seule solution. Quelques-unes en ont plusieurs. Toute disposition autorisée gagne, et on ne vous dira jamais que vous avez trouvé la mauvaise.',
  'Available levels': 'Niveaux disponibles',
  'Unknown difficulty.': 'Difficulté inconnue.',
  'Choose one of the available difficulty groups to browse levels.':
    'Choisissez une des difficultés disponibles pour parcourir les niveaux.',
  Levels: 'Niveaux',
  '{{difficulty}} Levels': 'Niveaux – {{difficulty}}',
  Previous: 'Précédent',
  Next: 'Suivant',
  'Page {{page}} of {{totalPages}}': 'Page {{page}} sur {{totalPages}}',
  '{{completed}} of {{total}} solved': '{{completed}} sur {{total}} résolus',
  // The space before the percent sign is correct French typography, not a typo.
  '{{percent}}% done': '{{percent}} % terminé',
  // French puts 0 and 1 in the same plural category, so "0 niveau" is singular and correct.
  '{{count}} levels_one': '{{count}} niveau',
  '{{count}} levels_other': '{{count}} niveaux',
  'Open level {{levelNumber}}': 'Ouvrir le niveau {{levelNumber}}',
  'Level {{levelNumber}} solved': 'Niveau {{levelNumber}} résolu',
  'Edit level {{levelNumber}}': 'Modifier le niveau {{levelNumber}}',
  // -------------------------------------------------------------------------------------------
  // `/about` — the rules page, and the best keyword surface on the site. The first sentence names
  // all three terms a French speaker might search: Star Battle, Bataille d'étoiles, Deux étoiles.
  // -------------------------------------------------------------------------------------------
  'How to play Star Battle': 'Règles de Star Battle (Bataille d’étoiles)',
  'CowField is a Star Battle puzzle, the game also known as Two Not Touch. The stars are bulls here and the regions are pens. Nothing else about the rules changes.':
    'CowField est un casse-tête Star Battle, en français la Bataille d’étoiles, aussi appelé Deux étoiles. Ici les étoiles sont des taureaux et les régions des enclos. Rien d’autre ne change dans les règles.',
  'How cell marks work': 'Comment fonctionnent les marques',
  'Each cell changes like this:': 'Chaque case change ainsi :',
  empty: 'vide',
  'dot note': 'point de note',
  bull: 'taureau',
  'Every board has a number attached to it, depending on its size. One, two or three. Each row has to end up holding exactly that many bulls, and so does each column and each coloured pen. Get all three to agree at once and the level is done.':
    'À chaque grille est attaché un nombre, selon sa taille. Un, deux ou trois. Chaque ligne doit finir par contenir exactement ce nombre de taureaux, et chaque colonne et chaque enclos coloré aussi. Faites coïncider les trois en même temps et le niveau est terminé.',
  'The second rule. No two bulls may sit in neighbouring cells, side by side, one above the other, or touching at a single corner. Every bull needs an empty ring around it.':
    'La deuxième règle. Deux taureaux ne peuvent pas occuper des cases voisines, côte à côte, l’un au-dessus de l’autre, ni se toucher par un seul coin. Chaque taureau a besoin d’un anneau vide autour de lui.',
  'Light, easy and medium: one bull per row, column and pen.':
    'Très facile, Facile et Moyen : un taureau par ligne, colonne et enclos.',
  'Hard: two. Extreme: three, on a 15x15 board.':
    'Difficile : deux. Extrême : trois, sur une grille 15x15.',
  'Dots are notes. They never count as bulls.':
    'Les points sont des notes. Ils ne comptent jamais comme des taureaux.',
  'You win on bull placement alone.': 'On gagne uniquement sur la position des taureaux.',
  'Dots are how most people actually solve these. Mark the cells you have ruled out and the board narrows itself. You can also place a bull you are unsure about. If it breaks a rule it lights up and you can take it straight back. Leftover dots do not matter at the end.':
    'C’est avec les points que la plupart des gens résolvent vraiment ces grilles. Marquez les cases que vous avez écartées et la grille se resserre d’elle-même. Vous pouvez aussi poser un taureau dont vous n’êtes pas sûr. S’il enfreint une règle, il s’allume et vous le reprenez aussitôt. Les points qui restent à la fin n’ont aucune importance.',
  'A few things live in Settings. Take your time hides the timers. Auto-place dots rings each bull for you, which saves a lot of clicking on the big boards. There is a dark theme, and sound and music have their own volumes. Guests get take your time switched on and locked.':
    'Quelques options sont dans les Réglages. « Prenez votre temps » masque les chronos. « Points automatiques » entoure chaque taureau à votre place, ce qui épargne beaucoup de clics sur les grandes grilles. Il y a un thème sombre, et le son et la musique ont chacun leur volume. Pour les invités, « Prenez votre temps » est activé et verrouillé.',
  'I built CowField because I wanted a puzzle I could think through at my own pace. Nothing to keep up with, nothing waiting for me if I put it down for a month.':
    // "que je puisse réfléchir" was wrong — réfléchir is intransitive and takes `à`, so the
    // relative pronoun has to be `auquel`. Caught by reading the rendered page.
    'J’ai fait CowField parce que je voulais un casse-tête auquel je puisse réfléchir à mon rythme. Rien à suivre, rien qui m’attende si je le laisse de côté un mois.',

  // The FAQ. Question-shaped headings with short answers, the shape Google lifts into an answer
  // box, plus `FAQPage` structured data on the same content.
  'Common questions': 'Questions fréquentes',
  'What is Star Battle?': 'Qu’est-ce que Star Battle ?',
  'A logic puzzle on a grid split into coloured regions. You place a fixed number of stars in every row, every column and every region, and no two stars may touch, including diagonally. In CowField the stars are bulls and the regions are pens.':
    'Un casse-tête de logique sur une grille découpée en régions colorées. Vous placez le même nombre d’étoiles dans chaque ligne, chaque colonne et chaque région, et deux étoiles ne peuvent jamais se toucher, même en diagonale. En français on parle de Bataille d’étoiles. Dans CowField, les étoiles sont des taureaux et les régions des enclos.',
  'Is Two Not Touch the same puzzle?': 'Les Deux étoiles, est-ce le même casse-tête ?',
  'Yes. Two Not Touch is the name usually given to the two-star version on a 10x10 board, which is what hard is here. Same rules, different name.':
    'Oui. « Deux étoiles » est le nom habituel de la version à deux étoiles sur une grille 10x10, c’est-à-dire Difficile ici. Mêmes règles, autre nom.',
  'Do I need an account?': 'Ai-je besoin d’un compte ?',
  'No. The guest button drops you straight onto a board and keeps your progress in your browser. An account only matters if you want that progress on a second device.':
    'Non. Le bouton invité vous met directement sur une grille et garde votre progression dans votre navigateur. Un compte ne sert que si vous voulez cette progression sur un deuxième appareil.',
  'Is it free?': 'Est-ce gratuit ?',
  'Yes, all 1,000 levels. No ads, and nothing to buy.':
    'Oui, les 1 000 niveaux. Aucune publicité, et rien à acheter.',
  'Does every puzzle have one solution?': 'Chaque grille a-t-elle une seule solution ?',
  'Light, easy, medium and hard do, so every one of them can be reasoned out without guessing. Extreme boards can have more than one valid answer. Whichever you find, if it follows the rules it wins.':
    'Très facile, Facile, Moyen et Difficile, oui : chacune se déduit sans deviner. Les grilles Extrême peuvent avoir plusieurs solutions valables. Quelle que soit celle que vous trouvez, si elle respecte les règles, elle gagne.',
  'Can I play on a phone?': 'Puis-je jouer sur un téléphone ?',
  'Yes. The small boards fit a phone screen comfortably. For 10x10 and 15x15 turn the phone sideways, or use a tablet, since 225 cells need the room.':
    'Oui. Les petites grilles tiennent sans peine sur un écran de téléphone. Pour le 10x10 et le 15x15, tournez le téléphone à l’horizontale ou prenez une tablette : 225 cases ont besoin de place.',
  // -------------------------------------------------------------------------------------------
  // `/how-to-solve` — the clearest search intent on the site. "résoudre star battle" and
  // "bataille d'étoiles technique" are both things people type.
  // -------------------------------------------------------------------------------------------
  'How to solve Star Battle puzzles': 'Résoudre Star Battle : six techniques',
  'None of this is specific to CowField. It is how Star Battle works, so it carries over to any board you meet, under any of the names the puzzle goes by. Roughly in the order the moves tend to come up.':
    'Rien de tout cela n’est propre à CowField. C’est le fonctionnement de la Bataille d’étoiles, donc cela vaut pour n’importe quelle grille que vous croiserez, sous n’importe lequel de ses noms. À peu près dans l’ordre où les coups se présentent.',
  'Fence off every bull you place': 'Clôturez chaque taureau que vous posez',
  'The moment a bull goes down, the eight cells around it are dead. Dot them. Those dots are what the next three techniques read. Turn on auto-place dots in Settings and the game does it for you.':
    'Dès qu’un taureau est posé, les huit cases autour de lui sont mortes. Mettez-y des points. Ce sont précisément ces points que lisent les trois techniques suivantes. Activez « Points automatiques » dans les Réglages et le jeu le fait pour vous.',
  'A pen trapped in one row finishes that row': 'Un enclos coincé dans une ligne règle la ligne',
  'If a whole pen sits inside a single row, that pen has to spend its bulls in that row, and the row has no quota left for anyone else. Every other cell in the row is dead. The same works for columns, and it works with the pen only mostly contained too: what matters is where its empty cells are, not its full shape.':
    'Si un enclos entier tient dans une seule ligne, il doit y dépenser ses taureaux, et la ligne n’a plus de place pour personne d’autre. Toutes les autres cases de la ligne sont mortes. Cela marche pareil pour les colonnes, et cela marche aussi quand l’enclos n’y tient qu’en grande partie : ce qui compte, c’est où sont ses cases libres, pas sa forme entière.',
  'Count pens against rows': 'Comptez les enclos contre les lignes',
  'The strongest move in the game, and the one people miss. If three pens fit entirely inside three rows, those three rows are spoken for: every cell in them belonging to a fourth pen is dead. It reads backwards as well. If three rows only ever touch three pens, those pens are used up and cannot appear anywhere else on the board.':
    'Le coup le plus fort du jeu, et celui que l’on rate. Si trois enclos tiennent entièrement dans trois lignes, ces trois lignes sont prises : chaque case qui y appartient à un quatrième enclos est morte. Cela se lit aussi à l’envers. Si trois lignes ne touchent que trois enclos, ces enclos sont épuisés et ne peuvent apparaître nulle part ailleurs sur la grille.',
  'Watch where a pen has room left': 'Regardez où un enclos a encore de la place',
  'A pen spread across five rows is not free if its remaining cells only sit in two of them. Needing two bulls in two rows claims both. On the two and three bull boards this is most of the work, because a pen with three bulls and barely enough room is almost solved already.':
    'Un enclos étalé sur cinq lignes n’est pas libre si ses cases restantes ne sont que dans deux d’entre elles. Deux taureaux à caser dans deux lignes les réservent toutes les deux. Sur les grilles à deux et trois taureaux, c’est l’essentiel du travail, car un enclos qui doit placer trois taureaux avec tout juste la place est déjà presque résolu.',
  'Start where the choices are fewest': 'Commencez là où il y a le moins de choix',
  'Small pens, corners and edges. A three-cell pen on a one-bull board offers three options; a twenty-cell pen offers twenty. Corners have fewer neighbours to rule out, so a bull placed there costs the board less. Open in the cramped part and the loose part solves itself later.':
    'Les petits enclos, les coins et les bords. Un enclos de trois cases sur une grille à un taureau offre trois possibilités, un enclos de vingt cases en offre vingt. Les coins ont moins de voisins à écarter, un taureau posé là coûte donc moins cher à la grille. Ouvrez par la partie serrée, la partie lâche se résoudra d’elle-même plus tard.',
  'When nothing moves, assume one and follow it': 'Quand rien ne bouge, supposez et suivez',
  'Take a pen with two options left, pick one, and push the consequences until something breaks. If it breaks, the cell you picked is dead and you have learned something real. Place actual bulls while you do this rather than working it out in your head: an illegal one lights up the instant it lands, so the board tells you where the chain failed.':
    'Prenez un enclos où il reste deux possibilités, choisissez-en une et poussez les conséquences jusqu’à ce que quelque chose casse. Si ça casse, la case choisie est morte et vous avez appris quelque chose de réel. Posez de vrais taureaux pendant que vous faites cela plutôt que de le calculer de tête : un taureau interdit s’allume à l’instant où il se pose, et la grille vous dit ainsi où la chaîne a lâché.',
  'Go and try one': 'Essayez-en une',

  // -------------------------------------------------------------------------------------------
  // `/difficulties` — the long tail: "star battle 10x10", "star battle 2 étoiles", "15x15". Also
  // the honest place to say that extreme trades uniqueness for existing at all.
  // -------------------------------------------------------------------------------------------
  'Board sizes': 'Tailles de grille',
  'Star Battle board sizes and difficulty': 'Star Battle : tailles et difficulté',
  'Five sizes, 200 levels each. Level 1 of light and level 173 of extreme are both one click away.':
    'Cinq tailles, 200 niveaux chacune. Le niveau 1 en Très facile et le niveau 173 en Extrême sont tous les deux à un clic.',
  '200 levels': '200 niveaux',
  '6x6 board, one bull per row, column and pen.':
    'Grille 6x6, un taureau par ligne, colonne et enclos.',
  '8x8 board, one bull per row, column and pen.':
    'Grille 8x8, un taureau par ligne, colonne et enclos.',
  '10x10 board, one bull per row, column and pen.':
    'Grille 10x10, un taureau par ligne, colonne et enclos.',
  '10x10 board, two bulls per row, column and pen.':
    'Grille 10x10, deux taureaux par ligne, colonne et enclos.',
  '15x15 board, three bulls per row, column and pen.':
    'Grille 15x15, trois taureaux par ligne, colonne et enclos.',
  'Where to start. Small enough to hold the whole board in your head while you work out what the dots do.':
    'Par où commencer. Assez petite pour garder toute la grille en tête pendant que vous découvrez à quoi servent les points.',
  'The same puzzle with more room to be wrong in. Rows stop being obvious and you start leaning on the pens.':
    'Le même casse-tête avec plus de place pour se tromper. Les lignes cessent d’être évidentes et vous commencez à vous appuyer sur les enclos.',
  'The size most Star Battle puzzles come in. If you have played this elsewhere, start here and it will feel familiar.':
    'La taille la plus courante des grilles Star Battle. Si vous y avez joué ailleurs, commencez ici, vous serez en terrain connu.',
  'What most people mean by Two Not Touch. With two bulls per row, finding one bull no longer finishes the row.':
    'Ce que l’on appelle les Deux étoiles. Avec deux taureaux par ligne, en trouver un ne règle plus la ligne.',
  '225 cells, 15 pens, 45 bulls. Expect to sit with one of these. They are also the boards that can have more than one valid answer.':
    '225 cases, 15 enclos, 45 taureaux. Prévoyez d’y passer un moment. Ce sont aussi les grilles qui peuvent avoir plusieurs solutions valables.',
  'What changes when the star count goes up': 'Ce qui change quand le nombre d’étoiles monte',
  "A 6x6 board and a 10x10 board ask for the same work, just more of it. One bull per row and two bulls per row ask different questions. With one, finding a row's bull retires the row. With two, it tells you almost nothing on its own, because the second is still out there and the no-touching rule is all that holds it. That is the step from medium to hard, and again from hard to extreme.":
    'Une grille 6x6 et une grille 10x10 demandent le même travail, juste en plus grande quantité. Un taureau par ligne et deux taureaux par ligne posent des questions différentes. Avec un seul, trouver le taureau d’une ligne règle la ligne. Avec deux, cela ne dit presque rien à soi seul, puisque le second reste à placer et que seule la règle de non-contact le retient. C’est le pas de Moyen à Difficile, et de nouveau de Difficile à Extrême.',

  // -------------------------------------------------------------------------------------------
  // `/about-project` — who built this. The only page whose job is a **name** rather than a query.
  // -------------------------------------------------------------------------------------------
  'About the project': 'À propos du projet',
  'CowField is a side project by Volodymyr Mykhailiuk, a Star Battle puzzle built solo to try out new tools and to have one finished thing worth showing.':
    'CowField est un projet perso de Volodymyr Mykhailiuk, un casse-tête Star Battle fait en solo pour tester de nouveaux outils et avoir une chose finie à montrer.',
  'CowField is a personal project. I am Volodymyr Mykhailiuk, and I built it on my own, front to back.':
    'CowField est un projet personnel. Je m’appelle Volodymyr Mykhailiuk, et je l’ai construit seul, du front au back.',
  'Why a puzzle game': 'Pourquoi un jeu de réflexion',
  'A todo list would have been quicker. I play these puzzles, and the part I actually wanted to understand was how the boards get made. Whether a generator can be trusted to produce one with a single answer, and what checking that costs. Most of that question lives on the server, so building it was a way to get properly better at backend work. The front end got the rest of the attention, most of it spent calibrating things nobody is meant to notice.':
    'Une liste de tâches aurait été plus rapide. Je joue à ces casse-tête, et ce que je voulais vraiment comprendre, c’est comment les grilles sont fabriquées. Si l’on peut faire confiance à un générateur pour en produire une avec une seule solution, et ce que coûte cette vérification. L’essentiel de cette question vit sur le serveur, donc le construire était une façon de devenir vraiment meilleur en back-end. Le reste de l’attention est allé au front, en grande partie à calibrer des choses que personne n’est censé remarquer.',
  'Something finished, not a demo': 'Quelque chose de fini, pas une démo',
  'I wanted one thing I could point at. A game a stranger can open and play without being told what it is, with everything a real product needs somewhere inside it, including the dull parts.':
    'Je voulais une chose que je puisse montrer du doigt. Un jeu qu’un inconnu peut ouvrir et jouer sans qu’on lui explique ce que c’est, et dans lequel se trouve, quelque part, tout ce dont un vrai produit a besoin, y compris les parties ennuyeuses.',
  'Built alone, on purpose': 'Construit seul, volontairement',
  'Working solo means every part is mine. The board rules, the generator and the solver, the API, the database schema, the layout, the copy, and both languages. There is nobody to hand the half I am worse at.':
    'Travailler seul veut dire que chaque partie est la mienne. Les règles de la grille, le générateur et le solveur, l’API, le schéma de base de données, la mise en page, les textes et toutes les langues. Il n’y a personne à qui confier la moitié où je suis moins bon.',
  'A place to try things': 'Un endroit pour essayer des choses',
  'Small libraries I would otherwise never have a reason to install get tried out here, and a few of them I ended up writing myself once I had seen what they cost. The QR code in the share dialog is about 450 lines of Reed-Solomon and bit placement, with no dependency behind it.':
    'Les petites bibliothèques que je n’aurais jamais de raison d’installer ailleurs, je les essaie ici, et quelques-unes, j’ai fini par les écrire moi-même une fois que j’avais vu ce qu’elles coûtaient. Le QR code de la fenêtre de partage, c’est environ 450 lignes de Reed-Solomon et de placement de bits, sans aucune dépendance derrière.',
  'Learning the newer tooling': 'Apprendre les outils récents',
  'The other thing I practise here is working well with the newer tools that sit alongside the editor. Getting something genuinely useful out of them is a skill of its own, and it only develops on a real project, where a bad decision has to be lived with for weeks.':
    'L’autre chose que je travaille ici, c’est bien me servir des outils récents qui accompagnent l’éditeur. En tirer quelque chose de vraiment utile est une compétence à part entière, et elle ne se développe que sur un vrai projet, où il faut vivre des semaines avec une mauvaise décision.',
  'Getting in touch': 'Me contacter',
  'Or find me on Telegram as': 'Ou retrouvez-moi sur Telegram sous',
  // Split around the address, which is not a translatable string and is rendered as a `mailto:`.
  'If any of this is worth a message, mine is': 'Si tout cela vaut un message, mon adresse est',
  '. Work, questions about how something here is built, or a bug you hit on level 143.':
    '. Travail, questions sur la façon dont quelque chose est fait ici, ou un bug croisé au niveau 143.',
  'What it is built with': 'Avec quoi c’est construit',
  'React, TypeScript and Vite in the browser. Express, Prisma and Postgres behind it. The board rules, the generator and the solver sit in one shared folder that both sides import, so the browser and the server can never disagree about what a legal board is. The site runs on Vercel and the API on Render.':
    'React, TypeScript et Vite dans le navigateur. Express, Prisma et Postgres derrière. Les règles de la grille, le générateur et le solveur tiennent dans un dossier commun que les deux côtés importent, pour que le navigateur et le serveur ne puissent jamais être en désaccord sur ce qu’est une grille valide. Le site tourne sur Vercel et l’API sur Render.',

  'Adjust your preferences here.': 'Ajustez vos préférences ici.',
  'Sound effects': 'Effets sonores',
  'Enable sound effects.': 'Activer les effets sonores.',
  Music: 'Musique',
  'Enable background music during play.': 'Activer la musique de fond pendant la partie.',
  'Dark mode': 'Mode sombre',
  'Switch to dark colours for playing in low light.':
    'Passer aux couleurs sombres, pour jouer dans la pénombre.',
  'Choose the language used across the game.': 'Choisissez la langue utilisée dans tout le jeu.',
  'Switch to dark mode': 'Passer en mode sombre',
  'Switch to light mode': 'Passer en mode clair',
  'Take your time': 'Prenez votre temps',
  'Hide the timers so nothing on screen is counting.':
    'Masquer les chronos pour que rien ne compte à l’écran.',
  'Auto-place dots': 'Points automatiques',
  'Ring each bull with dots the moment you place it.':
    'Entourer chaque taureau de points dès que vous le posez.',
  'Player statistics': 'Statistiques du joueur',
  'Most progress': 'Meilleure progression',
  'No data': 'Aucune donnée',
  'Completed levels': 'Niveaux terminés',
  'Placed bulls': 'Taureaux posés',
  'Total completion time': 'Temps total',
  'Performance breakdown by difficulty:': 'Détail par difficulté :',
  Difficulty: 'Difficulté',
  'Fastest level': 'Niveau le plus rapide',
  'Average per level': 'Moyenne par niveau',
  'No completed level': 'Aucun niveau terminé',
  // i18next picks the `_one` / `_other` variant from `count` and falls back to the bare key, which
  // is kept so the string still resolves if a variant is ever missing. French reaches the same two
  // categories as English on whole numbers, with 0 counting as singular.
  '{{count}} completed levels': '{{count}} niveaux terminés',
  '{{count}} completed levels_one': '{{count}} niveau terminé',
  '{{count}} completed levels_other': '{{count}} niveaux terminés',
  'The requested level route is invalid.': 'L’adresse de niveau demandée n’est pas valide.',
  'This level does not exist yet.': 'Ce niveau n’existe pas encore.',
  'Create level': 'Créer un niveau',
  'Edit level': 'Modifier le niveau',
  'Remaining bulls': 'Taureaux restants',
  Timer: 'Chrono',
  Back: 'Retour',
  'Failed to load level data.': 'Les données du niveau n’ont pas pu être chargées.',
  'Admin role is required to create or edit levels.':
    'Le rôle admin est nécessaire pour créer ou modifier des niveaux.',
  'Fix those problems and try again.': 'Corrigez ces problèmes et réessayez.',
  // The editor's validation issues. `shared/game/validation.ts` hands back a code and its numbers
  // instead of a sentence, and `translateValidationIssue` chooses the wording — which is what lets
  // a French admin read these at all. French reaches the same two plural categories as English on
  // whole numbers.
  'Add a level title.': 'Donnez un titre au niveau.',
  'Grid size must stay {{size}} x {{size}} for {{difficulty}}.':
    'La taille de la grille doit rester {{size}} x {{size}} pour {{difficulty}}.',
  'The pen grid is incomplete.': 'La grille des enclos est incomplète.',
  'The authored bull layout is incomplete.': 'La disposition des taureaux est incomplète.',
  'Every cell must belong to a pen.': 'Chaque case doit appartenir à un enclos.',
  'A {{size}} x {{size}} level must use exactly {{size}} pens.':
    'Un niveau {{size}} x {{size}} doit utiliser exactement {{size}} enclos.',
  'Pen {{penId}} is too small for {{count}} bull placements.':
    'L’enclos {{penId}} est trop petit pour {{count}} taureaux.',
  'Pen {{penId}} is too small for {{count}} bull placements._one':
    'L’enclos {{penId}} est trop petit pour {{count}} taureau.',
  'Pen {{penId}} is too small for {{count}} bull placements._other':
    'L’enclos {{penId}} est trop petit pour {{count}} taureaux.',
  'Pen {{penId}} must be one connected region.':
    'L’enclos {{penId}} doit former une seule zone d’un seul tenant.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.':
    'La disposition doit placer exactement {{count}} taureaux pour {{difficulty}}.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._one':
    'La disposition doit placer exactement {{count}} taureau pour {{difficulty}}.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._other':
    'La disposition doit placer exactement {{count}} taureaux pour {{difficulty}}.',
  'Each row must contain exactly {{count}} bulls.':
    'Chaque ligne doit contenir exactement {{count}} taureaux.',
  'Each row must contain exactly {{count}} bulls._one':
    'Chaque ligne doit contenir exactement {{count}} taureau.',
  'Each row must contain exactly {{count}} bulls._other':
    'Chaque ligne doit contenir exactement {{count}} taureaux.',
  'Each column must contain exactly {{count}} bulls.':
    'Chaque colonne doit contenir exactement {{count}} taureaux.',
  'Each column must contain exactly {{count}} bulls._one':
    'Chaque colonne doit contenir exactement {{count}} taureau.',
  'Each column must contain exactly {{count}} bulls._other':
    'Chaque colonne doit contenir exactement {{count}} taureaux.',
  'Pen {{penId}} must contain exactly {{count}} bulls.':
    'L’enclos {{penId}} doit contenir exactement {{count}} taureaux.',
  'Pen {{penId}} must contain exactly {{count}} bulls._one':
    'L’enclos {{penId}} doit contenir exactement {{count}} taureau.',
  'Pen {{penId}} must contain exactly {{count}} bulls._other':
    'L’enclos {{penId}} doit contenir exactement {{count}} taureaux.',
  'Bulls may not touch, including diagonally.':
    'Les taureaux ne peuvent pas se toucher, même en diagonale.',
  'This level has no valid solution.': 'Ce niveau n’a aucune solution valable.',
  'Level saved': 'Niveau enregistré',
  'Failed to save level.': 'Le niveau n’a pas pu être enregistré.',
  'Failed to delete level.': 'Le niveau n’a pas pu être supprimé.',
  'Deleting...': 'Suppression…',
  'Delete level': 'Supprimer le niveau',
  'Discard unsaved changes?': 'Abandonner les modifications non enregistrées ?',
  'This level has unsaved changes. Leaving now discards them.':
    'Ce niveau a des modifications non enregistrées. Partir maintenant les abandonne.',
  'This level has unsaved changes. This action replaces the board and discards them.':
    'Ce niveau a des modifications non enregistrées. Cette action remplace la grille et les abandonne.',
  'Leave and discard': 'Partir et abandonner',
  Discard: 'Abandonner',
  'Delete level?': 'Supprimer le niveau ?',
  'Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.':
    'Supprimer le niveau {{levelNumber}} en {{difficulty}} ? Cela retire le fichier du projet.',
  'Board cleared': 'Grille vidée',
  'Validation passed': 'Vérification réussie',
  'Exactly one solution.': 'Exactement une solution.',
  'This level has more than one solution.': 'Ce niveau a plus d’une solution.',
  'Found {{count}} solutions. A good level has exactly one.':
    '{{count}} solutions trouvées. Un bon niveau en a exactement une.',
  'Found {{count}} solutions. A good level has exactly one._one':
    '{{count}} solution trouvée. Un bon niveau en a exactement une.',
  'Found {{count}} solutions. A good level has exactly one._other':
    '{{count}} solutions trouvées. Un bon niveau en a exactement une.',
  // "N+" reads as plural at every count, including one, so both variants are the plural wording —
  // the same choice `en.ts` and `de.ts` make. They are still spelled out: without them i18next
  // resolves `_one` to the bare key, and a reader cannot tell a deliberate choice from a forgotten
  // one.
  'Found {{count}}+ solutions. A good level has exactly one.':
    '{{count}}+ solutions trouvées. Un bon niveau en a exactement une.',
  'Found {{count}}+ solutions. A good level has exactly one._one':
    '{{count}}+ solutions trouvées. Un bon niveau en a exactement une.',
  'Found {{count}}+ solutions. A good level has exactly one._other':
    '{{count}}+ solutions trouvées. Un bon niveau en a exactement une.',
  'Generate builds a level with exactly one solution.':
    'Générer construit un niveau avec exactement une solution.',
  'Generation ran out of time. Try again.':
    'La génération a manqué de temps. Réessayez.',
  'The generator searches for a board with exactly one solution, which takes longer on medium and hard.':
    'Le générateur cherche une grille avec exactement une solution, ce qui prend plus de temps en Moyen et en Difficile.',
  'Nothing on the board was changed, so you can run Generate again.':
    'Rien n’a changé sur la grille, vous pouvez donc relancer Générer.',
  'Level generated': 'Niveau généré',
  'Generating...': 'Génération…',
  'Create/Edit Level': 'Créer / modifier un niveau',
  Generate: 'Générer',
  'Validate level': 'Vérifier le niveau',
  'Validating...': 'Vérification…',
  'Save level': 'Enregistrer le niveau',
  'Clear board': 'Vider la grille',
  'Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.':
    'Choisissez une couleur, puis cliquez sur des cases pour les attribuer à cette zone. Chaque case doit appartenir à une couleur avant que le niveau puisse être enregistré, et des vaches doivent être placées dans chaque couleur. Cette grille a besoin d’exactement {{gridSize}} couleurs d’un seul tenant et de {{requiredCowCount}} vaches.',
  'Color palette': 'Palette de couleurs',
  Erase: 'Effacer',
  Cow: 'Vache',
  'Color {{colorId}}': 'Couleur {{colorId}}',
  'Level color editor': 'Éditeur de couleurs du niveau',
  Profile: 'Profil',
  Guest: 'Invité',
  User: 'Utilisateur',
  'Preview role': 'Rôle d’aperçu',
  'Log out': 'Se déconnecter',
  Login: 'Connexion',
  'Sign in with your email and password, create an account, or continue as a guest.':
    'Connectez-vous avec votre e-mail et votre mot de passe, créez un compte, ou continuez en invité.',
  Email: 'E-mail',
  Password: 'Mot de passe',
  'Log in': 'Se connecter',
  'Continue with Google': 'Continuer avec Google',
  'Completing Google login...': 'Finalisation de la connexion Google…',
  'Verifying your email...': 'Vérification de votre e-mail…',
  'Play as guest': 'Jouer en invité',
  // -------------------------------------------------------------------------------------------
  // P18 — the level gate, sharing, and the guest-to-account handover.
  // -------------------------------------------------------------------------------------------
  'Ready when you are': 'Prêt quand vous l’êtes',
  'Play right away without an account, or make one so your times follow you between devices.':
    'Jouez tout de suite sans compte, ou créez-en un pour que vos temps vous suivent d’un appareil à l’autre.',
  Share: 'Partager',
  'Play this Star Battle level on CowField': 'Jouez à ce niveau Star Battle sur CowField',
  'Link copied.': 'Lien copié.',
  "Couldn't share this level.": 'Ce niveau n’a pas pu être partagé.',
  'Sign in': 'Se connecter',
  'Your guest progress stays here': 'Votre progression d’invité reste ici',
  // `{{count}}` does not appear in the singular on purpose: "le 1 niveau" is not a sentence anyone
  // writes. i18next picks the form, and each form is allowed its own wording.
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._one':
    'Vous connecter laisse ici le niveau que vous avez terminé en invité sur cet appareil. Créez plutôt un compte et il vous suivra.',
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._other':
    'Vous connecter laisse ici les {{count}} niveaux que vous avez terminés en invité sur cet appareil. Créez plutôt un compte et ils vous suivront.',
  'Sign in anyway': 'Se connecter quand même',
  'Statistics is available only for logged users.':
    'Les statistiques ne sont accessibles qu’aux utilisateurs connectés.',
  'Create account': 'Créer un compte',
  'Forgot password?': 'Mot de passe oublié ?',
  'Passwords do not match.': 'Les mots de passe ne correspondent pas.',
  'Request failed.': 'La requête a échoué.',
  'Create a user account with your email and password.':
    'Créez un compte avec votre e-mail et un mot de passe.',
  'Confirm password': 'Confirmer le mot de passe',
  'Back to login': 'Retour à la connexion',
  'Reset password': 'Réinitialiser le mot de passe',
  'Enter your email and we will send you a password reset link.':
    'Saisissez votre e-mail et nous vous enverrons un lien de réinitialisation.',
  'If the account exists, a reset link has been sent to that email address.':
    'Si le compte existe, un lien de réinitialisation a été envoyé à cette adresse.',
  'Send reset link': 'Envoyer le lien',
  'I already have a reset link': 'J’ai déjà un lien',
  'Your password has been updated.': 'Votre mot de passe a été mis à jour.',
  'Open the reset link from your email and choose a new password.':
    'Ouvrez le lien reçu par e-mail et choisissez un nouveau mot de passe.',
  'Reset token': 'Jeton de réinitialisation',
  'New password': 'Nouveau mot de passe',
  'Save new password': 'Enregistrer le nouveau mot de passe',
  'Account created. Check your email to verify it before logging in.':
    'Compte créé. Vérifiez votre e-mail pour le confirmer avant de vous connecter.',
  'Verification email sent again.': 'E-mail de confirmation renvoyé.',
  'Resend verification email': 'Renvoyer l’e-mail de confirmation',
  'Show password': 'Afficher le mot de passe',
  'Hide password': 'Masquer le mot de passe',
  'You are playing as a Guest.': 'Vous jouez en invité.',
  'This browser is blocking saved data, so these choices will reset when you close the tab.':
    'Ce navigateur bloque les données enregistrées, ces choix seront donc perdus à la fermeture de l’onglet.',
  'Incorrect email or password.': 'E-mail ou mot de passe incorrect.',
  'Too many requests. Try again in a moment.':
    'Trop de requêtes. Réessayez dans un instant.',
  'Too many attempts. Wait a few minutes and try again.':
    'Trop de tentatives. Attendez quelques minutes et réessayez.',
  'Guests cannot access this resource.': 'Les invités n’ont pas accès à cette ressource.',
  // Neon Auth's own raw error text. The browser signs in against Neon directly, so these strings
  // reach `translateAuthMessage` verbatim — without a key here they render as English for everyone.
  'Invalid email or password': 'E-mail ou mot de passe incorrect.',
  'User already exists': 'Un compte existe déjà avec cet e-mail.',
  'Email not verified': 'E-mail non confirmé.',
  // The reset-password endpoint's codes, same idea. Anything not listed here — "User not found" on
  // a forgotten-password request, for one, which would otherwise tell a stranger which addresses
  // have accounts — falls through to the caller's generic message instead of being shown.
  'Invalid token': 'Ce lien n’est plus valable. Demandez-en un nouveau.',
  'Password too short': 'Ce mot de passe est trop court. Utilisez au moins 8 caractères.',
  'Password too long': 'Ce mot de passe est trop long.',
  'Failed to restore session after login.':
    'La session n’a pas pu être rétablie après la connexion.',
  'Google login failed.': 'La connexion Google a échoué.',
  // Shown instead of `?error=` when the address bar carries something we do not ship a string for.
  // Everything above is the allowlist `translateKnownAuthMessage` checks against.
  'Sign-in failed. Try again.': 'La connexion a échoué. Réessayez.',
  // The other generic fallbacks, one per form, so a failure at least says which thing failed.
  "Couldn't create your account. Try again.":
    'Votre compte n’a pas pu être créé. Réessayez.',
  "Couldn't send the reset link. Try again.":
    'Le lien de réinitialisation n’a pas pu être envoyé. Réessayez.',
  "Couldn't update your password. Try again.":
    'Votre mot de passe n’a pas pu être modifié. Réessayez.',
  'What is CowField?': 'Qu’est-ce que CowField ?',
  'Back to your levels': 'Retour à vos niveaux',
  'Email verification failed.': 'La confirmation de l’e-mail a échoué.',
  'Your email is verified. You can log in now.':
    'Votre e-mail est confirmé. Vous pouvez vous connecter.',
  'Neon Auth is not configured.': 'Neon Auth n’est pas configuré.',
  'Invalid request payload.': 'Données de requête invalides.',
  'Level complete': 'Niveau terminé',
  'Best time: {{time}}': 'Meilleur temps : {{time}}',
  'New best time.': 'Nouveau meilleur temps.',
  "Couldn't save your progress. Check your connection and try again.":
    'Votre progression n’a pas pu être enregistrée. Vérifiez votre connexion et réessayez.',
  'Try again': 'Réessayer',
  'You completed the last available level.': 'Vous avez terminé le dernier niveau disponible.',
  'Your progress has been saved.': 'Votre progression a été enregistrée.',
  'Saving your progress...': 'Enregistrement de votre progression…',

  // Error boundaries and failed page loads.
  'Something went wrong. Reloading the page usually fixes it.':
    'Quelque chose s’est mal passé. Recharger la page suffit en général.',
  'Reload the page': 'Recharger la page',
  "Couldn't load your progress. Check your connection and try again.":
    'Votre progression n’a pas pu être chargée. Vérifiez votre connexion et réessayez.',
  "Couldn't load these levels. Check your connection and try again.":
    'Ces niveaux n’ont pas pu être chargés. Vérifiez votre connexion et réessayez.',
  "Couldn't load your statistics. Check your connection and try again.":
    'Vos statistiques n’ont pas pu être chargées. Vérifiez votre connexion et réessayez.',
  "Couldn't load this level. Check your connection and try again.":
    'Ce niveau n’a pas pu être chargé. Vérifiez votre connexion et réessayez.',
} as const

export default fr
