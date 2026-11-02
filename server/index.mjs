import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {Storage} from './storage.mjs';
import {Pond,freshPond} from './pond.mjs';
import {Twitch} from './twitch.mjs';
import {saveImage,readImage} from './assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function createApp({dataDir=resolve(root,'data'),port=Number(process.env.PORT||8787),twitchFactory=options=>new Twitch(options)}={}){
 const storage=new Storage(dataDir),clients=new Set(),csrf=randomBytes(32).toString('hex');let channel=null,persistenceError=null;
 let origin='';const notify=(type,data)=>{const packet=`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;for(const client of clients){if(client.writableLength>1024*1024){client.destroy();clients.delete(client);}else client.write(packet);}};
 let pond=new Pond();let twitch;
 const state=()=>({pond:pond.snapshot(),connection:twitch.status,serverTime:Date.now(),persistenceError});
 const attachPond=(saved)=>new Pond({state:saved||freshPond(),onChange:next=>{if(channel)storage.write(`pond-${channel.id}.json`,next).catch(()=>{persistenceError='Unable to save pond data. Check disk space and permissions.';notify('state',state());});notify('state',state());},onEffect:effect=>notify('effect',effect),onAnnounce:message=>{if(pond.state.settings.announcements)twitch.send(message).catch(()=>{pond.log('system','A Twitch announcement could not be delivered.');notify('state',state());});}});
 pond=attachPond();twitch=twitchFactory({storage,onStatus:()=>notify('state',state()),onChannel:async user=>{channel=user;pond=attachPond(await storage.read(`pond-${user.id}.json`,freshPond()));pond.tick();notify('state',state());},onEvent:(event,id)=>{if(channel)pond.command(event,event.message_id||id);}});
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'");
 const validHosts=new Set([new URL(origin).host,`localhost:${server.address().port}`]);if(!validHosts.has(req.headers.host)){json(res,403,{error:'Invalid host'});return;}const url=new URL(req.url,origin);if(req.headers.origin){let allowed=false;try{const requester=new URL(req.headers.origin);allowed=requester.protocol==='http:'&&validHosts.has(requester.host);}catch{}if(!allowed){json(res,403,{error:'Cross-origin requests are not permitted.'});return;}}
 try{
 if(req.method==='GET'&&url.pathname==='/api/state'){json(res,200,state());return;}
 if(req.method==='GET'&&url.pathname==='/api/bootstrap'){json(res,200,{...state(),csrf,clientId:(await storage.read('config.json',{})).clientId||'',overlayUrl:origin+'/overlay'});return;}
 if(req.method==='GET'&&url.pathname==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(`event: state\ndata: ${JSON.stringify(state())}\n\n`);clients.add(res);req.on('close',()=>clients.delete(res));return;}
 if(req.method==='POST'&&url.pathname.startsWith('/api/')){const token=Buffer.from(String(req.headers['x-pond-csrf']||''));if(token.length!==csrf.length||!timingSafeEqual(token,Buffer.from(csrf))){json(res,403,{error:'Refresh the controls page and try again.'});return;}let text='';const limit=url.pathname==='/api/branding/upload'?3*1024*1024:65536;for await(const chunk of req){text+=chunk;if(text.length>limit){json(res,413,{error:'Request too large'});return;}}let body;try{body=JSON.parse(text||'{}');}catch{json(res,400,{error:'Invalid JSON'});return;}
 if(url.pathname==='/api/connect'){if(twitch.pending){json(res,409,{error:'A sign-in is already waiting. Disconnect to cancel it.'});return;}const result=await twitch.begin(String(body.clientId||'').trim());await storage.write('config.json',{clientId:twitch.clientId});json(res,200,result);return;}
 if(url.pathname==='/api/disconnect'){await twitch.disconnect();channel=null;pond=attachPond();notify('state',state());json(res,200,{ok:true});return;}
 if(url.pathname==='/api/settings'){pond.configure(body);json(res,200,{ok:true});return;}
 if(url.pathname==='/api/branding/upload'){
  if(!channel){json(res,409,{error:'Connect your Twitch channel before uploading branding.'});return;}
  if(!['logo','icon'].includes(body.slot))throw Error('Invalid branding slot');
  if(body.slot==='icon'&&pond.state.branding.icons.length>=6)throw Error('Invalid upload: use up to six icons. Remove one first.');
  const asset=await saveImage(storage.directory,body.dataUrl);pond.attachAsset(body.slot,asset);json(res,200,{ok:true,asset});return;
 }
 if(url.pathname==='/api/branding/remove'){pond.removeAsset(body.id);json(res,200,{ok:true});return;}
 if(url.pathname==='/api/encounter'){if(twitch.status.phase!=='connected'){json(res,409,{error:'Connect Twitch chat before opening an encounter.'});return;}if(!pond.startEncounter()){json(res,409,{error:'An encounter is active or interactions are paused.'});return;}json(res,200,{ok:true});return;}
 if(url.pathname==='/api/reward'){pond.markReward(body.id,body.status);json(res,200,{ok:true});return;}
 json(res,404,{error:'Unknown action'});return;}
 if(req.method==='GET'&&url.pathname.startsWith('/assets/')){const asset=await readImage(storage.directory,url.pathname);if(!asset){json(res,404,{error:'Image not found'});return;}res.writeHead(200,{'Content-Type':asset.mime,'Cache-Control':'private, max-age=86400'});res.end(asset.bytes);return;}
 if(req.method==='GET'){const files={'/':'index.html','/overlay':'index.html','/app.js':'app.js','/style.css':'style.css','/credits.txt':'credits.txt'};const file=files[url.pathname];if(file){const content=await readFile(resolve(root,'dist',file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.txt')?'text/plain':'text/html','Cache-Control':'no-cache'});res.end(content);return;}}
 json(res,404,{error:'Not found'});
 }catch(error){const safe=/Invalid|Enter|Finish|Reward not found/.test(error.message)?error.message:'The action failed. Check your connection and try again.';json(res,400,{error:safe});}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;
 const timer=setInterval(()=>{if(channel)pond.tick(twitch.status.phase==='connected');},500),heartbeat=setInterval(()=>{for(const client of clients)client.write(': heartbeat\n\n');},15000);timer.unref();heartbeat.unref();
 twitch.restore().catch(()=>{twitch.setStatus({phase:'disconnected',error:'Could not restore saved Twitch authorization. Connect again.'});});
 return {server,origin,storage,getPond:()=>pond,twitch,async close(){clearInterval(timer);clearInterval(heartbeat);twitch.close();for(const client of clients)client.end();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await storage.queue;}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=await createApp();console.log(`Little Tide controls: ${app.origin}\nOBS Browser Source: ${app.origin}/overlay\nLocal-only listener. Twitch tokens are never sent to the overlay.`);for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();process.exit(0);});}
