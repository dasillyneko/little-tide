import {World,type SharkKind,type SharkSpec} from './ocean/world';
import {AsciiRenderer} from './ocean/renderer';
import type {Design} from './design';
export type Resident={id:string;kind:SharkKind;size:number};
export class Aquarium {
 world:World; renderer:AsciiRenderer; canvas:HTMLCanvasElement; speed=.7; paused=false; reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 private specs:SharkSpec[]=[];private school=65;private last=0;private raf=0;private frameTime=0;private width=1;private height=1;private light=false;private rippleStrength=1;private snacks:{x:number;y:number;at:number;user:string;seed:number}[]=[];
 constructor(canvas:HTMLCanvasElement){this.canvas=canvas;this.world=new World([],65);this.renderer=new AsciiRenderer(canvas);this.renderer.setFontFamily('Consolas, "Courier New", monospace');new ResizeObserver(()=>this.resize()).observe(canvas);this.resize();this.raf=requestAnimationFrame(this.frame);document.addEventListener('visibilitychange',()=>{this.last=0;});}
 resize(){const r=this.canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;this.width=r.width;this.height=r.height;this.renderer.resize(r.width,r.height,Math.min(devicePixelRatio||1,2));this.world.resize(r.width,r.height,this.renderer.cellWidth,this.renderer.cellHeight);this.world.setResidents(this.specs);this.world.setSchoolCount(this.school);}
 sync(residents:Resident[],school:number,legendary:boolean){this.specs=residents.map(r=>({kind:r.kind,size:r.size}));if(legendary)this.specs.push({kind:'moonwhale',size:1.65});this.school=school;this.world.setResidents(this.specs);this.world.setSchoolCount(school);}
 appearance(design:Design){this.light=design.colorScheme==='light';this.rippleStrength=design.rippleStrength;this.world.feedBoost=design.feedBoost;this.renderer.setLight(this.light);this.renderer.sparkles=design.sparkles&&!this.reduced;}
 feed(x:number,y:number,user:string){this.world.feed(x,y);this.snacks.push({x,y,user,at:performance.now(),seed:Math.random()});if(this.snacks.length>8)this.snacks.shift();}
 frame=(now:number)=>{this.raf=requestAnimationFrame(this.frame);if(document.hidden)return;if(now-this.frameTime<1000/30)return;this.frameTime=now;const dt=Math.min((now-this.last)/1000||1/30,.05);this.last=now;
 if(!this.paused)this.world.step(dt*this.speed*(this.reduced?.25:1));this.renderer.render(this.world,dt);
 const ctx=this.canvas.getContext('2d')!;ctx.save();ctx.font='12px Consolas,monospace';ctx.textAlign='center';const visible=this.snacks.filter(f=>now-f.at<12000);this.snacks=visible;
 visible.forEach((snack,j)=>{const age=(now-snack.at)/1000,x=snack.x*this.width,y=snack.y*this.height;
 if(age<4.5&&this.rippleStrength>0){ctx.save();ctx.strokeStyle=this.light?'#466f84':'#b8dbe7';ctx.lineWidth=.85;for(let ring=0;ring<3;ring++){const elapsed=age-ring*.38;if(elapsed<0)continue;const radius=this.reduced?20+ring*17:8+elapsed*34;ctx.globalAlpha=Math.max(0,1-elapsed/3.7)*.3*this.rippleStrength;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.42,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
 ctx.globalAlpha=Math.min(1,(12-age)/3);for(let k=0;k<16;k++){const angle=k*2.399+snack.seed*10,spread=8+Math.sqrt(k)*7;ctx.fillStyle=this.light?(k%3?'#996524':'#71512a'):(k%3?'#ffc982':'#fff1d4');ctx.fillText(k%3?'.':'+',x+Math.cos(angle)*spread,y+Math.sin(angle)*spread+Math.min(age*6,25));}if(j===visible.length-1&&age<5){ctx.globalAlpha=Math.min(1,5-age);ctx.fillStyle=this.light?'#694c2a':'#f5d5aa';ctx.font='11px Consolas,monospace';ctx.fillText(`${snack.user}  +  food`,Math.max(110,Math.min(this.width-110,x)),y-35);}});ctx.restore();};
}
