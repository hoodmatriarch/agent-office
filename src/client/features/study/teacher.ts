import { h,toast } from '../../ui/dom';
import { panel,action,input } from '../facilities/panels';
import type { StudyWorld } from './world';
import { StudyData,studyHint,type Lesson,type LearningStyle } from './data';
export class Teacher {
  constructor(readonly data:StudyData,private world:()=>StudyWorld,private seated:()=>{x:number;z:number}|void){}
  async open(){
    await this.data.load();const p=panel('🎓 Professor Ellis · classroom');const lesson=this.data.lesson();
    p.body.append(h('p',{},`Curriculum: ${this.data.value.curriculum} · Your approach: ${this.data.value.style}`),h('p',{},lesson?`Current lesson: ${lesson.subject} · ${lesson.title}`:'Your classroom is ready. We will add the curriculum, lectures and tests later.'),
      action('Start class lecture',()=>{p.modal.close();return this.lecture();}),action('Raise hand · ask for help',()=>{p.modal.close();return this.help();}),action('Assignments & backpack',()=>{p.modal.close();return this.backpack();}),action('Set curriculum & learning preferences',()=>this.setup()),action('Add a lesson / test / homework',()=>this.edit()));
    for(const l of this.data.value.lessons)p.body.append(action(`${l.subject} · ${l.title}`,async()=>{this.data.value.current=l.id;await this.data.save();p.modal.close();return this.lecture();}));
  }
  async setup(){
    const p=panel('🎓 Learning preferences'),curriculum=input('Curriculum name',this.data.value.curriculum),style=h('select',{'aria-label':'Learning approach'});
    for(const name of ['Step by step','Visual examples','Practice first','Read and reflect']){const option=h('option',{value:name},name);option.selected=name===this.data.value.style;style.append(option);}
    p.body.append(curriculum.row,h('label',{},'How would you like help?',style),h('p',{},'This saves your preferred approach. Subject teaching uses the lessons you add; no AI tutor is connected yet.'),action('Save preferences',async()=>{this.data.value.curriculum=curriculum.field.value.slice(0,200);this.data.value.style=style.value as LearningStyle;await this.data.save();toast('Learning preferences saved.');p.modal.close();},true));
  }
  edit(){
    const p=panel('📝 Add curriculum lesson',true);const fields={subject:input('Subject'),title:input('Lesson title'),lecture:input('Lecture / explanation','',true),task:input('Classwork instructions','',true),hints:input('Teacher guidance / worked example','',true),test:input('Test questions','',true),homework:input('Homework instructions','',true)};
    p.body.append(h('p',{},'Add curriculum-approved material here. The teacher presents this material and uses your guidance during help requests.'),...Object.values(fields).map(f=>f.row),action('Save lesson',async()=>{if(!fields.title.field.value.trim()||!fields.subject.field.value.trim())throw new Error('Enter a subject and lesson title.');const lesson={id:crypto.randomUUID(),...Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.field.value.slice(0,16000)]))} as Lesson;this.data.value.lessons.push(lesson);this.data.value.current=lesson.id;await this.data.save();p.modal.close();this.world().writeBoard(lesson.title,lesson.lecture);toast('Lesson added.');},true));
  }
  async lecture(){
    await this.data.load();const lesson=this.data.lesson(),p=panel('📝 Class lecture',true);
    if(!lesson){p.body.append(h('p',{},'No lessons have been added yet. Your teacher, whiteboard and desks are ready for the curriculum we build next.'));return;}
    this.world().returnToDesk();this.world().writeBoard(lesson.title,lesson.lecture);
    p.body.append(h('h3',{},`${lesson.subject} · ${lesson.title}`),h('div.book-text',{},lesson.lecture||'Add lecture content to this lesson.'),h('h3',{},'Your classwork'),h('p',{},lesson.task||'Independent reading'),
      action('Work at my desk',()=>{p.modal.close();this.seated();}),action('Take the test',()=>this.test(lesson)),action('Assign homework to my backpack',async()=>{if(!lesson.homework&&!lesson.task)throw new Error('Add homework or classwork instructions first.');this.data.assign(lesson);await this.data.save();toast('Homework placed in your backpack.');}),action('Raise hand',()=>{p.modal.close();return this.help();}));
  }
  async help(){
    await this.data.load();const at=this.seated();if(at)this.world().helpAt(at.x,at.z);const p=panel('🙋 Your hand is raised'),q=input('What are you unsure about?','',true),answer=h('div.book-text',{},studyHint(this.data.value.style,'',this.data.lesson()));
    p.body.append(h('p',{},'Professor Ellis is coming to your seat. Try describing what you have already attempted.'),q.row,action('Ask my question',async()=>{if(!q.field.value.trim())throw new Error('Enter your question.');this.data.value.questions.push({question:q.field.value.slice(0,4000),lesson:this.data.value.current??'',at:Date.now()});this.data.value.questions=this.data.value.questions.slice(-100);await this.data.save();answer.textContent=studyHint(this.data.value.style,q.field.value,this.data.lesson());}),answer,action('Thank you · return to your desk',()=>{this.world().returnToDesk();p.modal.close();}));
  }
  test(lesson:Lesson){
    const p=panel('📝 Class test',true),work=input('My test answers','',true);
    p.body.append(h('div.book-text',{},lesson.test||'Test questions will be added with this curriculum.'),work.row,action('Save test in backpack',async()=>{const item=this.data.assign({...lesson,id:lesson.id+'-test',title:lesson.title+' · test',homework:lesson.test});item.work=work.field.value.slice(0,40000);await this.data.save();toast('Test saved for review. Automatic grading is not configured.');p.modal.close();}));
  }
  async backpack(location?:'locker'){
    await this.data.load();const p=panel(location?'🧥 Homework in your break-floor locker':'🎒 Backpack & homework',true),list=h('div.fac-grid');
    const render=()=>{list.replaceChildren();for(const item of this.data.value.homework.filter(h=>!location||h.location===location)){
      const work=input('Work: '+item.title,item.work,true),card=h('article.fac-card',{},h('h3',{},item.title),h('p',{},item.prompt),h('small',{},`${item.location} · ${item.submitted?'Submitted for review':'In progress'}`),work.row);
      card.append(action('Save work',async()=>{item.work=work.field.value.slice(0,40000);await this.data.save();toast('Work saved.');}),action(item.location==='backpack'?'Leave in break-floor locker':'Put in backpack',async()=>{item.work=work.field.value.slice(0,40000);item.location=item.location==='backpack'?'locker':'backpack';await this.data.save();render();}),action('Submit for teacher review',async()=>{item.work=work.field.value.slice(0,40000);item.submitted=true;await this.data.save();render();}));list.append(card);
    }if(!list.children.length)list.append(h('p',{},'No homework here yet. Assignments appear when your lessons are ready.'));};p.body.append(list);render();
  }
}
