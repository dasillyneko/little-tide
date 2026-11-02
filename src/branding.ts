import type {Design} from './design';
export type BrandAsset={id:string;url:string;mime:string};
export type Branding={logo:BrandAsset|null;icons:BrandAsset[]};
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export class BrandingPanel {
 private key='';
 constructor(private action:(route:string,body:object)=>Promise<unknown>,private notify:(message:string)=>void){
  $<HTMLInputElement>('logoUpload').onchange=()=>void this.upload('logo',$<HTMLInputElement>('logoUpload'));
  $<HTMLInputElement>('iconUpload').onchange=()=>void this.upload('icon',$<HTMLInputElement>('iconUpload'));
  for(const key of ['logoCorner','logoSize','iconSize'])$(key).onchange=()=>{const el=$<HTMLInputElement>(key);if(!el.reportValidity())return;this.action('settings',{design:{[key]:key==='logoCorner'?el.value:Number(el.value)}}).catch(e=>this.notify(e.message));};
 }
 sync(branding:Branding,design:Design){
  const key=JSON.stringify([branding,design.logoCorner,design.logoSize,design.iconSize]);if(key===this.key)return;this.key=key;
  const root=$('brandAssets');root.replaceChildren();root.dataset.corner=design.logoCorner;
  document.body.classList.toggle('has-logo',Boolean(branding.logo));
  if(branding.logo){const image=document.createElement('img');image.src=branding.logo.url;image.alt='Streamer logo';image.className='uploaded-logo';image.style.width=`max(36px, calc(var(--pond-height, 1080px) * ${design.logoSize/1080}))`;image.style.height=image.style.width;root.append(image);}
  if(branding.icons.length){const icons=document.createElement('div');icons.className='uploaded-icons';for(const asset of branding.icons){const image=document.createElement('img');image.src=asset.url;image.alt='Streamer icon';image.style.width=`max(20px, calc(var(--pond-height, 1080px) * ${design.iconSize/1080}))`;image.style.height=image.style.width;icons.append(image);}root.append(icons);}
  const list=$('brandingAssetList');list.replaceChildren();const assets=[...(branding.logo?[{...branding.logo,label:'Logo'}]:[]),...branding.icons.map((a,i)=>({...a,label:`Icon ${i+1}`}))];
  for(const asset of assets){const row=document.createElement('div');row.className='asset-tile';const image=document.createElement('img');image.src=asset.url;image.alt=asset.label;const label=document.createElement('span');label.textContent=asset.label;const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.onclick=()=>this.action('branding/remove',{id:asset.id}).catch(e=>this.notify(e.message));row.append(image,label,remove);list.append(row);}
  $('noBrandingAssets').classList.toggle('hidden',assets.length>0);
 }
 private async upload(slot:'logo'|'icon',input:HTMLInputElement){
  const files=[...(input.files||[])];if(!files.length)return;
  input.disabled=true;$('brandingUploadStatus').textContent='Uploading…';
  try{for(const file of files){if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose a PNG, JPG, WebP or GIF image.');if(file.size>2*1024*1024)throw Error('Choose an image smaller than 2 MB.');const dataUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Could not read this image.'));reader.readAsDataURL(file);});await this.action('branding/upload',{slot,dataUrl});}$('brandingUploadStatus').textContent='Saved to your channel';this.notify('Branding uploaded and added to the pond.');}
  catch(error){$('brandingUploadStatus').textContent='Upload failed';this.notify((error as Error).message);}
  finally{input.disabled=false;input.value='';}
 }
}
