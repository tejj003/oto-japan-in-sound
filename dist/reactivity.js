// Fast audio envelopes and onset detection, measured from the playing media element.
const ease=(current,target,dt,attack,release)=>current+(target-current)*(1-Math.exp(-dt/(target>current?attack:release)));
export class AudioReactivity {
 constructor(sampleRate,fftSize){
  this.hz=sampleRate/fftSize;this.spectrum=new Float32Array(fftSize/2);this.waveform=new Float32Array(fftSize);
  this.reset();
 }
 reset(){
  this.peaks=[.004,.002,.0007];this.rmsPeak=.025;this.previousBass=0;this.previousRms=0;this.fluxMean=.02;
  this.cooldown=0;this.visualCooldown=0;this.bass=0;this.mid=0;this.high=0;this.energy=0;this.pulse=0;this.beatCount=0;this.beats=[];
 }
 sample(analyser,dt,response,playing){
  dt=Math.min(.1,Math.max(.001,dt));this.cooldown=Math.max(0,this.cooldown-dt);this.visualCooldown=Math.max(0,this.visualCooldown-dt);this.pulse*=Math.exp(-dt/.17);
  this.beats=this.beats.map(b=>({...b,age:b.age+dt})).filter(b=>b.age<3.4);
  let rms=0,raw=[0,0,0];
  if(playing){
   analyser.getFloatFrequencyData(this.spectrum);analyser.getFloatTimeDomainData(this.waveform);
   for(const value of this.waveform)rms+=value*value;rms=Math.sqrt(rms/this.waveform.length);
   const band=(lo,hi)=>{const start=Math.max(1,Math.floor(lo/this.hz)),end=Math.min(this.spectrum.length,Math.ceil(hi/this.hz));let power=0;for(let i=start;i<end;i++){const db=this.spectrum[i];if(Number.isFinite(db))power+=10**(db/10);}return Math.sqrt(power/Math.max(1,end-start));};
   raw=[band(35,180),band(180,2200),band(2200,10000)];
  }
  const signal=playing&&rms>.0005;
  this.peaks=this.peaks.map((peak,i)=>Math.max([.0015,.0005,.00015][i],raw[i],peak*Math.exp(-dt/2.4)));
  this.rmsPeak=Math.max(.01,rms,this.rmsPeak*Math.exp(-dt/2.4));
  const flux=Math.max(Math.max(0,raw[0]-this.previousBass)/this.peaks[0],Math.max(0,rms-this.previousRms)/this.rmsPeak*.8);
  const threshold=Math.max(.075,this.fluxMean*1.7);
  if(signal&&rms>.0015&&flux>threshold&&this.cooldown===0){
   this.beatCount++;this.cooldown=.2;this.pulse=Math.min(1,.55+flux*.9);
   // Detect every beat, but let each visual wake breathe before launching another.
   if(this.visualCooldown===0){this.beats.push({id:this.beatCount,age:0,strength:this.pulse*response});this.beats=this.beats.slice(-8);this.visualCooldown=.65;}
  }
  this.fluxMean+=(flux-this.fluxMean)*(1-Math.exp(-dt/.7));this.previousBass=raw[0];this.previousRms=rms;
  const strength=response*1.8;
  const targets=raw.map((value,i)=>signal?Math.min(1,Math.sqrt(value/this.peaks[i]))*strength:0);
  this.bass=ease(this.bass,targets[0],dt,.025,.14);this.mid=ease(this.mid,targets[1],dt,.04,.19);this.high=ease(this.high,targets[2],dt,.02,.09);
  this.energy=ease(this.energy,signal?Math.min(1,rms/this.rmsPeak)*strength:0,dt,.025,.16);
  if(!playing){this.pulse*=Math.exp(-dt/.08);this.beats=this.beats.filter(b=>b.age<.35);}
  return {bass:this.bass+this.pulse*response*.55,mid:this.mid,high:this.high,energy:this.energy,pulse:this.pulse*response,beats:this.beats,beatCount:this.beatCount,rms,signal};
 }
}
