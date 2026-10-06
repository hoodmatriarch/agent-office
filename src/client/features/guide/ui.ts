import { h, openModal, type Modal } from '../../ui/dom';
import { findLessons, lessonById, TOUR, type Lesson } from './lessons';
import './ui.css';

export interface GuideActions {
  canTour(): boolean;
  current(): number;
  start(): void;
  next(): void;
  stop(): void;
  visit(lesson: Lesson): void;
}

/** A small, free reference library: search and read without having to run a coding agent. */
export class GuideHelp {
  private modal: Modal | null = null;
  constructor(private readonly actions: GuideActions) {}

  show(id = 'start') {
    if (this.modal) return;
    let selected = lessonById(id);
    const search = h('input', { type: 'search', placeholder: 'Try “first task” or “pull request”…', 'aria-label': 'Ask Pip about an office tool' });
    const question = h('input', { type: 'text', placeholder: 'For example: how do I check a worker’s changes?', 'aria-label': 'Your question for Pip' });
    const ask = h('button.btn.primary', { type: 'submit' }, 'Ask Pip');
    const reply = h('p.guide-answer', { 'aria-live': 'polite' });
    const form = h('form.guide-question', {}, h('label', {}, 'Ask me about the office or GitHub', question), ask, reply);
    const list = h('nav.guide-topics', { 'aria-label': 'Office tools' });
    const article = h('article.guide-lesson', { 'aria-live': 'polite' });
    const tour = this.actions.current();
    const takeTour = h('button.btn.primary', { type: 'button', disabled: !this.actions.canTour() }, tour < 0 ? 'Show me around' : tour === TOUR.length - 1 ? 'Finish tour' : 'Next tour stop');
    const start = h('button.btn', { type: 'button' }, 'Help me give my first task');
    const top = h('header', {}, h('div', {}, h('span.guide-kicker', {}, 'PIP · YOUR OFFICE GUIDE'), h('h2', {}, 'Let’s make this office make sense')));
    const panel = h('section.guide-panel', { role: 'dialog', 'aria-label': 'Pip office guide' }, top,
      h('p.guide-intro', {}, 'You do not need coding experience. I’ll explain what each tool does, why you might use it, and what to click. My answers are built in and do not use a coding worker.'),
      form,
      h('div.guide-quick', {}, takeTour, start),
      h('div.guide-library', {}, h('aside', {}, h('label', {}, 'What would you like explained?', search), list), article),
      h('footer', {}, 'F2 calls me from anywhere · E talks to me nearby · Esc closes this window'),
    );

    const explain = (lesson: Lesson) => {
      selected = lesson;
      const walk = h('button.btn', { type: 'button', disabled: !lesson.at || !this.actions.canTour() }, 'Walk me to this tool');
      walk.onclick = () => { this.close(); this.actions.visit(lesson); };
      article.replaceChildren(h('div', {},
        h('span.guide-kicker', {}, `${lesson.icon} ONE TOOL AT A TIME`),
        h('h3', {}, lesson.title),
        h('p.guide-what', {}, lesson.what),
        h('h4', {}, 'Why you might use it'), h('p', {}, lesson.why),
        h('h4', {}, 'What to do'), h('ol', {}, ...lesson.steps.map(step => h('li', {}, step))),
        lesson.example ? h('div.guide-example', {}, h('h4', {}, 'You could say this to a worker'), h('p', {}, lesson.example)) : null,
        lesson.term ? h('p.guide-term', {}, lesson.term) : null,
        lesson.at ? walk : null,
      ));
      for (const button of list.querySelectorAll<HTMLButtonElement>('button')) button.setAttribute('aria-pressed', String(button.dataset.lesson === lesson.id));
    };
    const filter = () => {
      const matches = findLessons(search.value);
      list.replaceChildren(...matches.map(lesson => {
        const button = h('button.guide-topic', { type: 'button', 'data-lesson': lesson.id, 'aria-pressed': lesson.id === selected.id }, `${lesson.icon} ${lesson.title}`);
        button.onclick = () => explain(lesson);
        return button;
      }));
      if (!matches.length) list.append(h('p', {}, 'I don’t have an explanation for that yet. Try “errors,” “GitHub,” or “first task,” or clear the search to see every tool.'));
    };
    search.oninput = filter;
    form.onsubmit = event => {
      event.preventDefault(); const words = question.value.trim(); if (!words) return;
      const matches = findLessons(words);
      if (!matches.length) { reply.textContent = 'I don’t have a reliable guide answer for that yet. Try naming the tool you mean, or ask a coding worker to investigate your project.'; return; }
      search.value = words; filter(); explain(matches[0]);
      reply.textContent = `From the office guide: ${matches[0].what} Read the steps below. Related topics are listed on the left.`;
    };
    const learnGithub = h('button.btn', { type: 'button' }, 'Teach me GitHub');
    learnGithub.onclick = () => { search.value = 'git'; filter(); explain(lessonById('git-start')); };
    panel.querySelector('.guide-quick')!.append(learnGithub);
    takeTour.onclick = () => { this.close(); if (tour < 0) this.actions.start(); else this.actions.next(); };
    start.onclick = () => { search.value = ''; filter(); explain(lessonById('start')); };
    if (tour >= 0) {
      const stop = h('button.btn', { type: 'button' }, 'End tour');
      stop.onclick = () => { this.close(); this.actions.stop(); };
      panel.querySelector('.guide-quick')!.append(stop);
    }
    filter(); explain(selected);
    this.modal = openModal(panel, { doing: 'learning the office with Pip', onClose: () => { this.modal = null; } });
  }

  close() { this.modal?.close(); }
}

/** The tour stays in view while you walk; it does not grab your keyboard or move you without asking. */
export class GuideTourCard {
  private readonly root = h('section.guide-tour', { 'aria-label': 'Pip walking tour', hidden: true });
  constructor(private readonly actions: GuideActions, private readonly explain: (id: string) => void) { document.body.append(this.root); }
  update(index: number, arrived: boolean, waiting = false) {
    this.root.hidden = index < 0;
    if (index < 0) return;
    const lesson = lessonById(TOUR[index]);
    const close = h('button.guide-tour-close', { type: 'button', 'aria-label': 'End tour', title: 'End tour' }, '✕');
    close.onclick = () => this.actions.stop();
    const learn = h('button.btn', { type: 'button' }, 'Explain this');
    learn.onclick = () => this.explain(lesson.id);
    const next = h('button.btn', { type: 'button' }, index === TOUR.length - 1 ? 'Finish tour' : 'Next stop');
    next.onclick = () => this.actions.next();
    this.root.replaceChildren(close, h('span.guide-kicker', {}, `PIP’S TOUR · ${index + 1} OF ${TOUR.length}`),
      h('h3', {}, `${lesson.icon} ${lesson.title}`),
      h('p', {}, arrived ? lesson.what : waiting ? 'I’ll wait here. Follow the blue robot, or press F2 and choose “Walk me to this tool.”' : 'Follow the blue robot. I’ll wait when we get there.'),
      h('div.guide-quick', {}, learn, next), h('small', {}, 'Press E near Pip or F2 for the explanation. You can stop at any time.'),
    );
  }
}
