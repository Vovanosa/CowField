const en = {
  Bullpen: 'Bullpen',

  // ---------------------------------------------------------------------------------------------
  // The landing page (P14 item 84) — the only page a stranger, or a crawler, can read.
  //
  // This block is deliberately prose rather than labels: it is the site's entire indexable content.
  // Before it existed, every URL rendered the login form and the whole site was 31 words. The genre
  // words matter as much as the wording — nobody searches "Bullpen", people search "Star Battle"
  // and "Two Not Touch".
  // ---------------------------------------------------------------------------------------------
  'Star Battle logic puzzle': 'Star Battle logic puzzle',
  'Bullpen — a calm Star Battle puzzle': 'Bullpen — a calm Star Battle puzzle',
  'Play Bullpen, a calm Star Battle (Two Not Touch) logic puzzle. 800 hand-checked levels across four difficulties, each with exactly one solution. No account needed, no timer pressure.':
    'Play Bullpen, a calm Star Battle (Two Not Touch) logic puzzle. 800 hand-checked levels across four difficulties, each with exactly one solution. No account needed, no timer pressure.',
  'A grid divided into coloured pens. Place the bulls so every row, every column and every pen holds exactly its quota — and no two bulls ever touch, not side by side and not diagonally through a corner.':
    'A grid divided into coloured pens. Place the bulls so every row, every column and every pen holds exactly its quota — and no two bulls ever touch, not side by side and not diagonally through a corner.',
  'Play now': 'Play now',
  'Starting...': 'Starting...',
  'Sign in to save your progress': 'Sign in to save your progress',
  'No account, no email. Play as a guest right away.':
    'No account, no email. Play as a guest right away.',
  'Waking the server — the first visit after a quiet spell takes a moment.':
    'Waking the server — the first visit after a quiet spell takes a moment.',
  "Couldn't start a game. Check your connection and try again.":
    "Couldn't start a game. Check your connection and try again.",
  'The rules, in three lines': 'The rules, in three lines',
  'Every row, column and pen holds its exact quota of bulls.':
    'Every row, column and pen holds its exact quota of bulls.',
  'No two bulls may touch — not side by side, not diagonally.':
    'No two bulls may touch — not side by side, not diagonally.',
  'Dots are notes for yourself. They never count as bulls.':
    'Dots are notes for yourself. They never count as bulls.',
  'Read the full rules': 'Read the full rules',
  'Made to be unhurried': 'Made to be unhurried',
  'Nothing here rushes you. A clock runs if you want to race yourself, and "take your time" switches it off entirely. A bull that breaks a rule is highlighted the moment you place it, so you can try an idea and see the answer rather than second-guessing yourself — and it only ever tells you what is illegal, never what is correct, so the puzzle stays yours to solve.':
    'Nothing here rushes you. A clock runs if you want to race yourself, and "take your time" switches it off entirely. A bull that breaks a rule is highlighted the moment you place it, so you can try an idea and see the answer rather than second-guessing yourself — and it only ever tells you what is illegal, never what is correct, so the puzzle stays yours to solve.',
  'There are 800 levels across four difficulties: light on a 6x6 grid, easy on 8x8, medium on 10x10, and hard on 10x10 with two bulls in every row, column and pen. Every board is generated and then re-checked to have exactly one solution, so a level that looks impossible can always be reasoned out. Star Battle players may know this puzzle as Two Not Touch.':
    'There are 800 levels across four difficulties: light on a 6x6 grid, easy on 8x8, medium on 10x10, and hard on 10x10 with two bulls in every row, column and pen. Every board is generated and then re-checked to have exactly one solution, so a level that looks impossible can always be reasoned out. Star Battle players may know this puzzle as Two Not Touch.',
  '800 levels': '800 levels',
  '4 difficulties': '4 difficulties',
  'Exactly one solution each': 'Exactly one solution each',
  'No account needed': 'No account needed',
  'A Bullpen board: a grid of coloured pens with bulls and dot notes placed on it.':
    'A Bullpen board: a grid of coloured pens with bulls and dot notes placed on it.',

  // The not-found view, which replaced a silent redirect to `/`.
  'Page not found': 'Page not found',
  'That link does not lead anywhere.': 'That link does not lead anywhere.',
  'Back to the start': 'Back to the start',

  // Page descriptions — `<meta name="description">`, so ~150-160 characters each. Only the two
  // public pages genuinely need one; the rest are `noindex` and carry a title alone.
  'The full rules of Bullpen: how bulls, rows, columns and pens work, what the dots are for, and how the four difficulties differ.':
    'The full rules of Bullpen: how bulls, rows, columns and pens work, what the dots are for, and how the four difficulties differ.',
  'Loading...': 'Loading...',
  Hidden: 'Hidden',
  'Back to home': 'Back to home',
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
  'Home menu': 'Home menu',
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
  'Level Select': 'Level Select',
  'Choose a difficulty to play.': 'Choose a difficulty to play.',
  'Available levels': 'Available levels',
  'Unknown difficulty.': 'Unknown difficulty.',
  'Choose one of the available difficulty groups to browse levels.':
    'Choose one of the available difficulty groups to browse levels.',
  Levels: 'Levels',
  '{{difficulty}} Levels': '{{difficulty}} Levels',
  Previous: 'Previous',
  Next: 'Next',
  'Page {{page}} of {{totalPages}}': 'Page {{page}} of {{totalPages}}',
  '{{completed}}/{{total}} completed': '{{completed}}/{{total}} completed',
  '{{percent}}% done': '{{percent}}% done',
  'Open level {{levelNumber}}': 'Open level {{levelNumber}}',
  'Edit level {{levelNumber}}': 'Edit level {{levelNumber}}',
  'This level is locked. Complete the previous level first to open it.':
    'This level is locked. Complete the previous level first to open it.',
  'About the game': 'About the game',
  'Bullpen is a calm logic puzzle about placing bulls on a colored board. It is meant to feel thoughtful and relaxing: no rushing, no stressing, just slowly noticing where each bull can and cannot go.':
    'Bullpen is a calm logic puzzle about placing bulls on a colored board. It is meant to feel thoughtful and relaxing: no rushing, no stressing, just slowly noticing where each bull can and cannot go.',
  'How cell marks work': 'How cell marks work',
  'Each cell changes like this:': 'Each cell changes like this:',
  empty: 'empty',
  'dot note': 'dot note',
  bull: 'bull',
  'The purpose of the game is simple: place the correct number of bulls so the whole board works at once. Every row must contain the required number of bulls, every column must contain the required number of bulls, and every colored pen must also contain the required number of bulls.':
    'The purpose of the game is simple: place the correct number of bulls so the whole board works at once. Every row must contain the required number of bulls, every column must contain the required number of bulls, and every colored pen must also contain the required number of bulls.',
  'There is one more important rule: bulls may not touch each other in any direction. That means not from the side, not from above or below, and not even diagonally at the corners. If two bulls are neighboring cells, the placement is wrong.':
    'There is one more important rule: bulls may not touch each other in any direction. That means not from the side, not from above or below, and not even diagonally at the corners. If two bulls are neighboring cells, the placement is wrong.',
  'Light, easy, and medium use 1 bull per row, column, and pen.':
    'Light, easy, and medium use 1 bull per row, column, and pen.',
  'Hard uses 2 bulls per row, column, and pen.':
    'Hard uses 2 bulls per row, column, and pen.',
  'Dots are just notes and never count as bulls.':
    'Dots are just notes and never count as bulls.',
  'You win with correct bull placement only.':
    'You win with correct bull placement only.',
  'A good way to play is to use dots as reminders for yourself while you test ideas. You are free to place bulls even when they are wrong: any bull that breaks a rule is highlighted straight away, so you can spot it and move on. You do not need to clean up every unused cell before finishing a level.':
    'A good way to play is to use dots as reminders for yourself while you test ideas. You are free to place bulls even when they are wrong: any bull that breaks a rule is highlighted straight away, so you can spot it and move on. You do not need to clean up every unused cell before finishing a level.',
  'In Settings, you can make play more comfortable: turn on take your time to hide visible timers, use auto-place dots for extra note help, switch to dark mode, and enable sound effects or music with volume controls. If you are playing as a guest, take your time stays on automatically.':
    'In Settings, you can make play more comfortable: turn on take your time to hide visible timers, use auto-place dots for extra note help, switch to dark mode, and enable sound effects or music with volume controls. If you are playing as a guest, take your time stays on automatically.',
  'The fun of Bullpen is in that quiet moment when a crowded board starts making sense. Start small, trust the rules, and let the pattern appear one bull at a time.':
    'The fun of Bullpen is in that quiet moment when a crowded board starts making sense. Start small, trust the rules, and let the pattern appear one bull at a time.',
  'Adjust your preferences here.':
    'Adjust your preferences here.',
  'Sound effects': 'Sound effects',
  'Enable sound effects.':
    'Enable sound effects.',
  Music: 'Music',
  'Enable background music during play.': 'Enable background music during play.',
  'Dark mode': 'Dark mode',
  'Use a darker visual theme for low-light play.':
    'Use a darker visual theme for low-light play.',
  'Choose the language used across the game.': 'Choose the language used across the game.',
  'Switch to dark mode': 'Switch to dark mode',
  'Switch to light mode': 'Switch to light mode',
  'Take your time': 'Take your time',
  'Hide visible timers so play can stay fully relaxed.':
    'Hide visible timers so play can stay fully relaxed.',
  'Auto-place dots': 'Auto-place dots',
  'Automatically place helper dots around confirmed bull placements.':
    'Automatically place helper dots around confirmed bull placements.',
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
  'Failed to restore session after login.': 'Failed to restore session after login.',
  'Google login failed.': 'Google login failed.',
  // Shown instead of `?error=` when the address bar carries something we do not ship a string for.
  // Everything above is the allowlist `translateKnownAuthMessage` checks against.
  'Sign-in failed. Try again.': 'Sign-in failed. Try again.',
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
