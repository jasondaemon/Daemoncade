const ROWS={
 A:'01110/10001/10001/11111/10001/10001/10001',B:'11110/10001/10001/11110/10001/10001/11110',C:'01111/10000/10000/10000/10000/10000/01111',D:'11110/10001/10001/10001/10001/10001/11110',E:'11111/10000/10000/11110/10000/10000/11111',F:'11111/10000/10000/11110/10000/10000/10000',G:'01111/10000/10000/10111/10001/10001/01111',H:'10001/10001/10001/11111/10001/10001/10001',I:'11111/00100/00100/00100/00100/00100/11111',J:'00111/00010/00010/00010/10010/10010/01100',K:'10001/10010/10100/11000/10100/10010/10001',L:'10000/10000/10000/10000/10000/10000/11111',M:'10001/11011/10101/10101/10001/10001/10001',N:'10001/11001/10101/10011/10001/10001/10001',O:'01110/10001/10001/10001/10001/10001/01110',P:'11110/10001/10001/11110/10000/10000/10000',Q:'01110/10001/10001/10001/10101/10010/01101',R:'11110/10001/10001/11110/10100/10010/10001',S:'01111/10000/10000/01110/00001/00001/11110',T:'11111/00100/00100/00100/00100/00100/00100',U:'10001/10001/10001/10001/10001/10001/01110',V:'10001/10001/10001/10001/10001/01010/00100',W:'10001/10001/10001/10101/10101/10101/01010',X:'10001/10001/01010/00100/01010/10001/10001',Y:'10001/10001/01010/00100/00100/00100/00100',Z:'11111/00001/00010/00100/01000/10000/11111',
 0:'01110/10001/10011/10101/11001/10001/01110',1:'00100/01100/00100/00100/00100/00100/01110',2:'01110/10001/00001/00010/00100/01000/11111',3:'11110/00001/00001/01110/00001/00001/11110',4:'00010/00110/01010/10010/11111/00010/00010',5:'11111/10000/10000/11110/00001/00001/11110',6:'01110/10000/10000/11110/10001/10001/01110',7:'11111/00001/00010/00100/01000/01000/01000',8:'01110/10001/10001/01110/10001/10001/01110',9:'01110/10001/10001/01111/00001/00001/01110',
 ':':'00000/00100/00100/00000/00100/00100/00000','/':'00001/00001/00010/00100/01000/10000/10000','-':'00000/00000/00000/11111/00000/00000/00000',',':'00000/00000/00000/00000/00000/00100/01000','+':'00000/00100/00100/11111/00100/00100/00000',
};
const FONT=Object.fromEntries(Object.entries(ROWS).map(([key,value])=>[key,value.split('/')]));
export class DMD{
 constructor(canvas){this.canvas=canvas;canvas.width=640;canvas.height=160;this.ctx=canvas.getContext('2d');this.pixels=new Uint8Array(128*32);this.queue=[];this.current=null;this.last=-1;this.time=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.base=document.createElement('canvas');this.base.width=640;this.base.height=160;const c=this.base.getContext('2d');c.fillStyle='#100d09';c.fillRect(0,0,640,160);c.fillStyle='#2c1a0e';for(let y=0;y<32;y++)for(let x=0;x<128;x++)c.fillRect(x*5+1,y*5+1,3,3);
 }
 push(event){const e={...event,priority:event.priority||2,expires:this.time+7,duration:2.4};if(!this.current||e.priority>this.current.priority){this.current={...e,start:this.time};}else if(!this.queue.some(q=>q.type===e.type)){this.queue.push(e);this.queue.sort((a,b)=>b.priority-a.priority);this.queue=this.queue.slice(0,3);}}
 dot(x,y){x=Math.round(x);y=Math.round(y);if(x>=0&&x<128&&y>=0&&y<32)this.pixels[y*128+x]=1;}
 text(text,y,scale=1,x=null){text=String(text).toUpperCase();x=x??Math.round((128-(text.length*6-1)*scale)/2);for(const ch of text){const rows=FONT[ch];if(rows)rows.forEach((row,ry)=>[...row].forEach((v,rx)=>{if(v==='1')for(let a=0;a<scale;a++)for(let b=0;b<scale;b++)this.dot(x+rx*scale+a,y+ry*scale+b);}));x+=6*scale;}}
 car(x,y,scale=1){['0000111111000000','0011100001110000','1111111111111100','1111111111111110','0011000000110000'].forEach((r,dy)=>[...r].forEach((v,dx)=>{if(v==='1')for(let a=0;a<scale;a++)for(let b=0;b<scale;b++)this.dot(x+dx*scale+a,y+dy*scale+b);}));}
 circle(x,y,r=3){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r)this.dot(x+dx,y+dy);}
 draw(time,rules,phase){this.time=time;if(Math.floor(time*20)===this.last)return;this.last=Math.floor(time*20);
  if(this.current&&time-this.current.start>this.current.duration)this.current=null;
  if(!this.current){this.queue=this.queue.filter(e=>e.expires>time);const next=this.queue.shift();if(next)this.current={...next,start:time};}
  this.pixels.fill(0);const e=this.current;
  if(e){
    this.text(e.title,1,1);this.text(e.detail?.slice(0,21)||'',24);const age=this.reduced?1:time-e.start;
    if(e.type==='multiball')for(let i=0;i<3;i++)this.circle(42+i*22+Math.sin(age*5+i)*4,16+Math.sin(age*7+i*2)*2,3);
    else if(e.type==='lock'){for(let i=0;i<3;i++){const x=48+i*16;for(let j=-4;j<=4;j++){this.dot(x+j,11);this.dot(x+j,21);this.dot(x-5,16+j/2);this.dot(x+5,16+j/2);}}this.circle(48+Math.min(2,Math.floor(age*1.5))*16,16,3);}
    else if(e.type==='jackpot'||e.type==='mission'){this.car(Math.min(78,age*55-30),11,2);for(let x=110;x<123;x++)for(let y=11;y<21;y++)if((Math.floor(x/2)+Math.floor(y/2))%2===0)this.dot(x,y);}
    else if(e.type==='bank'||e.type==='ramp'){for(let i=0;i<18;i++)if(i<Math.min(18,age*16+2))for(let y=0;y<3+i%4;y++)this.dot(38+i*3,20-y);}
    else this.car(this.reduced?48:((age*48)%156)-28,12,2);
  }
  else if(phase==='menu'){this.text('MIDNIGHT RUN',3);this.text('PUSH YOUR LUCK',15);this.car(this.reduced?56:(time*32)%150-16,25);}
  else {this.text(rules.score.toLocaleString(),2,2);this.text(phase==='ready'?'HOLD + RELEASE LAUNCH':rules.multiball?'MULTIBALL / JACKPOTS':`BALL ${Math.min(rules.ballNumber,rules.ballsTotal)} OF ${rules.ballsTotal} / ${rules.multiplier}X`,23);}
  const c=this.ctx;c.drawImage(this.base,0,0);c.fillStyle='#ffac4c';for(let i=0;i<this.pixels.length;i++)if(this.pixels[i])c.fillRect((i%128)*5+1,Math.floor(i/128)*5+1,3,3);
 }
 clear(){this.queue=[];this.current=null;}
}
