import { Collection } from '../facilities/data';
export type LearningStyle = 'Step by step' | 'Visual examples' | 'Practice first' | 'Read and reflect';
export interface Lesson { id:string; subject:string; title:string; lecture:string; task:string; hints:string; homework:string; test:string; }
export interface Homework { id:string; lessonId:string; title:string; prompt:string; work:string; location:'backpack'|'locker'; submitted:boolean; }
export interface StudyState { curriculum:string; style:LearningStyle; lessons:Lesson[]; current:string|null; homework:Homework[]; questions:{question:string;lesson:string;at:number}[]; }
export class StudyData extends Collection<StudyState> {
  constructor(){super('study',{curriculum:'My curriculum',style:'Step by step',lessons:[],current:null,homework:[],questions:[]});}
  lesson(){return this.value.lessons.find(l=>l.id===this.value.current);}
  assign(lesson:Lesson){
    const existing=this.value.homework.find(h=>h.lessonId===lesson.id&&!h.submitted);if(existing)return existing;
    const item:Homework={id:crypto.randomUUID(),lessonId:lesson.id,title:lesson.title,prompt:lesson.homework||lesson.task,work:'',location:'backpack',submitted:false};this.value.homework.push(item);return item;
  }
}
export function studyHint(style:LearningStyle,question:string,lesson?:Lesson){
  const methods:Record<LearningStyle,string>={
    'Step by step':'Break the task into three small steps. What is given, what must you find, and what is one step you can try?',
    'Visual examples':'Draw or describe a diagram. Label what you know, then connect it to what the question asks.',
    'Practice first':'Try a smaller example first. Say what you expect, try it, then compare the result.',
    'Read and reflect':'Restate the task in your own words. Find the relevant passage in your reading and explain why it helps.',
  };
  return `${question ? 'Let’s work through your question together. ' : ''}${methods[style]}${lesson?.hints ? '\n\nLesson guidance: '+lesson.hints : '\n\nSubject-specific explanations will be available when we add your curriculum and lesson guidance.'}`;
}
