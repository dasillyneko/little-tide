import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
const TYPES={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'};
export function decodeImage(dataUrl){
 if(typeof dataUrl!=='string')throw Error('Invalid image upload');
 const match=/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
 if(!match)throw Error('Invalid upload: choose PNG, JPG, WebP or GIF.');
 const mime=match[1],bytes=Buffer.from(match[2],'base64');
 if(bytes.length>2*1024*1024||bytes.length<6)throw Error('Invalid upload: choose an image smaller than 2 MB.');
 const valid=mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:mime==='image/gif'?/^GIF8[79]a$/.test(bytes.subarray(0,6).toString()):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!valid)throw Error('Invalid image: its contents do not match its file type.');
 return {mime,bytes,extension:TYPES[mime]};
}
export async function saveImage(dataDirectory,dataUrl){
 const {mime,bytes,extension}=decodeImage(dataUrl),id=randomUUID(),directory=join(dataDirectory,'assets');
 await mkdir(directory,{recursive:true,mode:0o700});await writeFile(join(directory,`${id}.${extension}`),bytes,{mode:0o600});
 return {id,mime,url:`/assets/${id}.${extension}`};
}
export async function readImage(dataDirectory,path){
 const match=/^\/assets\/([a-f0-9-]{36}\.(png|jpg|webp|gif))$/.exec(path);if(!match)return null;
 try{return {bytes:await readFile(join(dataDirectory,'assets',match[1])),mime:Object.entries(TYPES).find(([,ext])=>ext===match[2])[0]};}
 catch(error){if(error.code==='ENOENT')return null;throw error;}
}
