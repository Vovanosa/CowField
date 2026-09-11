const en = {
  CowField: 'CowField',

  // ---------------------------------------------------------------------------------------------
  // The landing page (P14 item 84) — the only page a stranger, or a crawler, can read.
  //
  // This block is deliberately prose rather than labels: it is the site's entire indexable content.
  // Before it existed, every URL rendered the login form and the whole site was 31 words.
  //
  // **Rewritten 2026-09-11 (P17).** The first version read as generated text: eighteen em-dashes in
  // this file, "calm" six times, "quiet" four, and three paragraphs that closed on a flourish. It
  // also led with a brand nobody searches for. The rules this copy is held to now:
  //   - no em-dashes in prose, only in title separators
  //   - contractions, and sentences of uneven length
  //   - a fact instead of a feeling — never "calm", say what makes it calm
  //   - no closing flourish; end on something useful
  //   - say the weak part out loud (extreme boards can have several answers)
  // The genre words still matter most: nobody searches "CowField", they search "Star Battle",
  // "Two Not Touch" and "star battle online".
  // ---------------------------------------------------------------------------------------------
  'Star Battle, with cows': 'Star Battle, with cows',
  'Play Star Battle online, free - CowField': 'Play Star Battle online, free - CowField',
  'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.':
    'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.',
  'A grid of coloured pens. Every row, every column and every pen needs the same number of bulls, and no two bulls may touch, not even at a corner. That is the whole game. If you have played Star Battle or Two Not Touch before, you already know it.':
    "A grid of coloured pens. Every row, every column and every pen needs the same number of bulls, and no two bulls may touch, not even at a corner. That's the whole game. If you've played Star Battle or Two Not Touch before, you already know it.",
  'Play now': 'Play now',
  'Starting...': 'Starting...',
  'Sign in to save your progress': 'Sign in to save your progress',
  "You don't need an account. Click play and you're on a board.":
    "You don't need an account. Click play and you're on a board.",
  'The server is waking up. First visit of the day takes a few seconds.':
    'The server is waking up. First visit of the day takes a few seconds.',
  "Couldn't start a game. Check your connection and try again.":
    "Couldn't start a game. Check your connection and try again.",
  'How to play': 'How to play',
  'Every row, column and pen gets the same number of bulls. One on the small boards, three on the biggest.':
    'Every row, column and pen gets the same number of bulls. One on the small boards, three on the biggest.',
  'Two bulls can never touch, including diagonally at a corner.':
    'Two bulls can never touch, including diagonally at a corner.',
  "Dots are your own notes. They don't count as bulls.":
    "Dots are your own notes. They don't count as bulls.",
  'Read the full rules': 'Read the full rules',
  'Solving techniques': 'Solving techniques',
  'No timer unless you want one': 'No timer unless you want one',
  'There is a clock if you want to race yourself, and a setting that hides it. Put a bull somewhere it breaks a rule and it lights up immediately, so you can try an idea and watch what happens. It will not tell you what is correct, only what is illegal. The solving is left to you.':
    "There's a clock if you want to race yourself, and a setting that hides it. Put a bull somewhere it breaks a rule and it lights up immediately, so you can try an idea and watch what happens. It won't tell you what's correct, only what's illegal. The solving is left to you.",
  '1,000 levels, five board sizes': '1,000 levels, five board sizes',
  'Two hundred levels in each of five difficulties. Light is 6x6 with one bull per row, column and pen. Easy is 8x8, medium is 10x10, and hard is 10x10 with two. Extreme is 15x15 with three, which is a different puzzle rather than a bigger one.':
    'Two hundred levels in each of five difficulties. Light is 6x6 with one bull per row, column and pen. Easy is 8x8, medium is 10x10, and hard is 10x10 with two. Extreme is 15x15 with three, which is a different puzzle rather than a bigger one.',
  'Every board is generated and then solved again to check it. Light through hard have exactly one answer, so they can always be reasoned out. Extreme boards can have a few, which is the honest trade for having 15x15 boards at all. Any arrangement that follows the rules counts as a win.':
    'Every board is generated and then solved again to check it. Light through hard have exactly one answer, so they can always be reasoned out. Extreme boards can have a few, which is the honest trade for having 15x15 boards at all. Any arrangement that follows the rules counts as a win.',
  '1,000 levels': '1,000 levels',
  'Five difficulties': 'Five difficulties',
  'Up to 15x15': 'Up to 15x15',
  'No sign-up': 'No sign-up',
  'A CowField board: coloured pens with bulls and dot notes placed on them.':
    'A CowField board: coloured pens with bulls and dot notes placed on them.',

  // The not-found view, which replaced a silent redirect to `/`.
  'Page not found': 'Page not found',
  'That link does not lead anywhere.': 'That link does not lead anywhere.',
  'Back to the start': 'Back to the start',

  // Page descriptions — `<meta name="description">`, so ~150-160 characters each. Only the four
  // public pages genuinely need one; the rest are `noindex` and carry a title alone.
  'The rules of Star Battle, also called Two Not Touch: the same number of bulls in every row, column and region, and no two touching. Plus what the dots do.':
    'The rules of Star Battle, also called Two Not Touch: the same number of bulls in every row, column and region, and no two touching. Plus what the dots do.',
  'Six techniques for solving Star Battle and Two Not Touch puzzles: fencing off bulls, pens trapped in a row, counting pens against rows, and what to do when stuck.':
    'Six techniques for solving Star Battle and Two Not Touch puzzles: fencing off bulls, pens trapped in a row, counting pens against rows, and what to do when stuck.',
  'What changes between a 6x6 one-bull Star Battle board and a 15x15 three-bull one, how many levels each size has, and which difficulty to start with.':
    'What changes between a 6x6 one-bull Star Battle board and a 15x15 three-bull one, how many levels each size has, and which difficulty to start with.',
  'Loading...': 'Loading...',
  Hidden: 'Hidden',
  'Back to home': 'Back to home',
  'Back to the rules': 'Back to the rules',
  'Back to levels': 'Back to levels',
  'Back to all difficulties': 'Back to all difficulties',
  Restart: 'Restart',
  'Next Level': 'Next Level',
  Cancel: 'Cancel',
  Save: 'Save',
  Delete: 'Delete',
  Role: 'Role',
  Player: 'Player',
  Admin: 'Admin',
  Volume: 'Volume',
  Language: 'Language',
  Undo: 'Undo',
  Home: 'Home',
  'Level {{levelNumber}}': 'Level {{levelNumber}}',
  Light: 'Light',
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
  Extreme: 'Extreme',
  'Home menu': 'Home menu',
  'Site links': 'Site links',
  'Puzzle board': 'Puzzle board',
  // Cell names. Every one of these describes something conveyed only visually today — the pen by
  // its colour, the mark by an `aria-hidden` icon, the rule break by an animation.
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}':
    'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}',
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}. Breaks a rule.':
    'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}. Breaks a rule.',
  'Row {{row}}, column {{column}}': 'Row {{row}}, column {{column}}',
  'Pen {{pen}}': 'Pen {{pen}}',
  'No pen': 'No pen',
  'This board is cramped on a screen this size.':
    'This board is cramped on a screen this size.',
  'Turning your phone sideways gives it more room.':
    'Turning your phone sideways gives it more room.',
  'Light levels are a better fit for narrow screens.':
    'Light levels are a better fit for narrow screens.',
  Dismiss: 'Dismiss',
  Play: 'Play',
  About: 'About',
  Statistics: 'Statistics',
  Settings: 'Settings',
  // -------------------------------------------------------------------------------------------
  // `/levels` and `/levels/:difficulty` — public and indexable since P18 (D-1). These ten pages
  // (five, twice, once per language) are what the programme actually asks Google to rank, so the
  // headings spend their words on what people type rather than on what the app calls things.
  // The per-difficulty copy lives in `pages/DifficultyLevelsPage/difficultyPageContent.ts`.
  // -------------------------------------------------------------------------------------------
  'Star Battle puzzles by board size': 'Star Battle puzzles by board size',
  'Choose a difficulty to play.': 'Choose a difficulty to play.',
  '1,000 free Star Battle puzzles across five board sizes, from 6x6 with one star to 15x15 with three. No account needed, and no level is locked.':
    '1,000 free Star Battle puzzles across five board sizes, from 6x6 with one star to 15x15 with three. No account needed, and no level is locked.',
  'Pick a size. Nothing is locked, so any level in any difficulty opens straight away.':
    'Pick a size. Nothing is locked, so any level in any difficulty opens straight away.',
  'What changes between sizes': 'What changes between sizes',
  'Nothing is locked. Any level on this page opens straight away, in any order.':
    'Nothing is locked. Any level on this page opens straight away, in any order.',
  '6x6 Star Battle puzzles, one star per row': '6x6 Star Battle puzzles, one star per row',
  '200 free 6x6 Star Battle puzzles, one star in every row, column and region. The smallest boards on CowField, and the place to work out what the dots do.':
    '200 free 6x6 Star Battle puzzles, one star in every row, column and region. The smallest boards on CowField, and the place to work out what the dots do.',
  'Light is the smallest size here: every board is 6 by 6, with one bull in every row, every column and every pen. If you know this puzzle as Star Battle or Two Not Touch, the stars are bulls and the regions are pens, and nothing else about it changes.':
    'Light is the smallest size here: every board is 6 by 6, with one bull in every row, every column and every pen. If you know this puzzle as Star Battle or Two Not Touch, the stars are bulls and the regions are pens, and nothing else about it changes.',
  'Thirty-six cells is small enough to hold the whole grid in your head, which is what makes this the right place to find out what the dots are for.':
    'Thirty-six cells is small enough to hold the whole grid in your head, which is what makes this the right place to find out what the dots are for.',
  '8x8 Star Battle puzzles, one star per row': '8x8 Star Battle puzzles, one star per row',
  '200 free 8x8 Star Battle puzzles, one star in every row, column and region. A step up from 6x6, with enough room that the obvious rows run out.':
    '200 free 8x8 Star Battle puzzles, one star in every row, column and region. A step up from 6x6, with enough room that the obvious rows run out.',
  'Easy keeps one bull in every row, column and pen, and moves the board to 8 by 8. Same rules as the 6x6 boards, with twenty-eight more cells to be wrong in.':
    'Easy keeps one bull in every row, column and pen, and moves the board to 8 by 8. Same rules as the 6x6 boards, with twenty-eight more cells to be wrong in.',
  'This is the size where counting rows stops being enough on its own and you start leaning on the shape of the pens instead.':
    'This is the size where counting rows stops being enough on its own and you start leaning on the shape of the pens instead.',
  '10x10 Star Battle puzzles, one star per row': '10x10 Star Battle puzzles, one star per row',
  '200 free 10x10 Star Battle puzzles, one star in every row, column and region. The size most Star Battle puzzles come in, and the usual place to start.':
    '200 free 10x10 Star Battle puzzles, one star in every row, column and region. The size most Star Battle puzzles come in, and the usual place to start.',
  'Medium is 10 by 10 with one bull in every row, column and pen. This is the size most Star Battle puzzles come in, so if you have played the game somewhere else it will feel familiar straight away.':
    'Medium is 10 by 10 with one bull in every row, column and pen. This is the size most Star Battle puzzles come in, so if you have played the game somewhere else it will feel familiar straight away.',
  'A hundred cells is enough that guessing stops paying and you have to eliminate properly, which is the part of this puzzle people come back for.':
    'A hundred cells is enough that guessing stops paying and you have to eliminate properly, which is the part of this puzzle people come back for.',
  '10x10 Star Battle puzzles, two stars per row': '10x10 Star Battle puzzles, two stars per row',
  '200 free 10x10 Star Battle puzzles with two stars in every row, column and region. This is what most people mean by Two Not Touch.':
    '200 free 10x10 Star Battle puzzles with two stars in every row, column and region. This is what most people mean by Two Not Touch.',
  'Hard stays at 10 by 10 and puts two bulls in every row, column and pen. That is a different puzzle from the one-bull boards rather than a bigger one, and it is what most people mean by Two Not Touch.':
    'Hard stays at 10 by 10 and puts two bulls in every row, column and pen. That is a different puzzle from the one-bull boards rather than a bigger one, and it is what most people mean by Two Not Touch.',
  'Finding one bull in a row no longer retires the row, because the second is still out there. The rule that no two bulls may touch ends up doing most of the work.':
    'Finding one bull in a row no longer retires the row, because the second is still out there. The rule that no two bulls may touch ends up doing most of the work.',
  '15x15 Star Battle puzzles, three stars per row': '15x15 Star Battle puzzles, three stars per row',
  '200 free 15x15 Star Battle puzzles with three stars in every row, column and region. 225 cells and 45 stars, the hardest boards on CowField.':
    '200 free 15x15 Star Battle puzzles with three stars in every row, column and region. 225 cells and 45 stars, the hardest boards on CowField.',
  'Extreme is 15 by 15 with three bulls in every row, column and pen. That is 225 cells and 45 bulls, and one of these will take a while.':
    'Extreme is 15 by 15 with three bulls in every row, column and pen. That is 225 cells and 45 bulls, and one of these will take a while.',
  'Worth knowing before you start: unlike the smaller sizes, these boards are not checked to have exactly one answer. A few have several, any legal arrangement wins, and you will never be told you found the wrong one.':
    'Worth knowing before you start: unlike the smaller sizes, these boards are not checked to have exactly one answer. A few have several, any legal arrangement wins, and you will never be told you found the wrong one.',
  'Available levels': 'Available levels',
  'Unknown difficulty.': 'Unknown difficulty.',
  'Choose one of the available difficulty groups to browse levels.':
    'Choose one of the available difficulty groups to browse levels.',
  Levels: 'Levels',
  '{{difficulty}} Levels': '{{difficulty}} Levels',
  Previous: 'Previous',
  Next: 'Next',
  'Page {{page}} of {{totalPages}}': 'Page {{page}} of {{totalPages}}',
  '{{completed}} of {{total}} solved': '{{completed}} of {{total}} solved',
  '{{percent}}% done': '{{percent}}% done',
  // For a visitor with no session, where there is nothing to count yet. A plural key even though
  // every difficulty currently holds exactly 200 — see the note in `uk.ts`.
  '{{count}} levels_one': '{{count}} level',
  '{{count}} levels_other': '{{count}} levels',
  'Open level {{levelNumber}}': 'Open level {{levelNumber}}',
  'Edit level {{levelNumber}}': 'Edit level {{levelNumber}}',
  // -------------------------------------------------------------------------------------------
  // `/about` — the rules page, and the best keyword surface on the site.
  //
  // Rewritten with the landing page (P17). The old version explained how the game was *meant to
  // feel* and never once used the words a person types into a search box. This one names the genre
  // in the first sentence and bridges the vocabulary: stars are bulls, regions are pens.
  // -------------------------------------------------------------------------------------------
  'How to play Star Battle': 'How to play Star Battle',
  'CowField is a Star Battle puzzle. If you have seen the same game called Two Not Touch, that is this. The stars are bulls here and the regions are pens, but nothing about the rules changes.':
    "CowField is a Star Battle puzzle. If you've seen the same game called Two Not Touch, that's this. The stars are bulls here and the regions are pens, but nothing about the rules changes.",
  'How cell marks work': 'How cell marks work',
  'Each cell changes like this:': 'Each cell changes like this:',
  empty: 'empty',
  'dot note': 'dot note',
  bull: 'bull',
  'Every board has a number attached to it, depending on its size: one, two or three. Each row has to end up holding exactly that many bulls. So does each column, and so does each coloured pen. Get all three to agree at once and the level is done.':
    'Every board has a number attached to it, depending on its size: one, two or three. Each row has to end up holding exactly that many bulls. So does each column, and so does each coloured pen. Get all three to agree at once and the level is done.',
  'The second rule is the one that turns it into a puzzle. No two bulls may sit in neighbouring cells. Side by side, one above the other, or touching at a single corner, all of it is out. Every bull needs an empty ring around it.':
    'The second rule is the one that turns it into a puzzle. No two bulls may sit in neighbouring cells. Side by side, one above the other, or touching at a single corner, all of it is out. Every bull needs an empty ring around it.',
  'Light, easy and medium: one bull per row, column and pen.':
    'Light, easy and medium: one bull per row, column and pen.',
  'Hard: two. Extreme: three, on a 15x15 board.': 'Hard: two. Extreme: three, on a 15x15 board.',
  'Dots are notes. They never count as bulls.': 'Dots are notes. They never count as bulls.',
  'You win on bull placement alone.': 'You win on bull placement alone.',
  'Dots are how most people actually solve these. Mark the cells you have ruled out and the board narrows itself. You can also just place a bull you are unsure about: if it breaks a rule it lights up, and you can take it straight back. Leftover dots do not matter at the end, so there is no tidying up to do.':
    "Dots are how most people actually solve these. Mark the cells you've ruled out and the board narrows itself. You can also just place a bull you're unsure about: if it breaks a rule it lights up, and you can take it straight back. Leftover dots don't matter at the end, so there's no tidying up to do.",
  'Settings has a few things worth finding. Take your time hides the timers. Auto-place dots rings each bull for you, which saves a lot of clicking on the big boards. There is a dark theme, and sound and music have their own volumes. Guests get take your time switched on and locked.':
    "Settings has a few things worth finding. Take your time hides the timers. Auto-place dots rings each bull for you, which saves a lot of clicking on the big boards. There's a dark theme, and sound and music have their own volumes. Guests get take your time switched on and locked.",
  'I built CowField because I wanted a puzzle I could think through at my own pace. Nothing to keep up with, nothing waiting for me if I put it down for a month.':
    'I built CowField because I wanted a puzzle I could think through at my own pace. Nothing to keep up with, nothing waiting for me if I put it down for a month.',

  // The FAQ. Question-shaped headings with short answers, which is the shape Google lifts into an
  // answer box, and `FAQPage` structured data on the same content.
  'Common questions': 'Common questions',
  'What is Star Battle?': 'What is Star Battle?',
  'A logic puzzle on a grid split into coloured regions. You place a fixed number of stars in every row, every column and every region, and no two stars may touch, including diagonally. In CowField the stars are bulls and the regions are pens.':
    'A logic puzzle on a grid split into coloured regions. You place a fixed number of stars in every row, every column and every region, and no two stars may touch, including diagonally. In CowField the stars are bulls and the regions are pens.',
  'Is Two Not Touch the same puzzle?': 'Is Two Not Touch the same puzzle?',
  'Yes. Two Not Touch is the name usually given to the two-star version on a 10x10 board, which is what hard is here. Same rules, different name.':
    'Yes. Two Not Touch is the name usually given to the two-star version on a 10x10 board, which is what hard is here. Same rules, different name.',
  'Do I need an account?': 'Do I need an account?',
  'No. The guest button drops you straight onto a board and keeps your progress in your browser. An account only matters if you want that progress on a second device.':
    'No. The guest button drops you straight onto a board and keeps your progress in your browser. An account only matters if you want that progress on a second device.',
  'Is it free?': 'Is it free?',
  'Yes, all 1,000 levels. No ads, and nothing to buy.': 'Yes, all 1,000 levels. No ads, and nothing to buy.',
  'Does every puzzle have one solution?': 'Does every puzzle have one solution?',
  'Light, easy, medium and hard do, so every one of them can be reasoned out without guessing. Extreme boards can have more than one valid answer. Whichever you find, if it follows the rules it wins.':
    'Light, easy, medium and hard do, so every one of them can be reasoned out without guessing. Extreme boards can have more than one valid answer. Whichever you find, if it follows the rules it wins.',
  'Can I play on a phone?': 'Can I play on a phone?',
  'Yes. The small boards fit a phone screen comfortably. For 10x10 and 15x15 turn the phone sideways, or use a tablet, since 225 cells need the room.':
    'Yes. The small boards fit a phone screen comfortably. For 10x10 and 15x15 turn the phone sideways, or use a tablet, since 225 cells need the room.',
  // -------------------------------------------------------------------------------------------
  // `/how-to-solve` — solving techniques (P17). A new public page, and the one with the clearest
  // search intent on the site: "how to solve star battle" is a question people actually type.
  //
  // The techniques are real and transfer to any Star Battle board, which is the point. A page that
  // only worked for this app would deserve neither the traffic nor the link.
  // -------------------------------------------------------------------------------------------
  'How to solve Star Battle puzzles': 'How to solve Star Battle puzzles',
  'None of this is specific to CowField. It is how Star Battle works, so it carries over to any board you meet, under any of the names the puzzle goes by. Roughly in the order the moves tend to come up.':
    "None of this is specific to CowField. It's how Star Battle works, so it carries over to any board you meet, under any of the names the puzzle goes by. Roughly in the order the moves tend to come up.",
  'Fence off every bull you place': 'Fence off every bull you place',
  'The moment a bull goes down, the eight cells around it are dead. Dot them. This is the cheapest information on the board and it compounds, because those dots are what the next three techniques read. Turn on auto-place dots in Settings and the game does it for you.':
    "The moment a bull goes down, the eight cells around it are dead. Dot them. This is the cheapest information on the board and it compounds, because those dots are what the next three techniques read. Turn on auto-place dots in Settings and the game does it for you.",
  'A pen trapped in one row finishes that row': 'A pen trapped in one row finishes that row',
  'If a whole pen sits inside a single row, that pen has to spend its bulls in that row, and the row has no quota left for anyone else. Every other cell in the row is dead. The same works for columns, and it works with the pen only mostly contained too: what matters is where its empty cells are, not its full shape.':
    'If a whole pen sits inside a single row, that pen has to spend its bulls in that row, and the row has no quota left for anyone else. Every other cell in the row is dead. The same works for columns, and it works with the pen only mostly contained too: what matters is where its empty cells are, not its full shape.',
  'Count pens against rows': 'Count pens against rows',
  'The strongest move in the game, and the one people miss. If three pens fit entirely inside three rows, those three rows are spoken for: every cell in them belonging to a fourth pen is dead. It reads backwards as well. If three rows only ever touch three pens, those pens are used up and cannot appear anywhere else on the board.':
    'The strongest move in the game, and the one people miss. If three pens fit entirely inside three rows, those three rows are spoken for: every cell in them belonging to a fourth pen is dead. It reads backwards as well. If three rows only ever touch three pens, those pens are used up and cannot appear anywhere else on the board.',
  'Watch where a pen has room left': 'Watch where a pen has room left',
  'A pen spread across five rows is not free if its remaining cells only sit in two of them. Needing two bulls in two rows claims both. On the two and three bull boards this is most of the work, because a pen with three bulls and barely enough room is almost solved already.':
    "A pen spread across five rows isn't free if its remaining cells only sit in two of them. Needing two bulls in two rows claims both. On the two and three bull boards this is most of the work, because a pen with three bulls and barely enough room is almost solved already.",
  'Start where the choices are fewest': 'Start where the choices are fewest',
  'Small pens, corners and edges. A three-cell pen on a one-bull board offers three options; a twenty-cell pen offers twenty. Corners have fewer neighbours to rule out, so a bull placed there costs the board less. Open in the cramped part and the loose part solves itself later.':
    'Small pens, corners and edges. A three-cell pen on a one-bull board offers three options; a twenty-cell pen offers twenty. Corners have fewer neighbours to rule out, so a bull placed there costs the board less. Open in the cramped part and the loose part solves itself later.',
  'When nothing moves, assume one and follow it': 'When nothing moves, assume one and follow it',
  'Take a pen with two options left, pick one, and push the consequences until something breaks. If it breaks, the cell you picked is dead and you have learned something real. Place actual bulls while you do this rather than working it out in your head: an illegal one lights up the instant it lands, so the board tells you where the chain failed.':
    "Take a pen with two options left, pick one, and push the consequences until something breaks. If it breaks, the cell you picked is dead and you've learned something real. Place actual bulls while you do this rather than working it out in your head: an illegal one lights up the instant it lands, so the board tells you where the chain failed.",
  'Go and try one': 'Go and try one',

  // -------------------------------------------------------------------------------------------
  // `/difficulties` — what actually changes between board sizes (P17). Its job is the long tail:
  // "star battle 10x10", "star battle 2 stars", "15x15". It is also the honest place to say that
  // extreme trades uniqueness for existing at all.
  // -------------------------------------------------------------------------------------------
  'Board sizes': 'Board sizes',
  'Star Battle board sizes and difficulty': 'Star Battle board sizes and difficulty',
  'Five sizes, 200 levels each, and nothing is locked. There is no order to work through: level 1 of light and level 173 of extreme are both one click away on your first visit. Pick by how big a board you feel like.':
    "Five sizes, 200 levels each, and nothing is locked. There's no order to work through: level 1 of light and level 173 of extreme are both one click away on your first visit. Pick by how big a board you feel like.",
  '200 levels': '200 levels',
  '6x6 board, one bull per row, column and pen.': '6x6 board, one bull per row, column and pen.',
  '8x8 board, one bull per row, column and pen.': '8x8 board, one bull per row, column and pen.',
  '10x10 board, one bull per row, column and pen.': '10x10 board, one bull per row, column and pen.',
  '10x10 board, two bulls per row, column and pen.': '10x10 board, two bulls per row, column and pen.',
  '15x15 board, three bulls per row, column and pen.':
    '15x15 board, three bulls per row, column and pen.',
  'Where to start. Small enough to hold the whole board in your head, and the right place to work out what the dots are for.':
    'Where to start. Small enough to hold the whole board in your head, and the right place to work out what the dots are for.',
  'The same puzzle with more room to be wrong in. Rows stop being obvious and you start leaning on the pens.':
    'The same puzzle with more room to be wrong in. Rows stop being obvious and you start leaning on the pens.',
  'The size most Star Battle puzzles come in. If you have played this elsewhere, start here and it will feel familiar.':
    "The size most Star Battle puzzles come in. If you've played this elsewhere, start here and it will feel familiar.",
  'What most people mean by Two Not Touch. Two bulls per row changes the logic rather than the scale: finding one bull no longer finishes a row.':
    'What most people mean by Two Not Touch. Two bulls per row changes the logic rather than the scale: finding one bull no longer finishes a row.',
  '225 cells, 15 pens, 45 bulls. Expect to sit with one of these. They are also the boards that can have more than one valid answer.':
    "225 cells, 15 pens, 45 bulls. Expect to sit with one of these. They're also the boards that can have more than one valid answer.",
  'More bulls is not the same as a bigger board': 'More bulls is not the same as a bigger board',
  'Going from 6x6 to 10x10 gives you more of the same work. Going from one bull to two changes what you are allowed to conclude. On a one-bull board, finding a row\'s bull retires the row. On a two-bull board it tells you almost nothing on its own, because the second one is still out there and the no-touching rule is the only thing constraining it. That is why hard is a real step up from medium and extreme is a real step up from hard.':
    "Going from 6x6 to 10x10 gives you more of the same work. Going from one bull to two changes what you're allowed to conclude. On a one-bull board, finding a row's bull retires the row. On a two-bull board it tells you almost nothing on its own, because the second one is still out there and the no-touching rule is the only thing constraining it. That's why hard is a real step up from medium, and extreme is a real step up from hard.",
  'One caveat on extreme. Light through hard are checked to have exactly one solution, so pure deduction always gets you there. At 15x15 with three bulls that check stops being achievable, and those boards are accepted with a small number of solutions instead. It means an extreme board can reach a point where you have to pick rather than deduce. Any legal arrangement wins, so you will never be told you found the wrong one.':
    "One caveat on extreme. Light through hard are checked to have exactly one solution, so pure deduction always gets you there. At 15x15 with three bulls that check stops being achievable, and those boards are accepted with a small number of solutions instead. It means an extreme board can reach a point where you have to pick rather than deduce. Any legal arrangement wins, so you'll never be told you found the wrong one.",

  'Adjust your preferences here.':
    'Adjust your preferences here.',
  'Sound effects': 'Sound effects',
  'Enable sound effects.':
    'Enable sound effects.',
  Music: 'Music',
  'Enable background music during play.': 'Enable background music during play.',
  'Dark mode': 'Dark mode',
  'Switch to dark colours for playing in low light.':
    'Switch to dark colours for playing in low light.',
  'Choose the language used across the game.': 'Choose the language used across the game.',
  'Switch to dark mode': 'Switch to dark mode',
  'Switch to light mode': 'Switch to light mode',
  'Take your time': 'Take your time',
  'Hide the timers so nothing on screen is counting.':
    'Hide the timers so nothing on screen is counting.',
  'Auto-place dots': 'Auto-place dots',
  'Ring each bull with dots the moment you place it.':
    'Ring each bull with dots the moment you place it.',
  'Player statistics': 'Player statistics',
  'Most progress': 'Most progress',
  'No data': 'No data',
  'Completed levels': 'Completed levels',
  'Placed bulls': 'Placed bulls',
  'Total completion time': 'Total completion time',
  'Performance breakdown by difficulty:': 'Performance breakdown by difficulty:',
  Difficulty: 'Difficulty',
  'Fastest level': 'Fastest level',
  'Average per level': 'Average per level',
  'No completed level': 'No completed level',
  // i18next picks the `_one` / `_other` variant from `count` and falls back to the bare key, which
  // is kept so the string still resolves if a variant is ever missing. English has two forms;
  // Ukrainian has three, and `uk.ts` carries `_few` and `_many` as well.
  '{{count}} completed levels': '{{count}} completed levels',
  '{{count}} completed levels_one': '{{count}} completed level',
  '{{count}} completed levels_other': '{{count}} completed levels',
  'The requested level route is invalid.': 'The requested level route is invalid.',
  'This level does not exist yet.': 'This level does not exist yet.',
  'Create level': 'Create level',
  'Edit level': 'Edit level',
  'Remaining bulls': 'Remaining bulls',
  Timer: 'Timer',
  Back: 'Back',
  'Failed to load level data.': 'Failed to load level data.',
  'Admin role is required to create or edit levels.':
    'Admin role is required to create or edit levels.',
  'Fix those problems and try again.': 'Fix those problems and try again.',
  // The editor's validation issues. `shared/game/validation.ts` hands back a code and its numbers
  // instead of a sentence, and `translateValidationIssue` chooses the wording — which is what lets
  // a Ukrainian admin read these at all. `{{count}}` keys carry `_one` / `_other` for the same
  // reason as the ones above; `uk.ts` adds `_few` and `_many`.
  'Add a level title.': 'Add a level title.',
  'Grid size must stay {{size}} x {{size}} for {{difficulty}}.':
    'Grid size must stay {{size}} x {{size}} for {{difficulty}}.',
  'The pen grid is incomplete.': 'The pen grid is incomplete.',
  'The authored bull layout is incomplete.': 'The authored bull layout is incomplete.',
  'Every cell must belong to a pen.': 'Every cell must belong to a pen.',
  'A {{size}} x {{size}} level must use exactly {{size}} pens.':
    'A {{size}} x {{size}} level must use exactly {{size}} pens.',
  'Pen {{penId}} is too small for {{count}} bull placements.':
    'Pen {{penId}} is too small for {{count}} bull placements.',
  'Pen {{penId}} is too small for {{count}} bull placements._one':
    'Pen {{penId}} is too small for {{count}} bull placement.',
  'Pen {{penId}} is too small for {{count}} bull placements._other':
    'Pen {{penId}} is too small for {{count}} bull placements.',
  'Pen {{penId}} must be one connected region.': 'Pen {{penId}} must be one connected region.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.':
    'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._one':
    'The authored bull layout must place exactly {{count}} bull for {{difficulty}}.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._other':
    'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.',
  'Each row must contain exactly {{count}} bulls.': 'Each row must contain exactly {{count}} bulls.',
  'Each row must contain exactly {{count}} bulls._one':
    'Each row must contain exactly {{count}} bull.',
  'Each row must contain exactly {{count}} bulls._other':
    'Each row must contain exactly {{count}} bulls.',
  'Each column must contain exactly {{count}} bulls.':
    'Each column must contain exactly {{count}} bulls.',
  'Each column must contain exactly {{count}} bulls._one':
    'Each column must contain exactly {{count}} bull.',
  'Each column must contain exactly {{count}} bulls._other':
    'Each column must contain exactly {{count}} bulls.',
  'Pen {{penId}} must contain exactly {{count}} bulls.':
    'Pen {{penId}} must contain exactly {{count}} bulls.',
  'Pen {{penId}} must contain exactly {{count}} bulls._one':
    'Pen {{penId}} must contain exactly {{count}} bull.',
  'Pen {{penId}} must contain exactly {{count}} bulls._other':
    'Pen {{penId}} must contain exactly {{count}} bulls.',
  'Bulls may not touch, including diagonally.': 'Bulls may not touch, including diagonally.',
  'This level has no valid solution.': 'This level has no valid solution.',
  'Level saved': 'Level saved',
  'Failed to save level.': 'Failed to save level.',
  'Failed to delete level.': 'Failed to delete level.',
  'Deleting...': 'Deleting...',
  'Delete level': 'Delete level',
  'Discard unsaved changes?': 'Discard unsaved changes?',
  'This level has unsaved changes. Leaving now discards them.': 'This level has unsaved changes. Leaving now discards them.',
  'This level has unsaved changes. This action replaces the board and discards them.': 'This level has unsaved changes. This action replaces the board and discards them.',
  'Leave and discard': 'Leave and discard',
  Discard: 'Discard',
  'Delete level?': 'Delete level?',
  'Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.':
    'Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.',
  'Board cleared': 'Board cleared',
  'Validation passed': 'Validation passed',
  'Exactly one solution.': 'Exactly one solution.',
  'This level has more than one solution.': 'This level has more than one solution.',
  'Found {{count}} solutions. A good level has exactly one.':
    'Found {{count}} solutions. A good level has exactly one.',
  'Found {{count}} solutions. A good level has exactly one._one':
    'Found {{count}} solution. A good level has exactly one.',
  'Found {{count}} solutions. A good level has exactly one._other':
    'Found {{count}} solutions. A good level has exactly one.',
  // "N+" reads as plural at every count, including one, so both variants are the plural wording.
  // They are still spelled out: without them i18next resolves `_one` to the bare key, and a reader
  // cannot tell a deliberate choice from a forgotten one.
  'Found {{count}}+ solutions. A good level has exactly one.':
    'Found {{count}}+ solutions. A good level has exactly one.',
  'Found {{count}}+ solutions. A good level has exactly one._one':
    'Found {{count}}+ solutions. A good level has exactly one.',
  'Found {{count}}+ solutions. A good level has exactly one._other':
    'Found {{count}}+ solutions. A good level has exactly one.',
  'Generate builds a level with exactly one solution.':
    'Generate builds a level with exactly one solution.',
  'Generation ran out of time. Try again.': 'Generation ran out of time. Try again.',
  'The generator searches for a board with exactly one solution, which takes longer on medium and hard.':
    'The generator searches for a board with exactly one solution, which takes longer on medium and hard.',
  'Nothing on the board was changed, so you can run Generate again.':
    'Nothing on the board was changed, so you can run Generate again.',
  'Level generated': 'Level generated',
  'Generating...': 'Generating...',
  'Create/Edit Level': 'Create/Edit Level',
  Generate: 'Generate',
  'Validate level': 'Validate level',
  'Validating...': 'Validating...',
  'Save level': 'Save level',
  'Clear board': 'Clear board',
  'Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.':
    'Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.',
  'Color palette': 'Color palette',
  Erase: 'Erase',
  Cow: 'Cow',
  'Color {{colorId}}': 'Color {{colorId}}',
  'Level color editor': 'Level color editor',
  Profile: 'Profile',
  Guest: 'Guest',
  User: 'User',
  'Preview role': 'Preview role',
  'Log out': 'Log out',
  Login: 'Login',
  'Sign in with your email and password, create an account, or continue as a guest.':
    'Sign in with your email and password, create an account, or continue as a guest.',
  Email: 'Email',
  Password: 'Password',
  'Log in': 'Log in',
  'Continue with Google': 'Continue with Google',
  'Completing Google login...': 'Completing Google login...',
  'Verifying your email...': 'Verifying your email...',
  'Play as guest': 'Play as guest',
  // -------------------------------------------------------------------------------------------
  // P18 — the level gate, sharing, and the guest-to-account handover.
  // -------------------------------------------------------------------------------------------
  'Ready when you are': 'Ready when you are',
  'Play right away without an account, or make one so your times follow you between devices.':
    'Play right away without an account, or make one so your times follow you between devices.',
  Share: 'Share',
  'Play this Star Battle level on CowField': 'Play this Star Battle level on CowField',
  'Link copied.': 'Link copied.',
  "Couldn't share this level.": "Couldn't share this level.",
  'Browse all levels': 'Browse all levels',
  'Sign up': 'Sign up',
  'Your guest progress stays here': 'Your guest progress stays here',
  // `{{count}}` does not appear in the singular on purpose: "the 1 level" is not a sentence anyone
  // writes. i18next picks the form, and each form is allowed its own wording.
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._one':
    'Signing in leaves behind the level you finished as a guest on this device. Create an account instead and it comes with you.',
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._other':
    'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you.',
  'Sign in anyway': 'Sign in anyway',
  'Statistics is available only for logged users.':
    'Statistics is available only for logged users.',
  'Create account': 'Create account',
  'Forgot password?': 'Forgot password?',
  'Passwords do not match.': 'Passwords do not match.',
  'Request failed.': 'Request failed.',
  'Create a user account with your email and password.':
    'Create a user account with your email and password.',
  'Confirm password': 'Confirm password',
  'Back to login': 'Back to login',
  'Reset password': 'Reset password',
  'Enter your email and we will send you a password reset link.':
    'Enter your email and we will send you a password reset link.',
  'If the account exists, a reset link has been sent to that email address.':
    'If the account exists, a reset link has been sent to that email address.',
  'Send reset link': 'Send reset link',
  'I already have a reset link': 'I already have a reset link',
  'Your password has been updated.': 'Your password has been updated.',
  'Open the reset link from your email and choose a new password.':
    'Open the reset link from your email and choose a new password.',
  'Reset token': 'Reset token',
  'New password': 'New password',
  'Save new password': 'Save new password',
  'Account created. Check your email to verify it before logging in.':
    'Account created. Check your email to verify it before logging in.',
  'Verification email sent again.': 'Verification email sent again.',
  'Resend verification email': 'Resend verification email',
  'Show password': 'Show password',
  'Hide password': 'Hide password',
  'You are playing as a Guest.': 'You are playing as a Guest.',
  'This browser is blocking saved data, so these choices will reset when you close the tab.':
    'This browser is blocking saved data, so these choices will reset when you close the tab.',
  'Incorrect email or password.': 'Incorrect email or password.',
  'Too many requests. Try again in a moment.': 'Too many requests. Try again in a moment.',
  'Too many attempts. Wait a few minutes and try again.':
    'Too many attempts. Wait a few minutes and try again.',
  'Guests cannot access this resource.': 'Guests cannot access this resource.',
  // Neon Auth's own raw error text. The browser signs in against Neon directly, so these strings
  // reach `translateAuthMessage` verbatim — without a key here they render as English for everyone.
  'Invalid email or password': 'Incorrect email or password.',
  'User already exists': 'An account with that email already exists.',
  'Email not verified': 'Email not verified.',
  // The reset-password endpoint's codes, same idea. Anything not listed here — "User not found" on
  // a forgotten-password request, for one, which would otherwise tell a stranger which addresses
  // have accounts — falls through to the caller's generic message instead of being shown.
  'Invalid token': 'This reset link is no longer valid. Request a new one.',
  'Password too short': 'That password is too short. Use at least 8 characters.',
  'Password too long': 'That password is too long.',
  'Failed to restore session after login.': 'Failed to restore session after login.',
  'Google login failed.': 'Google login failed.',
  // Shown instead of `?error=` when the address bar carries something we do not ship a string for.
  // Everything above is the allowlist `translateKnownAuthMessage` checks against.
  'Sign-in failed. Try again.': 'Sign-in failed. Try again.',
  // The other generic fallbacks, one per form, so a failure at least says which thing failed.
  "Couldn't create your account. Try again.": "Couldn't create your account. Try again.",
  "Couldn't send the reset link. Try again.": "Couldn't send the reset link. Try again.",
  "Couldn't update your password. Try again.": "Couldn't update your password. Try again.",
  'What is CowField?': 'What is CowField?',
  'Back to your levels': 'Back to your levels',
  'Email verification failed.': 'Email verification failed.',
  'Your email is verified. You can log in now.':
    'Your email is verified. You can log in now.',
  'Neon Auth is not configured.': 'Neon Auth is not configured.',
  'Invalid request payload.': 'Invalid request payload.',
  'Level complete': 'Level complete',
  'Best time: {{time}}': 'Best time: {{time}}',
  'New best time.': 'New best time.',
  "Couldn't save your progress. Check your connection and try again.": "Couldn't save your progress. Check your connection and try again.",
  'Try again': 'Try again',
  'You completed the last available level.': 'You completed the last available level.',
  'Your progress has been saved.': 'Your progress has been saved.',
  'Saving your progress...': 'Saving your progress...',

  // Error boundaries and failed page loads.
  'Something went wrong. Reloading the page usually fixes it.':
    'Something went wrong. Reloading the page usually fixes it.',
  'Reload the page': 'Reload the page',
  "Couldn't load your progress. Check your connection and try again.":
    "Couldn't load your progress. Check your connection and try again.",
  "Couldn't load these levels. Check your connection and try again.":
    "Couldn't load these levels. Check your connection and try again.",
  "Couldn't load your statistics. Check your connection and try again.":
    "Couldn't load your statistics. Check your connection and try again.",
  "Couldn't load this level. Check your connection and try again.":
    "Couldn't load this level. Check your connection and try again.",
} as const

export default en
