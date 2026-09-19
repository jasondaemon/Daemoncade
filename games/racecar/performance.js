export class FrameDiagnostics {
  constructor(limit=1200) {this.limit=limit;this.frames=[];this.index=0;this.total=0;this.longFrames=0;this.worst=0;}
  add(interval,work) {
    if(!Number.isFinite(interval)||interval<=0)return;
    this.frames[this.index]={interval,work};this.index=(this.index+1)%this.limit;
    this.total++;if(interval>50)this.longFrames++;this.worst=Math.max(this.worst,interval);
  }
  summary() {
    const intervals=this.frames.map(f=>f.interval).sort((a,b)=>a-b),work=this.frames.map(f=>f.work).sort((a,b)=>a-b);
    const at=(list,p)=>list[Math.min(list.length-1,Math.floor(list.length*p))]||0;
    return {frames:this.total,p50:at(intervals,.5),p95:at(intervals,.95),p99:at(intervals,.99),work95:at(work,.95),longFrames:this.longFrames,worst:this.worst};
  }
}
