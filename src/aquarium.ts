import {World,type SharkKind,type SharkSpec} from './ocean/world';
import {AsciiRenderer} from './ocean/renderer';
import type {Design} from './design';
export type Resident={id:string;kind:SharkKind;size:number};
export type Visit={id:string;startedAt:number;endsAt:number;entrySide:'left'|'right';lane:number};
export class Aquarium {
 world:World;renderer:AsciiRenderer;canvas:HTMLCanvasElement;speed=.7;paused=false;
 reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 private specs:SharkSpec[]=[];private school=65;private last=0;private frameTime=0;
 private width=1;private height=1;private light=false;private rippleStrength=1;
 private visit:Visit|null=null;private clockOffset=0;
 private snacks:{x:number;y:number;at:number;user:string}[]=[];
 constructor(canvas:HTMLCanvasElement){
  this.canvas=canvas;this.world=new World([],65);this.renderer=new AsciiRenderer(canvas);
  this.renderer.setFontFamily('Consolas, "Courier New", monospace');
  new ResizeObserver(()=>this.resize()).observe(canvas);this.resize();requestAnimationFrame(this.frame);
  document.addEventListener('visibilitychange',()=>{this.last=0;});
 }
 resize(){
  const r=this.canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;
  this.width=r.width;this.height=r.height;this.renderer.resize(r.width,r.height,Math.min(devicePixelRatio||1,2));
  this.world.resize(r.width,r.height,this.renderer.cellWidth,this.renderer.cellHeight);
  this.world.setResidents(this.specs);this.world.setSchoolCount(this.school);this.positionWhale();
 }
 sync(residents:Resident[],school:number,visit:Visit|null|false,serverTime=Date.now()){
  this.visit=visit||null;this.clockOffset=serverTime-Date.now();
  this.specs=residents.map(r=>({kind:r.kind,size:r.size,key:r.id}));
  if(visit)this.specs.push({kind:'moonwhale',size:1.5,key:visit.id});
  this.school=school;this.world.setResidents(this.specs);this.world.setSchoolCount(school);this.positionWhale();
 }
 private positionWhale(){
  if(!this.visit){this.world.clearVisit();return;}
  const progress=(Date.now()+this.clockOffset-this.visit.startedAt)/(this.visit.endsAt-this.visit.startedAt);
  this.world.positionVisit(progress,this.visit.entrySide||'left',this.visit.lane??.55);
 }
 appearance(design:Design){this.light=design.colorScheme==='light';this.rippleStrength=design.rippleStrength;this.world.feedBoost=design.feedBoost;this.renderer.setLight(this.light);this.renderer.sparkles=design.sparkles&&!this.reduced;}
 feed(x:number,y:number,user:string){this.world.feed(x,y);this.snacks.push({x,y,user,at:performance.now()});if(this.snacks.length>12)this.snacks.shift();}
 frame=(now:number)=>{
  requestAnimationFrame(this.frame);if(document.hidden||now-this.frameTime<1000/30)return;
  this.frameTime=now;const dt=Math.min((now-this.last)/1000||1/30,.05);this.last=now;
  this.positionWhale();if(!this.paused)this.world.step(dt*this.speed*(this.reduced?.25:1));this.renderer.render(this.world,dt);
  const ctx=this.canvas.getContext('2d')!;ctx.save();
  // Draw the exact simulation particles. There is no separate food expiration.
  for(const pellet of this.world.food){ctx.fillStyle=this.light?'#9b682c':'#ffdc98';ctx.beginPath();ctx.arc(pellet.x,pellet.y,2.1,0,Math.PI*2);ctx.fill();}
  this.snacks=this.snacks.filter(s=>now-s.at<5500);
  this.snacks.forEach((snack,index)=>{
   const age=(now-snack.at)/1000,x=snack.x*this.width,y=snack.y*this.height;
   if(age<4.5&&this.rippleStrength>0){
    ctx.save();ctx.strokeStyle=this.light?'#466f84':'#b8dbe7';ctx.lineWidth=.85;
    for(let ring=0;ring<3;ring++){const elapsed=age-ring*.38;if(elapsed<0)continue;const radius=this.reduced?20+ring*17:8+elapsed*34;ctx.globalAlpha=Math.max(0,1-elapsed/3.7)*.3*this.rippleStrength;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.42,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
   }
   if(index===this.snacks.length-1&&age<5){
    ctx.globalAlpha=Math.min(1,5-age);const size=Math.max(14,Math.min(20,this.height/60));
    ctx.font=`600 ${size}px "Segoe UI", Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    const text=`${snack.user} fed the pond`,w=ctx.measureText(text).width+24,h=size+18;
    const labelX=Math.max(w/2+8,Math.min(this.width-w/2-8,x)),labelY=Math.max(55,y-44);
    ctx.fillStyle=this.light?'#ffffffed':'#14212bed';ctx.beginPath();ctx.roundRect(labelX-w/2,labelY-h/2,w,h,8);ctx.fill();
    ctx.fillStyle=this.light?'#2b4352':'#f5dfba';ctx.fillText(text,labelX,labelY);
   }
  });
  ctx.restore();
 };
}
