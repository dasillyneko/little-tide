import {randomInt,randomUUID} from 'node:crypto';
import {DEFAULT_DESIGN,defaultTextLayers,validateDesign,validateTextLayers} from '../shared/design.mjs';
export const CREATURES=['koi','manta','turtle','axolotl'];
export const WHALE_INTERVAL_MS=5*60*1000;
export const DEFAULT_SETTINGS={paused:false,motion:0.7,showHud:true,scene:'ocean',feedCooldown:8,feedsPerArrival:3,autoVisits:true,encounterSeconds:45,rewardSlots:0,announcements:false,design:DEFAULT_DESIGN,textLayers:defaultTextLayers()};
export function freshPond(){return {version:3,feeds:0,residents:[{id:'koi-1',kind:'koi',size:.95},{id:'manta-1',kind:'manta',size:.85},{id:'turtle-1',kind:'turtle',size:.68},{id:'axolotl-1',kind:'axolotl',size:.8}],schoolCount:65,settings:structuredClone(DEFAULT_SETTINGS),branding:{logo:null,icons:[]},encounter:null,lastEncounterAt:0,nextEncounterAt:0,discoveries:[],rewards:[],activity:[]};}
export class Pond {
 constructor({state,now=Date.now,pick=n=>randomInt(n),onChange=()=>{},onEffect=()=>{},onAnnounce=()=>{}}={}){
  this.state=state||freshPond();this.now=now;this.pick=pick;this.onChange=onChange;this.onEffect=onEffect;this.onAnnounce=onAnnounce;
  this.state.settings={...structuredClone(DEFAULT_SETTINGS),...this.state.settings,design:{...DEFAULT_DESIGN,...this.state.settings?.design}};
  delete this.state.settings.legendaryChance;
  this.state.branding??={logo:null,icons:[]};
  if(!Number.isFinite(this.state.nextEncounterAt)||!this.state.nextEncounterAt||this.state.nextEncounterAt<this.now()-WHALE_INTERVAL_MS)this.state.nextEncounterAt=this.now()+WHALE_INTERVAL_MS;
  if(this.state.encounter){this.state.encounter.entrySide??='left';this.state.encounter.lane??=.55;}
  this.state.version=3;this.cooldowns=new Map();this.seen=new Map();
 }
 snapshot(){return structuredClone(this.state);}
 changed(){this.onChange(this.snapshot());}
 log(kind,text){this.state.activity.unshift({id:randomUUID(),at:this.now(),kind,text});this.state.activity=this.state.activity.slice(0,40);}
 seenEvent(id){const now=this.now();for(const [key,at]of this.seen)if(now-at>600000)this.seen.delete(key);if(!id||this.seen.has(id))return true;this.seen.set(id,now);while(this.seen.size>10000)this.seen.delete(this.seen.keys().next().value);return false;}
 command(event,eventId){
  if(this.seenEvent(eventId))return {ok:false,reason:'duplicate'};
  const text=event.message?.text?.trim().toLowerCase(),user={id:event.chatter_user_id,name:event.chatter_user_name||event.chatter_user_login};
  if(!user.id||!user.name)return {ok:false,reason:'invalid viewer'};
  if(text==='!feed')return this.feed(user);if(text==='!catch')return this.catch(user);return {ok:false,reason:'not a command'};
 }
 feed(user){
  if(this.state.settings.paused)return {ok:false,reason:'paused'};
  const now=this.now();if(now<(this.cooldowns.get(user.id)||0))return {ok:false,reason:'cooldown'};
  for(const [id,end]of this.cooldowns)if(end<=now)this.cooldowns.delete(id);
  this.cooldowns.set(user.id,now+this.state.settings.feedCooldown*1000);
  this.state.feeds++;const x=.15+this.pick(7000)/10000,y=.2+this.pick(5000)/10000;
  let arrival=false;
  if(this.state.feeds%this.state.settings.feedsPerArrival===0){
   this.state.schoolCount=Math.min(220,this.state.schoolCount+7);
   if(this.state.residents.length<12){this.state.residents.push({id:randomUUID(),kind:CREATURES[this.pick(CREATURES.length)],size:.5+this.pick(3000)/10000});arrival=true;}
  }
  this.log('feed',`${user.name} fed the ocean${arrival?' · a new friend arrived':''}`);
  this.onEffect({type:'feed',id:randomUUID(),x,y,user:user.name,at:now,arrival});this.changed();return {ok:true,arrival};
 }
 startEncounter(){
  if(this.state.encounter||this.state.settings.paused)return false;
  const now=this.now();
  this.state.encounter={id:randomUUID(),startedAt:now,endsAt:now+this.state.settings.encounterSeconds*1000,entrySide:this.pick(2)===0?'left':'right',lane:.32+this.pick(3400)/10000,entrants:[],reward:this.state.settings.rewardSlots>0};
  this.state.lastEncounterAt=now;this.state.nextEncounterAt=now+WHALE_INTERVAL_MS;
  this.log('encounter','A moonwhale is swimming through. Type !catch to join.');
  this.onAnnounce(`A moonwhale is swimming through! Type !catch in the next ${this.state.settings.encounterSeconds} seconds. One entry per viewer.${this.state.encounter.reward?' This encounter has a streamer-funded sub reward.':''}`);
  this.changed();return true;
 }
 catch(user){const e=this.state.encounter;if(!e||this.now()>=e.endsAt)return {ok:false,reason:'no encounter'};if(e.entrants.some(v=>v.id===user.id))return {ok:false,reason:'already entered'};e.entrants.push(user);this.changed();return {ok:true};}
 tick(allowAutomatic=true){
  const e=this.state.encounter,now=this.now();
  if(!e){if(allowAutomatic&&this.state.settings.autoVisits&&!this.state.settings.paused&&now>=this.state.nextEncounterAt)this.startEncounter();return null;}
  if(now<e.endsAt)return null;
  this.state.encounter=null;let winner=null;
  if(e.entrants.length){
   winner=e.entrants[this.pick(e.entrants.length)];
   const discovery={id:randomUUID(),at:now,viewerId:winner.id,viewer:winner.name,kind:'moonwhale',encounterId:e.id};
   this.state.discoveries.unshift(discovery);this.state.discoveries=this.state.discoveries.slice(0,1000);
   if(e.reward){this.state.settings.rewardSlots=Math.max(0,this.state.settings.rewardSlots-1);this.state.rewards.unshift({...discovery,status:'pending'});}
   this.log('discovery',`${winner.name} discovered the moonwhale!`);this.onEffect({type:'discovery',...discovery});
   this.onAnnounce(`${winner.name} discovered the moonwhale!${e.reward?' Your sub reward is in the streamer’s queue.':''}`);
  }else this.log('encounter','The moonwhale swam back into the deep. No entries this time.');
  this.changed();return {winner};
 }
 configure(patch){
  const previous=this.state.settings,next={...previous};
  for(const [key,val]of Object.entries(patch)){
   if(key==='design'){if(!val||typeof val!=='object'||Array.isArray(val))throw Error('Invalid overlay design setting');next.design=validateDesign({...next.design,...val});}
   else if(key==='textLayers')next.textLayers=validateTextLayers(val);
   else if(['paused','showHud','announcements','autoVisits'].includes(key)){if(typeof val!=='boolean')throw Error('Invalid setting');next[key]=val;}
   else if(key==='scene'){if(!['ocean','starting','brb'].includes(val))throw Error('Invalid scene');next[key]=val;}
   else{
    const ranges={motion:[.15,1.5],feedCooldown:[3,120],feedsPerArrival:[1,30],encounterSeconds:[15,120],rewardSlots:[0,100]};
    if(!ranges[key]||!Number.isFinite(val)||val<ranges[key][0]||val>ranges[key][1]||key!=='motion'&&!Number.isInteger(val))throw Error('Invalid setting');
    if(key==='rewardSlots'&&this.state.encounter?.reward)throw Error('Finish the current reward encounter before changing the budget.');next[key]=val;
   }
  }
  if(previous.paused&&!next.paused||!previous.autoVisits&&next.autoVisits)this.state.nextEncounterAt=this.now()+WHALE_INTERVAL_MS;
  this.state.settings=next;this.changed();
 }
 attachAsset(slot,asset){
  if(!['logo','icon'].includes(slot)||!asset||!/^\/assets\/[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(asset.url))throw Error('Invalid branding upload');
  if(slot==='logo')this.state.branding.logo=asset;
  else{if(this.state.branding.icons.length>=6)throw Error('Invalid upload: use up to six icons. Remove one first.');this.state.branding.icons.push(asset);}
  this.changed();
 }
 removeAsset(id){
  const brand=this.state.branding;
  if(brand.logo?.id===id)brand.logo=null;
  else brand.icons=brand.icons.filter(icon=>icon.id!==id);
  this.changed();
 }
 markReward(id,status){if(!['fulfilled','pending'].includes(status))throw Error('Invalid reward status');const r=this.state.rewards.find(x=>x.id===id);if(!r)throw Error('Reward not found');r.status=status;this.changed();}
}
