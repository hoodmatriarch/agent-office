import { LEARNING } from './learning';
import { STUDIO_LESSONS } from '../studios/guide';
export interface Lesson {
  id: string;
  icon: string;
  title: string;
  words: string;
  what: string;
  why: string;
  steps: string[];
  example?: string;
  term?: string;
  at?: [number, number];
}

/** Written for someone opening their first coding tool. No commands or model calls required. */
export const LESSONS: Lesson[] = [
  {
    id: 'start', icon: '👋', title: 'Start here: your first task', words: 'begin beginner first task help lost how start build website app',
    what: 'Think of this office as a workshop. You explain what you want; a coding worker tries to build it. You are the person deciding what “good” looks like.',
    why: 'You do not need to write code to give a useful instruction. A small, clear request is a good place to begin.',
    steps: ['Walk to an empty desk and press E.', 'Pick a signed-in worker, such as Codex. Tell it one small thing to build.', 'Ask it to explain its plan before making changes. Check the result and say what you want changed.'],
    example: 'I am new to coding. Make a simple page with my name and a welcome message. First explain your plan in plain English. Tell me how to view the result.',
    term: 'A prompt is simply the instruction you give a worker.', at: [-4.5, 0],
  },
  ...LEARNING,
  ...STUDIO_LESSONS,
  {
    id: 'projects', icon: '🏢', title: 'Floors and repositories', words: 'floor project repository repo github folder elevator files',
    what: 'Each floor is one project. A repository, often shortened to “repo,” is that project’s files plus a record of changes.',
    why: 'Floors keep separate projects apart. Workers on this floor work in this project’s folder.',
    steps: ['Use the elevator to pick a different project or add another one.', 'Look at the floor name at the top of the screen to see where you are.', 'Your first project is The-Office; it can hold the things you ask workers to build.'],
    term: 'Cloning means making a local copy of a GitHub repository.', at: [8.5, -8.8],
  },
  {
    id: 'workers', icon: '🤖', title: 'Workers and desks', words: 'worker agent codex claude model hire desk assistant ai subscription signed provider',
    what: 'A worker is a coding assistant sitting at a desk. Codex and Claude Code are different tools you can choose for that worker.',
    why: 'Workers can read files, suggest a plan, write code, and check what they built. They can also make mistakes, so checking the result matters.',
    steps: ['Press E at an empty desk to hire a worker.', 'Describe the result you want, rather than trying to name programming commands.', 'A red beacon means a worker needs your attention. Press N to go to a worker waiting for you.'],
    example: 'Before changing anything, tell me what you think I want and ask if any important detail is missing.',
    term: 'A model is the AI engine used by the worker. Worker use can count against your subscription or API allowance.', at: [-4.5, 0],
  },
  {
    id: 'terminal', icon: '💻', title: 'The terminal: a worker’s notebook', words: 'terminal console command shell black screen text error log output enter',
    what: 'The terminal is the scrolling text screen on a worker’s computer. It shows what the worker is doing and lets you send it instructions.',
    why: 'It is useful for seeing progress, answering a question, or reading an error. You do not need to understand every line.',
    steps: ['Open the worker’s computer to read its terminal.', 'If it asks you a question, type an answer and press Enter.', 'At an empty desk, B opens a shell instead of a coding worker. A shell expects computer commands, so ask a worker to explain a command before using it.'],
    example: 'Explain the last error like I am new to coding. What caused it, and what should we try next?',
    term: 'An error is a message saying something did not work. A log is a record of what happened.', at: [-4.5, 0],
  },
  {
    id: 'issues', icon: '📝', title: 'Issues: things you want done', words: 'issue problem bug fix feature request todo idea task list',
    what: 'An issue is a written note about a problem, an idea, or a job. The Issues board shows the project’s notes from GitHub.',
    why: 'Writing a note keeps the goal clear and gives everyone somewhere to discuss it.',
    steps: ['Press E at the Issues board to open it.', 'Describe what happens now and what you want instead.', 'Use “Ask a worker” on an issue to discuss it, or put the work on the task queue.'],
    example: 'The welcome button does nothing when I click it. I want it to show “Hello!” Please explain how you will fix it.',
    term: 'A bug is something that behaves differently from what you intended.', at: [-11.7, -10],
  },
  {
    id: 'queue', icon: '📋', title: 'Task queue: the work waiting in line', words: 'queue backlog waiting assignment schedule tasks next board automatic',
    what: 'The queue is a list of jobs waiting to be assigned to workers. It is a work organizer, not a calendar reminder.',
    why: 'It helps you give the office several jobs without juggling every desk yourself.',
    steps: ['Press E at the Task queue board.', 'Write one clear outcome per task.', 'The queue’s board agent helps organize tasks. Workers picked up by the queue do the coding.'],
    example: 'Split this into three small tasks: make a welcome page, add a contact section, then check that it works on a phone.',
    term: 'A backlog is just a list of jobs that have not been finished.', at: [-3.9, -10],
  },
  {
    id: 'changes', icon: '🔎', title: 'Changes: inspect what was edited', words: 'changes diff edited files review code commit save compare',
    what: 'The Changes window shows which project files a worker edited. A diff compares the old text with the new text.',
    why: 'You can check the proposed work before deciding to keep or share it.',
    steps: ['Face the worker’s desk and press C.', 'Ask the worker to summarize the changes and explain how it checked them.', 'Try the result yourself. Ask for adjustments if something is wrong.'],
    example: 'Summarize what you changed without programming jargon. What should I click to check it?',
    term: 'A commit is a saved checkpoint in the project’s history.', at: [-4.5, 0],
  },
  {
    id: 'pulls', icon: '📬', title: 'Pull requests: a proposal to keep changes', words: 'pull request pr merge branch review approve publish github',
    what: 'A pull request, or PR, is a proposal to bring one set of changes into the project’s main version.',
    why: 'It gives you a place to review the changes and discuss them before combining them.',
    steps: ['Press E at the Pull Requests board, or O at a worker’s desk.', 'Read the summary, check the result, and ask questions.', 'Merging means accepting those changes into the target branch. It does not automatically put a website on the internet.'],
    example: 'Explain this pull request in everyday language. What will look or behave differently after I accept it?',
    term: 'A branch is a separate line of changes. A worktree is a separate folder for working on one.', at: [3.9, -10],
  },
  {
    id: 'services', icon: '🌐', title: 'Services: see what you built', words: 'service server preview website app browser localhost port running view result',
    what: 'A service is a program running on the office’s computer, such as a website preview. The Services board helps you find it.',
    why: 'A worker can finish writing files before there is anything visible to click. Starting a preview lets you try the result.',
    steps: ['Ask your worker to start a preview and give you the link.', 'Press E at the Services board to see running services.', 'Open the link and try the buttons. Describe any problem in ordinary words.'],
    example: 'Start a preview of the page you built and tell me which link to open. Explain what I should test.',
    term: 'Localhost means this computer. A port is a numbered doorway to a running program.', at: [15, -8.2],
  },
  {
    id: 'github', icon: '🐙', title: 'GitHub and sign-ins', words: 'github gh login authentication account permission repository remote password',
    what: 'GitHub keeps repositories online. Git is the tool that records file changes; gh is a tool this office uses to talk to GitHub.',
    why: 'The boards and project picker need a GitHub sign-in to read your repositories and make changes you request.',
    steps: ['The office’s login and your GitHub login are separate things.', 'If a board says you are signed out, check “Your sign-ins” in the menu or ask for help with the machine’s gh login.', 'A coding worker may need its own Codex or Claude sign-in too.'],
    term: 'Authentication is simply proving which account is yours.', at: [8.5, -8.8],
  },
  {
    id: 'controls', icon: '🎮', title: 'Getting around and opening things', words: 'controls keyboard mouse walk camera move interact menu help lost shortcut',
    what: 'You can explore the office like a simple game. Things you can use show a hint when you face them or stand nearby.',
    why: 'Most tools are available through the room itself or the menu. You do not have to remember every shortcut.',
    steps: ['Use W, A, S, D or the arrow keys to walk. Move the mouse to look in first-person view.', 'Press E at something to use it. Tab opens the menu; Esc closes a window.', 'Press F2 to ask Pip from anywhere. N finds a worker that needs you.'], at: [8.5, -8.8],
  },
  {
    id: 'settings', icon: '⚙️', title: 'Settings and useful extras', words: 'settings volume mute view first third person notifications voice dictation budget limits',
    what: 'Settings let you change how the office feels: the view, sound, notifications, and other preferences.',
    why: 'You can make the room comfortable before doing any work.',
    steps: ['Press Tab, then choose Settings.', 'Choose first-person or third-person view, and adjust or mute the sound.', 'In a worker’s prompt or terminal, Ctrl+Space lets you dictate if your browser supports it. The Spend and Limits panels help you monitor usage.'],
    term: 'Dictation turns what you say into text for you to check and send.',
  },
  {
    id: 'together', icon: '🤝', title: 'Whiteboard, chat, voice, and TV', words: 'whiteboard draw chat message voice talk microphone screen share tv together teammate',
    what: 'These are tools for sharing ideas with other people in the office. They are different from giving a coding worker a prompt.',
    why: 'You can draw a rough layout, explain an idea out loud, or show someone your screen.',
    steps: ['Press E at the whiteboard to draw; T opens chat.', 'Use the menu to join voice. V and M also control voice and microphone functions.', 'The lounge TV displays a shared screen. Only share the window you mean to show.'],
    term: 'Screen sharing lets others see what is displayed in a window or on your screen.', at: [6, -3.2],
  },
  {
    id: 'breaks', icon: '☕', title: 'Break time and the boss’s office', words: 'boss music minesweeper intro coffee dog arcade game jukebox bar rooftop recreation',
    what: 'The office also has places to relax: a dog, coffee, games, music, and the upstairs boss’s room.',
    why: 'These make the space more fun. They are separate from the project’s files and coding tasks.',
    steps: ['Press E at the dog to pet it, or at the coffee machine for coffee.', 'The lounge arcade and jukebox have their own E interactions.', 'Upstairs, sit in the boss’s chair for Minesweeper. The World’s Best Boss plaque opens the intro-video and room-volume controls.'], at: [1.5, 9.5],
  },
];

export const TOUR = ['projects', 'workers', 'issues', 'queue', 'pulls', 'services', 'together', 'breaks'] as const;
export const lessonById = (id: string): Lesson => LESSONS.find(lesson => lesson.id === id) ?? LESSONS.find(lesson => lesson.id === 'start')!;

/** Match the whole phrase or useful words; “what is a pull request?” must not match every article. */
export function findLessons(query: string): Lesson[] {
  const words = query.toLowerCase().match(/[a-z0-9]+/g)?.filter(word => word.length > 2 && !['what', 'the', 'and', 'how', 'can', 'you', 'does', 'are', 'this', 'explain'].includes(word)) ?? [];
  if (!words.length) return LESSONS;
  return LESSONS.map(lesson => {
    const title = lesson.title.toLowerCase();
    const text = `${title} ${lesson.words}`;
    return { lesson, score: words.reduce((score, word) => score + (title.includes(word) ? 3 : text.includes(word) ? 1 : 0), 0) };
  }).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score).map(hit => hit.lesson);
}
