// Direction locks prevent diagonal drags becoming accidental hard drops.
globalThis.BlockfallGestures = class {
  constructor(){this.cancel();}
  cancel(){this.pointer=null;}
  down(id,x,y,time,cell){
    if(this.pointer)return false;
    this.pointer={id,x,y,lastX:x,start:time,cell:Math.max(16,Math.min(34,cell)),axis:null,moved:false};return true;
  }
  move(id,x,y){
    const p=this.pointer;if(!p||p.id!==id)return [];
    const dx=x-p.x,dy=y-p.y;
    if(Math.hypot(dx,dy)>9)p.moved=true;
    if(!p.axis&&p.moved){
      if(Math.abs(dx)>Math.abs(dy)*1.25)p.axis='x';
      else if(Math.abs(dy)>Math.abs(dx)*1.25)p.axis='y';
    }
    const actions=[];
    if(p.axis==='x'){
      const steps=Math.trunc((x-p.lastX)/p.cell);
      for(let i=0;i<Math.min(10,Math.abs(steps));i++)actions.push(steps>0?'right':'left');
      p.lastX+=steps*p.cell;
    }
    return actions;
  }
  up(id,x,y,time){
    const p=this.pointer;if(!p||p.id!==id)return [];
    const actions=this.move(id,x,y);this.cancel();
    const dx=x-p.x,dy=y-p.y;
    if(!p.moved&&time-p.start<=350)actions.push('rotate');
    else if(p.axis==='y'&&dy>=Math.max(42,p.cell*1.8)&&dy>Math.abs(dx)*1.5)actions.push('hard');
    return actions;
  }
};
