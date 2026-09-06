const en = {
  Bullpen: 'Bullpen',
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
