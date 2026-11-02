import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
export class Storage {
 constructor(directory){this.directory=directory;this.queue=Promise.resolve();}
 async read(name,fallback=null){try{return JSON.parse(await readFile(join(this.directory,name),'utf8'));}catch(error){if(error.code==='ENOENT')return fallback;throw new Error(`Cannot read ${name}; preserve the file and restore a valid backup.`);}}
 write(name,data){const text=JSON.stringify(data,null,2);const operation=this.queue.then(async()=>{await mkdir(this.directory,{recursive:true,mode:0o700});const path=join(this.directory,name);await writeFile(path+'.tmp',text,{mode:0o600});await rename(path+'.tmp',path);});this.queue=operation.catch(()=>{});return operation;}
 async remove(name){await this.queue;await unlink(join(this.directory,name)).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}
