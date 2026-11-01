export const SPECIES = [
  { name: 'Buttonfish', color: '#e7bc88', art: ['  .-.  ', '><(o )>', '  `-´  '] },
  { name: 'Moon jelly', color: '#c5b0eb', art: [' .-.-. ', '( o o )', ' ~|~|~ ', '  ~ ~  '] },
  { name: 'Pebble turtle', color: '#a8c998', art: ['  ___  ', ' /o o\\ ', '<(###)>', '  v v  '] },
  { name: 'Peach axolotl', color: '#e7a9b2', art: [' \\| |/ ', '--(•ᴗ•)--', ' /|_|\\ ', '  / \\  '] },
  { name: 'Cloud ray', color: '#9dcbd2', art: ['  /\\  ', '<(• •)>', '  \\/  ', '   ~  '] },
];
export class Pond {
  constructor({now = () => Date.now(), random = Math.random} = {}) {
    this.now = now; this.random = random; this.feeds = 0; this.residents = 7;
    this.maxResidents = 24; this.cooldowns = new Map(); this.encounter = null;
    this.collection = []; this.autoEncounters = true;
  }
  feed(user) {
    const key = user.trim().toLowerCase();
    if (!key) return {ok:false, reason:'Choose a viewer name first.'};
    const now = this.now(), previous = this.cooldowns.get(key);
    if (previous !== undefined && now - previous < 6000) return {ok:false, reason:'Let your friends finish their snack. Try again in a few seconds.'};
    this.cooldowns.set(key, now); this.feeds++;
    const added = this.feeds % 3 === 0 && this.residents < this.maxResidents;
    if (added) this.residents++;
    let appeared = false;
    if (this.autoEncounters && !this.encounter && this.feeds >= 6 && this.random() < 0.10) appeared = this.startEncounter();
    return {ok:true, added, appeared};
  }
  startEncounter() {
    if (this.encounter) return false;
    this.encounter = {endsAt:this.now()+20000, entrants:new Map()}; return true;
  }
  catch(user) {
    const key=user.trim().toLowerCase(), e=this.encounter;
    if (!e || this.now() >= e.endsAt) return {ok:false, reason:'Wait for a legendary visitor to appear.'};
    if (!key) return {ok:false, reason:'Choose a viewer name first.'};
    if (e.entrants.has(key)) return {ok:false, reason:'You’re already in! One entry per viewer.'};
    e.entrants.set(key,user.trim()); return {ok:true};
  }
  finishEncounter() {
    const e = this.encounter;
    if (!e || this.now() < e.endsAt) return null;
    const entrants = [...e.entrants.values()];
    const winner = entrants.length ? entrants[Math.floor(this.random()*entrants.length)] : null;
    this.encounter=null;
    if (winner) this.collection.push({user:winner, creature:'Starlight whale', at:this.now()});
    return {winner};
  }
}
