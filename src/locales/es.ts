// Spanish, added 2026-09-22. Terminology agreed before any of this was written — see
// `claude/adding-a-language.md`, which carries the reasoning for each choice.
//
//   Star Battle    -> Star Battle, with "la batalla de estrellas" named alongside
//   Two Not Touch  -> Dos estrellas
//   pen            -> corral           bull -> toro
//   cow            -> vaca             dot  -> punto
//   difficulties   -> Muy fácil / Fácil / Medio / Difícil / Extremo
//
// Four things this file does differently from its neighbours:
//
// 1. **`tú`, never `usted`.** Same answer as German and Italian, opposite of French. Spanish
//    consumer software is informal, and the site speaks in the first person on `/about` and
//    `/about-project`; `usted` would put a counter between the author and the reader.
//
// 2. **Pan-Hispanic, so the thousands separator never appears.** Spain writes 1.000 and Mexico
//    writes 1,000, and there is no neutral numeral. The six "1,000 levels" strings are written
//    out as **mil** instead, which reads identically everywhere — the same move `uk.ts` makes for
//    solution counts. `teléfono` for the same reason, rather than Spain's `móvil` or Latin
//    America's `celular`. The site addresses one reader in the singular throughout, so the
//    vosotros/ustedes split — the largest divergence of all — never arises.
//
// 3. **`vaca` is unavoidable, unlike Italian's `vacca`.** Spanish has exactly one word for a cow:
//    `res` is a head of cattle, `vacuno` is an adjective, and there is no counterpart to Italian's
//    `mucca`. The insult sense is about weight rather than Italian's sexual charge, and the word
//    appears in only three strings — the landing description and two admin-only editor strings —
//    against hundreds of `toro` and `corral`.
//
// 4. **The trap in Spanish is a verb.** `coger` is the neutral "to take, to pick" in Spain and
//    obscene across Mexico and the Río de la Plata, and the English catalogue is full of *pick a
//    size*, *pick a colour*, *take a pen*. Everything here uses `elegir`, `tomar` or `seleccionar`
//    instead, and the harness asserts `coger` never reaches a page.
//
// Typography: «comillas angulares» with no inner spaces (RAE's first choice, and Italian's
// spacing rather than French's), and inverted ¿ and ¡ opening every question and exclamation.
const es = {
  CowField: 'CowField',

  'Play Star Battle online, free': 'Juega a Star Battle online, gratis',
  'Play Star Battle online, free - CowField': 'Juega a Star Battle online, gratis - CowField',
  'Play Star Battle online for free, no account needed. 1,000 puzzles from 6x6 to 15x15, the logic game also known as Two Not Touch. No timer unless you want one.':
    'Juega a Star Battle online gratis, sin cuenta. Mil rompecabezas de 6x6 a 15x15, el juego de lógica también llamado Dos estrellas. El cronómetro es opcional.',
  'Star Battle, played with cows. The grid is split into coloured pens, and every row, every column and every pen needs the same number of bulls. No two bulls may touch, not even at a corner. If you have played Two Not Touch, you already know it.':
    'Star Battle, la batalla de estrellas jugada con vacas. La cuadrícula se divide en corrales de colores, y cada fila, cada columna y cada corral necesita el mismo número de toros. Dos toros nunca pueden tocarse, ni siquiera por una esquina. Si has jugado a Dos estrellas, ya sabes cómo va.',
  'Play now': 'Jugar ahora',
  'Starting...': 'Empezando...',
  'Sign in to save your progress': 'Inicia sesión para guardar tu progreso',
  "You don't need an account. Pick any level and start.":
    'No necesitas una cuenta. Elige un nivel cualquiera y empieza.',
  'The server is waking up. First visit of the day takes a few seconds.':
    'El servidor se está despertando. La primera visita del día tarda unos segundos.',
  "Couldn't start a game. Check your connection and try again.":
    'No se ha podido empezar una partida. Revisa tu conexión e inténtalo de nuevo.',
  'How to play': 'Cómo se juega',
  'Every row, column and pen gets the same number of bulls. One on the small boards, three on the biggest.':
    'Cada fila, cada columna y cada corral lleva el mismo número de toros. Uno en los tableros pequeños, tres en el más grande.',
  'Two bulls can never touch, including diagonally at a corner.':
    'Dos toros nunca pueden tocarse, tampoco en diagonal por una esquina.',
  "Dots are your own notes. They don't count as bulls.":
    'Los puntos son tus propias notas. No cuentan como toros.',
  'Read the full rules': 'Leer las reglas completas',
  'Solving techniques': 'Técnicas de resolución',
  'No timer unless you want one': 'Sin cronómetro salvo que lo quieras',
  'There is a clock if you want to race yourself, and a setting that hides it. Put a bull where it breaks a rule and it lights up straight away. It will not tell you what is correct, only what is illegal.':
    'Hay un reloj por si quieres competir contigo mismo, y un ajuste que lo esconde. Pon un toro donde rompe una regla y se enciende al momento. No te dirá qué es correcto, solo qué es ilegal.',
  '1,000 levels, five board sizes': 'Mil niveles, cinco tamaños de tablero',
  'Two hundred levels in each of five difficulties. Light is 6x6 with one bull per row, column and pen. Easy is 8x8, medium is 10x10, hard is 10x10 with two. Extreme is 15x15 with three.':
    'Doscientos niveles en cada una de las cinco dificultades. Muy fácil es 6x6 con un toro por fila, columna y corral. Fácil es 8x8, medio es 10x10, difícil es 10x10 con dos. Extremo es 15x15 con tres.',
  'Every board is generated and then solved again to check it. Light through hard have exactly one answer. Any arrangement that follows the rules counts as a win.':
    'Cada tablero se genera y después se vuelve a resolver para comprobarlo. De muy fácil a difícil tienen exactamente una respuesta. Cualquier disposición que siga las reglas cuenta como victoria.',
  '1,000 levels': 'Mil niveles',
  'Five difficulties': 'Cinco dificultades',
  'Up to 15x15': 'Hasta 15x15',
  'No sign-up': 'Sin registro',
  'Try it yourself.': 'Pruébalo.',

  'Page not found': 'Página no encontrada',
  'That link does not lead anywhere.': 'Ese enlace no lleva a ninguna parte.',
  'Back to the start': 'Volver al principio',

  'The rules of Star Battle, also called Two Not Touch: the same number of bulls in every row, column and region, and no two touching. Plus what the dots do.':
    'Las reglas de Star Battle, o Dos estrellas: el mismo número de toros en cada fila, columna y región, sin que dos se toquen. Y qué hacen los puntos.',
  'Six techniques for solving Star Battle and Two Not Touch puzzles, from fencing off stars to counting regions against rows, plus what to do when you get stuck.':
    'Seis técnicas para resolver rompecabezas Star Battle y Dos estrellas, desde vallar las estrellas hasta contar regiones contra filas, y qué hacer si te atascas.',
  'What changes between a 6x6 one-bull Star Battle board and a 15x15 three-bull one, how many levels each size has, and which difficulty to start with.':
    'Qué cambia entre un tablero Star Battle de 6x6 con un toro y uno de 15x15 con tres, cuántos niveles tiene cada tamaño y por qué dificultad empezar.',
  'Loading...': 'Cargando...',
  Hidden: 'Oculto',
  'Back to home': 'Volver al inicio',
  'Back to the rules': 'Volver a las reglas',
  'Back to levels': 'Volver a los niveles',
  'Back to all difficulties': 'Volver a todas las dificultades',
  Restart: 'Reiniciar',
  'Next Level': 'Siguiente nivel',
  Cancel: 'Cancelar',
  Save: 'Guardar',
  Delete: 'Eliminar',
  Role: 'Rol',
  Player: 'Jugador',
  Admin: 'Administrador',
  Volume: 'Volumen',
  Language: 'Idioma',
  Undo: 'Deshacer',
  Home: 'Inicio',
  'Level {{levelNumber}}': 'Nivel {{levelNumber}}',
  Light: 'Muy fácil',
  Easy: 'Fácil',
  Medium: 'Medio',
  Hard: 'Difícil',
  Extreme: 'Extremo',
  'Home menu': 'Menú de inicio',
  'Site links': 'Enlaces del sitio',
  'Share CowField': 'Compartir CowField',
  'Send someone the game, or let them scan it.':
    'Envía el juego a alguien, o deja que lo escanee.',
  'Link to CowField': 'Enlace a CowField',
  'Copy link': 'Copiar enlace',
  Copied: 'Copiado',
  "Couldn't copy the link. Select it and copy manually.":
    'No se ha podido copiar el enlace. Selecciónalo y cópialo a mano.',
  'QR code linking to CowField': 'Código QR que enlaza con CowField',
  'Point a phone camera at this to open the game.':
    'Apunta con la cámara del teléfono para abrir el juego.',
  'Copy image': 'Copiar imagen',
  'Image copied': 'Imagen copiada',
  'Paste it anywhere that takes a picture.': 'Pégala en cualquier sitio que acepte una imagen.',
  "Couldn't copy the image.": 'No se ha podido copiar la imagen.',
  Close: 'Cerrar',
  'Puzzle board': 'Tablero del rompecabezas',
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}':
    'Fila {{row}}, columna {{column}}, corral {{pen}}. {{state}}',
  'Row {{row}}, column {{column}}, pen {{pen}}. {{state}}. Breaks a rule.':
    'Fila {{row}}, columna {{column}}, corral {{pen}}. {{state}}. Rompe una regla.',
  'Row {{row}}, column {{column}}': 'Fila {{row}}, columna {{column}}',
  'Pen {{pen}}': 'Corral {{pen}}',
  'No pen': 'Sin corral',
  'This board is cramped on a screen this size.':
    'Este tablero va apretado en una pantalla de este tamaño.',
  'Turning your phone sideways gives it more room.':
    'Si giras el teléfono tendrá más espacio.',
  'Light levels are a better fit for narrow screens.':
    'Los niveles muy fáciles encajan mejor en pantallas estrechas.',
  Dismiss: 'Descartar',
  Play: 'Jugar',
  About: 'Reglas',
  Statistics: 'Estadísticas',
  Settings: 'Ajustes',

  '1,000 free Star Battle puzzles': 'Mil rompecabezas Star Battle gratis',
  'Choose a difficulty to play.': 'Elige una dificultad para jugar.',
  'Pick a size to see its 200 levels. They run from 6x6 with one bull per row up to 15x15 with three.':
    'Elige un tamaño para ver sus 200 niveles. Van desde 6x6 con un toro por fila hasta 15x15 con tres.',
  'Browse all 1,000 levels': 'Ver los mil niveles',
  'Every Star Battle puzzle on CowField, 200 in each of five sizes. Pick 6x6, 8x8, 10x10 with one or two stars, or 15x15 with three, and start without an account.':
    'Todos los rompecabezas Star Battle de CowField, 200 en cada uno de los cinco tamaños. Elige 6x6, 8x8, 10x10 con una o dos estrellas, o 15x15 con tres.',
  'What changes between sizes': 'Qué cambia entre tamaños',
  '6x6 Star Battle puzzles, one star per row': 'Rompecabezas Star Battle 6x6, una estrella',
  'Two hundred 6x6 Star Battle puzzles, free, with one star in every row, column and region. The smallest boards here, and where the dots start to make sense.':
    'Doscientos rompecabezas Star Battle de 6x6, gratis, con una estrella en cada fila, columna y región. Los tableros más pequeños que hay aquí.',
  'Light is the smallest size here. Every board is 6 by 6, with one bull in every row, every column and every pen.':
    'Muy fácil es el tamaño más pequeño que hay aquí. Todos los tableros son de 6 por 6, con un toro en cada fila, cada columna y cada corral.',
  'Thirty-six cells is small enough to hold the whole grid in your head. Start here if you have not used the dots before.':
    'Treinta y seis casillas son lo bastante pocas para tener la cuadrícula entera en la cabeza. Empieza aquí si no has usado los puntos antes.',
  '8x8 Star Battle puzzles, one star per row': 'Rompecabezas Star Battle 8x8, una estrella',
  'An 8x8 grid, one star in every row, column and region, and 200 free puzzles. Twenty-eight more cells than a 6x6 board, and the obvious rows run out sooner.':
    'Una cuadrícula de 8x8, una estrella en cada fila, columna y región, y 200 rompecabezas gratis. Veintiocho casillas más que un tablero de 6x6.',
  'Easy keeps one bull in every row, column and pen, and moves the board to 8 by 8. Same rules as the 6x6 boards, with twenty-eight more cells to be wrong in.':
    'Fácil mantiene un toro en cada fila, columna y corral, y lleva el tablero a 8 por 8. Las mismas reglas que los tableros de 6x6, con veintiocho casillas más en las que equivocarse.',
  'Counting rows stops being enough on its own at this size, and the shape of the pens starts to matter.':
    'Contar filas deja de bastar por sí solo a este tamaño, y la forma de los corrales empieza a importar.',
  '10x10 Star Battle puzzles, one star per row': 'Rompecabezas Star Battle 10x10, una estrella',
  'The size most Star Battle puzzles come in. 200 free 10x10 boards with one star in every row, column and region, and the usual place to start.':
    'El tamaño en el que vienen casi todos los rompecabezas Star Battle. 200 tableros de 10x10 gratis con una estrella en cada fila, columna y región.',
  'Medium is 10 by 10 with one bull in every row, column and pen. Most Star Battle puzzles come in this size, so it should feel familiar if you have played elsewhere.':
    'Medio es 10 por 10 con un toro en cada fila, columna y corral. Casi todos los rompecabezas Star Battle vienen en este tamaño, así que te resultará familiar si has jugado en otro sitio.',
  'A hundred cells is enough that guessing stops paying and you have to eliminate properly.':
    'Cien casillas son suficientes para que adivinar deje de compensar y tengas que eliminar en serio.',
  '10x10 Star Battle puzzles, two stars per row': 'Rompecabezas Star Battle 10x10, dos estrellas',
  'Two stars in every row, column and region of a 10x10 grid. This is what most people mean by Two Not Touch, and there are 200 of them here, free.':
    'Dos estrellas en cada fila, columna y región de una cuadrícula de 10x10. Esto es lo que casi todo el mundo entiende por Dos estrellas, y aquí hay 200, gratis.',
  'Hard stays at 10 by 10 and puts two bulls in every row, column and pen. This is the version most people mean by Two Not Touch.':
    'Difícil se queda en 10 por 10 y pone dos toros en cada fila, columna y corral. Esta es la versión que casi todo el mundo entiende por Dos estrellas.',
  'Finding one bull in a row no longer retires the row, because the second is still out there. The rule that no two bulls may touch ends up doing most of the work.':
    'Encontrar un toro en una fila ya no retira la fila, porque el segundo sigue ahí fuera. La regla de que dos toros no pueden tocarse acaba haciendo casi todo el trabajo.',
  '15x15 Star Battle puzzles, three stars per row': 'Rompecabezas Star Battle 15x15, tres estrellas',
  'Three stars in every row, column and region of a 15x15 grid. 225 cells, 45 stars and 200 puzzles, the hardest Star Battle boards on CowField.':
    'Tres estrellas en cada fila, columna y región de una cuadrícula de 15x15. 225 casillas, 45 estrellas y 200 rompecabezas, los tableros más duros de CowField.',
  'Extreme is 15 by 15 with three bulls in every row, column and pen. That is 225 cells and 45 bulls, and one of these will take a while.':
    'Extremo es 15 por 15 con tres toros en cada fila, columna y corral. Son 225 casillas y 45 toros, y uno de estos te va a llevar un rato.',
  'Unlike the smaller sizes, these boards are not checked to have exactly one answer. A few have several. Any legal arrangement wins, and you will never be told you found the wrong one.':
    'A diferencia de los tamaños menores, no se comprueba que estos tableros tengan exactamente una respuesta. Algunos tienen varias. Cualquier disposición legal gana, y nunca se te dirá que encontraste la equivocada.',
  'Available levels': 'Niveles disponibles',
  'Unknown difficulty.': 'Dificultad desconocida.',
  'Choose one of the available difficulty groups to browse levels.':
    'Elige uno de los grupos de dificultad disponibles para ver los niveles.',
  Levels: 'Niveles',
  '{{difficulty}} Levels': 'Niveles: {{difficulty}}',
  Previous: 'Anterior',
  Next: 'Siguiente',
  'Page {{page}} of {{totalPages}}': 'Página {{page}} de {{totalPages}}',
  '{{completed}} of {{total}} solved': '{{completed}} de {{total}} resueltos',
  '{{percent}}% done': '{{percent}}% hecho',
  '{{count}} levels_one': '{{count}} nivel',
  '{{count}} levels_other': '{{count}} niveles',
  'Open level {{levelNumber}}': 'Abrir el nivel {{levelNumber}}',
  'Level {{levelNumber}} solved': 'Nivel {{levelNumber}} resuelto',
  'Edit level {{levelNumber}}': 'Editar el nivel {{levelNumber}}',

  'How to play Star Battle': 'Cómo jugar a Star Battle',
  // Names all three search terms in the opening sentence: the English name people type, the
  // Spanish descriptive one, and the alias. Italian shipped without the alias and a harness
  // caught it — see the runbook.
  'CowField is a Star Battle puzzle, the game also known as Two Not Touch. The stars are bulls here and the regions are pens. Nothing else about the rules changes.':
    'CowField es un rompecabezas Star Battle, en español la batalla de estrellas, también conocido como Dos estrellas o Two Not Touch. Aquí las estrellas son toros y las regiones son corrales. Por lo demás, las reglas no cambian.',
  'How cell marks work': 'Cómo funcionan las marcas',
  'Each cell changes like this:': 'Cada casilla cambia así:',
  empty: 'vacía',
  'dot note': 'punto de nota',
  bull: 'toro',
  'Every board has a number attached to it, depending on its size. One, two or three. Each row has to end up holding exactly that many bulls, and so does each column and each coloured pen. Get all three to agree at once and the level is done.':
    'Cada tablero tiene un número asociado, según su tamaño. Uno, dos o tres. Cada fila tiene que acabar con exactamente esa cantidad de toros, y lo mismo cada columna y cada corral de color. Haz que los tres cuadren a la vez y el nivel está resuelto.',
  'The second rule. No two bulls may sit in neighbouring cells, side by side, one above the other, or touching at a single corner. Every bull needs an empty ring around it.':
    'La segunda regla. Dos toros no pueden estar en casillas vecinas: ni uno al lado del otro, ni uno encima del otro, ni tocándose por una sola esquina. Cada toro necesita un anillo vacío a su alrededor.',
  'Light, easy and medium: one bull per row, column and pen.':
    'Muy fácil, fácil y medio: un toro por fila, columna y corral.',
  'Hard: two. Extreme: three, on a 15x15 board.': 'Difícil: dos. Extremo: tres, en un tablero de 15x15.',
  'Dots are notes. They never count as bulls.': 'Los puntos son notas. Nunca cuentan como toros.',
  'You win on bull placement alone.': 'Se gana solo con la colocación de los toros.',
  'Dots are how most people actually solve these. Mark the cells you have ruled out and the board narrows itself. You can also place a bull you are unsure about. If it breaks a rule it lights up and you can take it straight back. Leftover dots do not matter at the end.':
    'Con los puntos es como casi todo el mundo resuelve esto en la práctica. Marca las casillas que has descartado y el tablero se va cerrando solo. También puedes poner un toro del que no estés seguro. Si rompe una regla se enciende y puedes quitarlo al momento. Los puntos que sobren al final dan igual.',
  'A few things live in Settings. Take your time hides the timers. Auto-place dots rings each bull for you, which saves a lot of clicking on the big boards. There is a dark theme, and sound and music have their own volumes. Guests get take your time switched on and locked.':
    'Algunas opciones están en Ajustes. «Tómate tu tiempo» esconde los cronómetros. «Puntos automáticos» rodea cada toro por ti, lo que ahorra muchísimos clics en los tableros grandes. Hay un tema oscuro, y el sonido y la música tienen su propio volumen. Los invitados llevan «Tómate tu tiempo» activado y bloqueado.',
  'I built CowField because I wanted a puzzle I could think through at my own pace. Nothing to keep up with, nothing waiting for me if I put it down for a month.':
    'Hice CowField porque quería un rompecabezas para pensar a mi ritmo. Nada de lo que estar pendiente, nada esperándome si lo dejo un mes.',

  'Common questions': 'Preguntas frecuentes',
  'What is Star Battle?': '¿Qué es Star Battle?',
  'A logic puzzle on a grid split into coloured regions. You place a fixed number of stars in every row, every column and every region, and no two stars may touch, including diagonally. In CowField the stars are bulls and the regions are pens.':
    'Un rompecabezas de lógica sobre una cuadrícula dividida en regiones de colores. Colocas un número fijo de estrellas en cada fila, cada columna y cada región, y dos estrellas no pueden tocarse, tampoco en diagonal. En CowField las estrellas son toros y las regiones son corrales.',
  'Is Two Not Touch the same puzzle?': '¿Dos estrellas es el mismo rompecabezas?',
  'Yes. Two Not Touch is the name usually given to the two-star version on a 10x10 board, which is what hard is here. Same rules, different name.':
    'Sí. Dos estrellas, o Two Not Touch, es el nombre que suele darse a la versión de dos estrellas en un tablero de 10x10, que aquí es difícil. Las mismas reglas, otro nombre.',
  'Do I need an account?': '¿Necesito una cuenta?',
  'No. The guest button drops you straight onto a board and keeps your progress in your browser. An account only matters if you want that progress on a second device.':
    'No. El botón de invitado te deja directamente en un tablero y guarda tu progreso en el navegador. La cuenta solo importa si quieres ese progreso en un segundo dispositivo.',
  'Is it free?': '¿Es gratis?',
  'Yes, all 1,000 levels. No ads, and nothing to buy.':
    'Sí, los mil niveles. Sin anuncios, y sin nada que comprar.',
  'Does every puzzle have one solution?': '¿Todos los rompecabezas tienen una sola solución?',
  'Light, easy, medium and hard do, so every one of them can be reasoned out without guessing. Extreme boards can have more than one valid answer. Whichever you find, if it follows the rules it wins.':
    'Muy fácil, fácil, medio y difícil sí, así que todos ellos se pueden razonar sin adivinar. Los tableros extremos pueden tener más de una respuesta válida. Encuentres la que encuentres, si sigue las reglas, gana.',
  'Can I play on a phone?': '¿Puedo jugar en el teléfono?',
  'Yes. The small boards fit a phone screen comfortably. For 10x10 and 15x15 turn the phone sideways, or use a tablet, since 225 cells need the room.':
    'Sí. Los tableros pequeños caben de sobra en la pantalla de un teléfono. Para 10x10 y 15x15 gira el teléfono, o usa una tablet, porque 225 casillas necesitan sitio.',

  'How to solve Star Battle puzzles': 'Cómo resolver rompecabezas Star Battle',
  'None of this is specific to CowField. It is how Star Battle works, so it carries over to any board you meet, under any of the names the puzzle goes by. Roughly in the order the moves tend to come up.':
    'Nada de esto es específico de CowField. Así funciona Star Battle, así que sirve para cualquier tablero que te encuentres, bajo cualquiera de los nombres que tiene el rompecabezas. Más o menos en el orden en que suelen aparecer las jugadas.',
  'Fence off every bull you place': 'Valla cada toro que pongas',
  'The moment a bull goes down, the eight cells around it are dead. Dot them. Those dots are what the next three techniques read. Turn on auto-place dots in Settings and the game does it for you.':
    'En cuanto cae un toro, las ocho casillas de alrededor están muertas. Márcalas con puntos. Esos puntos son lo que leen las tres técnicas siguientes. Activa «Puntos automáticos» en Ajustes y el juego lo hace por ti.',
  'A pen trapped in one row finishes that row': 'Un corral atrapado en una fila termina esa fila',
  'If a whole pen sits inside a single row, that pen has to spend its bulls in that row, and the row has no quota left for anyone else. Every other cell in the row is dead. The same works for columns, and it works with the pen only mostly contained too: what matters is where its empty cells are, not its full shape.':
    'Si un corral entero cabe dentro de una sola fila, ese corral tiene que gastar sus toros en esa fila, y a la fila no le queda cupo para nadie más. Todas las demás casillas de la fila están muertas. Lo mismo vale para las columnas, y vale también con el corral solo casi contenido: lo que importa es dónde están sus casillas vacías, no su forma completa.',
  'Count pens against rows': 'Cuenta corrales contra filas',
  'The strongest move in the game, and the one people miss. If three pens fit entirely inside three rows, those three rows are spoken for: every cell in them belonging to a fourth pen is dead. It reads backwards as well. If three rows only ever touch three pens, those pens are used up and cannot appear anywhere else on the board.':
    'La jugada más fuerte del juego, y la que se le escapa a la gente. Si tres corrales caben enteros dentro de tres filas, esas tres filas están comprometidas: toda casilla suya que pertenezca a un cuarto corral está muerta. También se lee al revés. Si tres filas solo tocan tres corrales, esos corrales están agotados y no pueden aparecer en ninguna otra parte del tablero.',
  'Watch where a pen has room left': 'Mira dónde le queda sitio a un corral',
  'A pen spread across five rows is not free if its remaining cells only sit in two of them. Needing two bulls in two rows claims both. On the two and three bull boards this is most of the work, because a pen with three bulls and barely enough room is almost solved already.':
    'Un corral repartido por cinco filas no está libre si sus casillas restantes solo caen en dos de ellas. Necesitar dos toros en dos filas reclama las dos. En los tableros de dos y tres toros esto es casi todo el trabajo, porque un corral con tres toros y sitio justo está casi resuelto.',
  'Start where the choices are fewest': 'Empieza donde haya menos opciones',
  'Small pens, corners and edges. A three-cell pen on a one-bull board offers three options; a twenty-cell pen offers twenty. Corners have fewer neighbours to rule out, so a bull placed there costs the board less. Open in the cramped part and the loose part solves itself later.':
    'Corrales pequeños, esquinas y bordes. Un corral de tres casillas en un tablero de un toro ofrece tres opciones; uno de veinte casillas ofrece veinte. Las esquinas tienen menos vecinas que descartar, así que un toro puesto ahí le cuesta menos al tablero. Abre por la parte apretada y la parte suelta se resuelve sola después.',
  'When nothing moves, assume one and follow it': 'Cuando nada se mueve, supón uno y síguelo',
  'Take a pen with two options left, pick one, and push the consequences until something breaks. If it breaks, the cell you picked is dead and you have learned something real. Place actual bulls while you do this rather than working it out in your head: an illegal one lights up the instant it lands, so the board tells you where the chain failed.':
    'Toma un corral al que le queden dos opciones, elige una y empuja las consecuencias hasta que algo se rompa. Si se rompe, la casilla que elegiste está muerta y has aprendido algo real. Pon toros de verdad mientras lo haces en vez de calcularlo mentalmente: uno ilegal se enciende en cuanto aterriza, así que el tablero te dice dónde falló la cadena.',
  'Go and try one': 'Ve a probar uno',

  'Board sizes': 'Tamaños de tablero',
  'Star Battle board sizes and difficulty': 'Tamaños y dificultad en Star Battle',
  'Five sizes, 200 levels each. Level 1 of light and level 173 of extreme are both one click away.':
    'Cinco tamaños, 200 niveles cada uno. El nivel 1 de muy fácil y el nivel 173 de extremo están los dos a un clic.',
  '200 levels': '200 niveles',
  '6x6 board, one bull per row, column and pen.': 'Tablero de 6x6, un toro por fila, columna y corral.',
  '8x8 board, one bull per row, column and pen.': 'Tablero de 8x8, un toro por fila, columna y corral.',
  '10x10 board, one bull per row, column and pen.':
    'Tablero de 10x10, un toro por fila, columna y corral.',
  '10x10 board, two bulls per row, column and pen.':
    'Tablero de 10x10, dos toros por fila, columna y corral.',
  '15x15 board, three bulls per row, column and pen.':
    'Tablero de 15x15, tres toros por fila, columna y corral.',
  'Where to start. Small enough to hold the whole board in your head while you work out what the dots do.':
    'Por dónde empezar. Lo bastante pequeño para tener el tablero entero en la cabeza mientras averiguas qué hacen los puntos.',
  'The same puzzle with more room to be wrong in. Rows stop being obvious and you start leaning on the pens.':
    'El mismo rompecabezas con más sitio para equivocarse. Las filas dejan de ser obvias y empiezas a apoyarte en los corrales.',
  'The size most Star Battle puzzles come in. If you have played this elsewhere, start here and it will feel familiar.':
    'El tamaño en el que vienen casi todos los rompecabezas Star Battle. Si has jugado a esto en otro sitio, empieza aquí y te resultará familiar.',
  'What most people mean by Two Not Touch. With two bulls per row, finding one bull no longer finishes the row.':
    'Lo que casi todo el mundo entiende por Dos estrellas. Con dos toros por fila, encontrar un toro ya no termina la fila.',
  '225 cells, 15 pens, 45 bulls. Expect to sit with one of these. They are also the boards that can have more than one valid answer.':
    '225 casillas, 15 corrales, 45 toros. Cuenta con sentarte un rato con uno de estos. Son también los tableros que pueden tener más de una respuesta válida.',
  'What changes when the star count goes up': 'Qué cambia cuando sube el número de estrellas',
  "A 6x6 board and a 10x10 board ask for the same work, just more of it. One bull per row and two bulls per row ask different questions. With one, finding a row's bull retires the row. With two, it tells you almost nothing on its own, because the second is still out there and the no-touching rule is all that holds it. That is the step from medium to hard, and again from hard to extreme.":
    'Un tablero de 6x6 y uno de 10x10 piden el mismo trabajo, solo que más. Un toro por fila y dos toros por fila hacen preguntas distintas. Con uno, encontrar el toro de una fila retira la fila. Con dos, por sí solo no te dice casi nada, porque el segundo sigue ahí fuera y lo único que lo sujeta es la regla de no tocarse. Ese es el salto de medio a difícil, y otra vez de difícil a extremo.',

  'About the project': 'El proyecto',
  'CowField is a side project by Volodymyr Mykhailiuk, a Star Battle puzzle built solo to try out new tools and to have one finished thing worth showing.':
    'CowField, proyecto personal de Volodymyr Mykhailiuk: un rompecabezas Star Battle hecho en solitario para probar herramientas nuevas y tener algo terminado.',
  'CowField is a personal project. I am Volodymyr Mykhailiuk, and I built it on my own, front to back.':
    'CowField es un proyecto personal. Soy Volodymyr Mykhailiuk, y lo he hecho yo solo, de principio a fin.',
  'Why a puzzle game': 'Por qué un juego de lógica',
  'A todo list would have been quicker. I play these puzzles, and the part I actually wanted to understand was how the boards get made. Whether a generator can be trusted to produce one with a single answer, and what checking that costs. Most of that question lives on the server, so building it was a way to get properly better at backend work. The front end got the rest of the attention, most of it spent calibrating things nobody is meant to notice.':
    'Una lista de tareas habría sido más rápida. Yo juego a estos rompecabezas, y la parte que de verdad quería entender era cómo se fabrican los tableros. Si se puede confiar en que un generador produzca uno con una sola respuesta, y cuánto cuesta comprobarlo. Casi toda esa pregunta vive en el servidor, así que construirlo fue una forma de mejorar de verdad en el backend. El frontend se llevó el resto de la atención, casi toda gastada en calibrar cosas que nadie debería notar.',
  'Something finished, not a demo': 'Algo terminado, no una demo',
  'I wanted one thing I could point at. A game a stranger can open and play without being told what it is, with everything a real product needs somewhere inside it, including the dull parts.':
    'Quería una cosa que pudiera señalar. Un juego que un desconocido pueda abrir y jugar sin que le expliquen qué es, con todo lo que necesita un producto de verdad en algún sitio dentro, incluidas las partes aburridas.',
  'Built alone, on purpose': 'Hecho en solitario, a propósito',
  'Working solo means every part is mine. The board rules, the generator and the solver, the API, the database schema, the layout, the copy, and both languages. There is nobody to hand the half I am worse at.':
    'Trabajar solo significa que cada parte es mía. Las reglas del tablero, el generador y el solucionador, la API, el esquema de la base de datos, la maquetación, los textos y todos los idiomas. No hay a quién pasarle la mitad que se me da peor.',
  'A place to try things': 'Un sitio donde probar cosas',
  'Small libraries I would otherwise never have a reason to install get tried out here, and a few of them I ended up writing myself once I had seen what they cost. The QR code in the share dialog is about 450 lines of Reed-Solomon and bit placement, with no dependency behind it.':
    'Aquí se prueban librerías pequeñas que de otro modo nunca tendría motivo para instalar, y algunas acabé escribiéndolas yo mismo una vez visto lo que costaban. El código QR del diálogo de compartir son unas 450 líneas de Reed-Solomon y colocación de bits, sin ninguna dependencia detrás.',
  'Learning the newer tooling': 'Aprender las herramientas nuevas',
  'The other thing I practise here is working well with the newer tools that sit alongside the editor. Getting something genuinely useful out of them is a skill of its own, and it only develops on a real project, where a bad decision has to be lived with for weeks.':
    'La otra cosa que practico aquí es trabajar bien con las herramientas nuevas que acompañan al editor. Sacarles algo genuinamente útil es una habilidad en sí misma, y solo se desarrolla en un proyecto real, donde hay que convivir con una mala decisión durante semanas.',
  'Getting in touch': 'Cómo contactar',
  'Or find me on Telegram as': 'O búscame en Telegram como',
  'If any of this is worth a message, mine is': 'Si algo de esto merece un mensaje, el mío es',
  '. Work, questions about how something here is built, or a bug you hit on level 143.':
    '. Trabajo, dudas sobre cómo está hecho algo de aquí, o un fallo que te hayas encontrado en el nivel 143.',
  'What it is built with': 'Con qué está hecho',
  'React, TypeScript and Vite in the browser. Express, Prisma and Postgres behind it. The board rules, the generator and the solver sit in one shared folder that both sides import, so the browser and the server can never disagree about what a legal board is. The site runs on Vercel and the API on Render.':
    'React, TypeScript y Vite en el navegador. Express, Prisma y Postgres por detrás. Las reglas del tablero, el generador y el solucionador están en una carpeta compartida que importan los dos lados, así que el navegador y el servidor nunca pueden discrepar sobre qué es un tablero legal. El sitio corre en Vercel y la API en Render.',

  'Adjust your preferences here.': 'Ajusta aquí tus preferencias.',
  'Sound effects': 'Efectos de sonido',
  'Enable sound effects.': 'Activar los efectos de sonido.',
  Music: 'Música',
  'Enable background music during play.': 'Activar la música de fondo durante la partida.',
  'Dark mode': 'Modo oscuro',
  'Switch to dark colours for playing in low light.':
    'Cambiar a colores oscuros para jugar con poca luz.',
  'Choose the language used across the game.': 'Elige el idioma que usa todo el juego.',
  'Switch to dark mode': 'Cambiar a modo oscuro',
  'Switch to light mode': 'Cambiar a modo claro',
  'Take your time': 'Tómate tu tiempo',
  'Hide the timers so nothing on screen is counting.':
    'Esconde los cronómetros para que nada en pantalla esté contando.',
  'Auto-place dots': 'Puntos automáticos',
  'Ring each bull with dots the moment you place it.':
    'Rodea cada toro con puntos en cuanto lo colocas.',
  'Player statistics': 'Estadísticas del jugador',
  'Most progress': 'Mayor progreso',
  'No data': 'Sin datos',
  'Completed levels': 'Niveles completados',
  'Placed bulls': 'Toros colocados',
  'Total completion time': 'Tiempo total',
  'Performance breakdown by difficulty:': 'Desglose por dificultad:',
  Difficulty: 'Dificultad',
  'Fastest level': 'Nivel más rápido',
  'Average per level': 'Media por nivel',
  'No completed level': 'Ningún nivel completado',
  // Spanish has the same two categories as English: `one` and `other`.
  '{{count}} completed levels': '{{count}} niveles completados',
  '{{count}} completed levels_one': '{{count}} nivel completado',
  '{{count}} completed levels_other': '{{count}} niveles completados',
  'The requested level route is invalid.': 'La ruta de nivel solicitada no es válida.',
  'This level does not exist yet.': 'Este nivel todavía no existe.',
  'Create level': 'Crear nivel',
  'Edit level': 'Editar nivel',
  'Remaining bulls': 'Toros restantes',
  Timer: 'Cronómetro',
  Back: 'Atrás',
  'Failed to load level data.': 'No se han podido cargar los datos del nivel.',
  'Admin role is required to create or edit levels.':
    'Hace falta el rol de administrador para crear o editar niveles.',
  'Fix those problems and try again.': 'Corrige esos problemas e inténtalo de nuevo.',
  'Add a level title.': 'Añade un título al nivel.',
  'Grid size must stay {{size}} x {{size}} for {{difficulty}}.':
    'La cuadrícula debe seguir siendo de {{size}} x {{size}} para {{difficulty}}.',
  'The pen grid is incomplete.': 'La cuadrícula de corrales está incompleta.',
  'The authored bull layout is incomplete.': 'La disposición de toros creada está incompleta.',
  'Every cell must belong to a pen.': 'Cada casilla debe pertenecer a un corral.',
  'A {{size}} x {{size}} level must use exactly {{size}} pens.':
    'Un nivel de {{size}} x {{size}} debe usar exactamente {{size}} corrales.',
  'Pen {{penId}} is too small for {{count}} bull placements.':
    'El corral {{penId}} es demasiado pequeño para {{count}} toros.',
  'Pen {{penId}} is too small for {{count}} bull placements._one':
    'El corral {{penId}} es demasiado pequeño para {{count}} toro.',
  'Pen {{penId}} is too small for {{count}} bull placements._other':
    'El corral {{penId}} es demasiado pequeño para {{count}} toros.',
  'Pen {{penId}} must be one connected region.':
    'El corral {{penId}} debe ser una sola región conectada.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}.':
    'La disposición creada debe colocar exactamente {{count}} toros para {{difficulty}}.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._one':
    'La disposición creada debe colocar exactamente {{count}} toro para {{difficulty}}.',
  'The authored bull layout must place exactly {{count}} bulls for {{difficulty}}._other':
    'La disposición creada debe colocar exactamente {{count}} toros para {{difficulty}}.',
  'Each row must contain exactly {{count}} bulls.':
    'Cada fila debe contener exactamente {{count}} toros.',
  'Each row must contain exactly {{count}} bulls._one':
    'Cada fila debe contener exactamente {{count}} toro.',
  'Each row must contain exactly {{count}} bulls._other':
    'Cada fila debe contener exactamente {{count}} toros.',
  'Each column must contain exactly {{count}} bulls.':
    'Cada columna debe contener exactamente {{count}} toros.',
  'Each column must contain exactly {{count}} bulls._one':
    'Cada columna debe contener exactamente {{count}} toro.',
  'Each column must contain exactly {{count}} bulls._other':
    'Cada columna debe contener exactamente {{count}} toros.',
  'Pen {{penId}} must contain exactly {{count}} bulls.':
    'El corral {{penId}} debe contener exactamente {{count}} toros.',
  'Pen {{penId}} must contain exactly {{count}} bulls._one':
    'El corral {{penId}} debe contener exactamente {{count}} toro.',
  'Pen {{penId}} must contain exactly {{count}} bulls._other':
    'El corral {{penId}} debe contener exactamente {{count}} toros.',
  'Bulls may not touch, including diagonally.':
    'Los toros no pueden tocarse, tampoco en diagonal.',
  'This level has no valid solution.': 'Este nivel no tiene ninguna solución válida.',
  'Level saved': 'Nivel guardado',
  'Failed to save level.': 'No se ha podido guardar el nivel.',
  'Failed to delete level.': 'No se ha podido eliminar el nivel.',
  'Deleting...': 'Eliminando...',
  'Delete level': 'Eliminar nivel',
  'Discard unsaved changes?': '¿Descartar los cambios sin guardar?',
  'This level has unsaved changes. Leaving now discards them.':
    'Este nivel tiene cambios sin guardar. Si sales ahora se descartan.',
  'This level has unsaved changes. This action replaces the board and discards them.':
    'Este nivel tiene cambios sin guardar. Esta acción sustituye el tablero y los descarta.',
  'Leave and discard': 'Salir y descartar',
  Discard: 'Descartar',
  'Delete level?': '¿Eliminar el nivel?',
  'Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.':
    '¿Eliminar el nivel {{levelNumber}} de {{difficulty}}? Esto borra el archivo de nivel del proyecto.',
  'Board cleared': 'Tablero vaciado',
  'Validation passed': 'Validación correcta',
  'Exactly one solution.': 'Exactamente una solución.',
  'This level has more than one solution.': 'Este nivel tiene más de una solución.',
  'Found {{count}} solutions. A good level has exactly one.':
    'Se han encontrado {{count}} soluciones. Un buen nivel tiene exactamente una.',
  'Found {{count}} solutions. A good level has exactly one._one':
    'Se ha encontrado {{count}} solución. Un buen nivel tiene exactamente una.',
  'Found {{count}} solutions. A good level has exactly one._other':
    'Se han encontrado {{count}} soluciones. Un buen nivel tiene exactamente una.',
  // "más de N" reads as plural at every count, so both variants carry the plural wording, for the
  // same reason `en.ts` spells both of these out.
  'Found {{count}}+ solutions. A good level has exactly one.':
    'Se han encontrado más de {{count}} soluciones. Un buen nivel tiene exactamente una.',
  'Found {{count}}+ solutions. A good level has exactly one._one':
    'Se han encontrado más de {{count}} soluciones. Un buen nivel tiene exactamente una.',
  'Found {{count}}+ solutions. A good level has exactly one._other':
    'Se han encontrado más de {{count}} soluciones. Un buen nivel tiene exactamente una.',
  'Generate builds a level with exactly one solution.':
    'Generar construye un nivel con exactamente una solución.',
  'Generation ran out of time. Try again.':
    'La generación se quedó sin tiempo. Inténtalo de nuevo.',
  'The generator searches for a board with exactly one solution, which takes longer on medium and hard.':
    'El generador busca un tablero con exactamente una solución, lo que tarda más en medio y difícil.',
  'Nothing on the board was changed, so you can run Generate again.':
    'No se cambió nada del tablero, así que puedes volver a ejecutar Generar.',
  'Level generated': 'Nivel generado',
  'Generating...': 'Generando...',
  'Create/Edit Level': 'Crear/editar nivel',
  Generate: 'Generar',
  'Validate level': 'Validar nivel',
  'Validating...': 'Validando...',
  'Save level': 'Guardar nivel',
  'Clear board': 'Vaciar tablero',
  'Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.':
    'Elige un color y luego haz clic en las casillas para asignarlas a esa región. Cada casilla debe pertenecer a algún color antes de poder guardar el nivel, y dentro de cada color van las vacas. Este tablero necesita exactamente {{gridSize}} colores conectados y {{requiredCowCount}} vacas.',
  'Color palette': 'Paleta de colores',
  Erase: 'Borrar',
  Cow: 'Vaca',
  'Color {{colorId}}': 'Color {{colorId}}',
  'Level color editor': 'Editor de colores del nivel',
  Profile: 'Perfil',
  Guest: 'Invitado',
  User: 'Usuario',
  'Preview role': 'Rol de vista previa',
  'Log out': 'Cerrar sesión',
  Login: 'Iniciar sesión',
  'Sign in with your email and password, create an account, or continue as a guest.':
    'Inicia sesión con tu correo y tu contraseña, crea una cuenta, o sigue como invitado.',
  Email: 'Correo electrónico',
  Password: 'Contraseña',
  'Log in': 'Entrar',
  'Continue with Google': 'Continuar con Google',
  'Completing Google login...': 'Completando el inicio de sesión con Google...',
  'Verifying your email...': 'Verificando tu correo...',
  'Play as guest': 'Jugar como invitado',
  'Ready when you are': 'Cuando quieras',
  'Play right away without an account, or make one so your times follow you between devices.':
    'Juega ya mismo sin cuenta, o crea una para que tus tiempos te sigan entre dispositivos.',
  Share: 'Compartir',
  'Play this Star Battle level on CowField': 'Juega a este nivel de Star Battle en CowField',
  'Link copied.': 'Enlace copiado.',
  "Couldn't share this level.": 'No se ha podido compartir este nivel.',
  'Sign in': 'Iniciar sesión',
  'Your guest progress stays here': 'Tu progreso de invitado se queda aquí',
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._one':
    'Iniciar sesión deja atrás el nivel que has terminado como invitado en este dispositivo. Crea una cuenta y se viene contigo.',
  'Signing in leaves behind the {{count}} levels you finished as a guest on this device. Create an account instead and they come with you._other':
    'Iniciar sesión deja atrás los {{count}} niveles que has terminado como invitado en este dispositivo. Crea una cuenta y se vienen contigo.',
  'Sign in anyway': 'Iniciar sesión de todos modos',
  'Statistics is available only for logged users.':
    'Las estadísticas solo están disponibles para usuarios con la sesión iniciada.',
  'Create account': 'Crear cuenta',
  'Forgot password?': '¿Olvidaste tu contraseña?',
  'Passwords do not match.': 'Las contraseñas no coinciden.',
  'Request failed.': 'La petición ha fallado.',
  'Create a user account with your email and password.':
    'Crea una cuenta de usuario con tu correo y tu contraseña.',
  'Confirm password': 'Confirmar contraseña',
  'Back to login': 'Volver al inicio de sesión',
  'Reset password': 'Restablecer contraseña',
  'Enter your email and we will send you a password reset link.':
    'Introduce tu correo y te enviaremos un enlace para restablecer la contraseña.',
  'If the account exists, a reset link has been sent to that email address.':
    'Si la cuenta existe, se ha enviado un enlace de restablecimiento a esa dirección.',
  'Send reset link': 'Enviar el enlace',
  'I already have a reset link': 'Ya tengo un enlace',
  'Your password has been updated.': 'Tu contraseña se ha actualizado.',
  'Open the reset link from your email and choose a new password.':
    'Abre el enlace de tu correo y elige una contraseña nueva.',
  'Reset token': 'Código de restablecimiento',
  'New password': 'Contraseña nueva',
  'Save new password': 'Guardar la contraseña nueva',
  'Account created. Check your email to verify it before logging in.':
    'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.',
  'Verification email sent again.': 'Correo de verificación reenviado.',
  'Resend verification email': 'Reenviar el correo de verificación',
  'Show password': 'Mostrar la contraseña',
  'Hide password': 'Ocultar la contraseña',
  'You are playing as a Guest.': 'Estás jugando como invitado.',
  'This browser is blocking saved data, so these choices will reset when you close the tab.':
    'Este navegador está bloqueando los datos guardados, así que estas opciones se restablecerán al cerrar la pestaña.',
  'Incorrect email or password.': 'Correo o contraseña incorrectos.',
  'Too many requests. Try again in a moment.':
    'Demasiadas peticiones. Inténtalo de nuevo en un momento.',
  'Too many attempts. Wait a few minutes and try again.':
    'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'Guests cannot access this resource.': 'Los invitados no pueden acceder a este recurso.',
  'Invalid email or password': 'Correo o contraseña incorrectos.',
  'User already exists': 'Ya existe una cuenta con ese correo.',
  'Email not verified': 'Correo sin verificar.',
  'Invalid token': 'Este enlace ya no es válido. Pide uno nuevo.',
  'Password too short': 'Esa contraseña es demasiado corta. Usa al menos 8 caracteres.',
  'Password too long': 'Esa contraseña es demasiado larga.',
  'Failed to restore session after login.':
    'No se ha podido restaurar la sesión después de iniciar sesión.',
  'Google login failed.': 'El inicio de sesión con Google ha fallado.',
  'Sign-in failed. Try again.': 'El inicio de sesión ha fallado. Inténtalo de nuevo.',
  "Couldn't create your account. Try again.":
    'No se ha podido crear tu cuenta. Inténtalo de nuevo.',
  "Couldn't send the reset link. Try again.":
    'No se ha podido enviar el enlace. Inténtalo de nuevo.',
  "Couldn't update your password. Try again.":
    'No se ha podido actualizar tu contraseña. Inténtalo de nuevo.',
  'What is CowField?': '¿Qué es CowField?',
  'Back to your levels': 'Volver a tus niveles',
  'Email verification failed.': 'La verificación del correo ha fallado.',
  'Your email is verified. You can log in now.':
    'Tu correo está verificado. Ya puedes iniciar sesión.',
  'Neon Auth is not configured.': 'Neon Auth no está configurado.',
  'Invalid request payload.': 'Los datos de la petición no son válidos.',
  'Level complete': 'Nivel completado',
  'Best time: {{time}}': 'Mejor tiempo: {{time}}',
  'New best time.': 'Nuevo mejor tiempo.',
  "Couldn't save your progress. Check your connection and try again.":
    'No se ha podido guardar tu progreso. Revisa tu conexión e inténtalo de nuevo.',
  'Try again': 'Reintentar',
  'You completed the last available level.': 'Has completado el último nivel disponible.',
  'Your progress has been saved.': 'Tu progreso se ha guardado.',
  'Saving your progress...': 'Guardando tu progreso...',

  'Something went wrong. Reloading the page usually fixes it.':
    'Algo ha salido mal. Recargar la página suele arreglarlo.',
  'Reload the page': 'Recargar la página',
  "Couldn't load your progress. Check your connection and try again.":
    'No se ha podido cargar tu progreso. Revisa tu conexión e inténtalo de nuevo.',
  "Couldn't load these levels. Check your connection and try again.":
    'No se han podido cargar estos niveles. Revisa tu conexión e inténtalo de nuevo.',
  "Couldn't load your statistics. Check your connection and try again.":
    'No se han podido cargar tus estadísticas. Revisa tu conexión e inténtalo de nuevo.',
  "Couldn't load this level. Check your connection and try again.":
    'No se ha podido cargar este nivel. Revisa tu conexión e inténtalo de nuevo.',
} as const

export default es
