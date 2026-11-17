import { scenes, renderArtwork, artworkReady, createMotion, advanceMotion, artworkBackground } from './art.js';
import { AudioReactivity } from './reactivity.js';
import { setupFullscreen } from './fullscreen.js';
const $ = (s) => document.querySelector(s);
const canvas=$('#art'), ctx=canvas.getContext('2d',{alpha:false}), audio=$('#audio');
setupFullscreen($('.canvas-wrap'),$('#fullscreenBtn'));
const state={ scene:Math.min(2,Math.max(0,Number(new URLSearchParams(location.search).get('scene'))||0)), animated:!matchMedia('(prefers-reduced-motion: reduce)').matches, time:0, bass:0, mid:0, high:0, response:.65, loaded:false, recording:false };
const motion=createMotion();
function paintArtwork(){renderArtwork(ctx,state.scene,state.time,state.bass,state.mid,state.high,true,motion);}
let audioContext,analyser,gain,recordDestination,frequency,reactivity,sourceURL,filmURL,recorder,recordStart=0,recordTimer,demoURL;
const meter=[...document.querySelectorAll('.audio-meter i')];
const feedback=(message)=>{$('#feedback').textContent=message;};
const time=(n)=>{n=Number.isFinite(n)?n:0;return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;};
function chooseScene(index){
  state.scene=index;
  $('.canvas-wrap').style.setProperty('--fullscreen-paper',artworkBackground(index));
  document.querySelectorAll('.artwork').forEach((el,i)=>{el.classList.toggle('selected',i===index);el.setAttribute('aria-pressed',String(i===index));});
  $('#previewName').textContent=`0${index+1} / ${scenes[index].name}`;canvas.setAttribute('aria-label',scenes[index].label);
  const url=new URL(location.href);url.searchParams.set('scene',index);history.replaceState(null,'',url);
  paintArtwork();
}
function drawSceneChoices(){
  document.querySelectorAll('.artwork').forEach((el,i)=>{
    const c=el.querySelector('canvas'),sample=document.createElement('canvas');sample.width=540;sample.height=960;
    renderArtwork(sample.getContext('2d'),i,4,0,0,0,false);c.width=240;c.height=300;
    const cx=c.getContext('2d');cx.drawImage(sample,30,270,480,620,0,0,240,300);
  });
}
drawSceneChoices();
document.querySelectorAll('.artwork').forEach((el,i)=>el.addEventListener('click',()=>chooseScene(i)));
Promise.all([document.fonts.ready,artworkReady]).then(()=>{drawSceneChoices();paintArtwork();});
chooseScene(state.scene);
$('#aboutBtn').addEventListener('click',()=>{const open=$('#about').hidden;$('#about').hidden=!open;$('#aboutBtn').setAttribute('aria-expanded',String(open));});
function syncMotion(){ $('#motionBtn').setAttribute('aria-label',state.animated?'Pause animation':'Resume animation');$('#motionBtn').title=state.animated?'Pause animation':'Resume animation';$('#motionBtn').setAttribute('aria-pressed',String(!state.animated));$('#motionBtn svg').innerHTML=state.animated?'<path d="M9 6v12M15 6v12"/>':'<path d="m9 5 10 7-10 7Z"/>'; }
$('#motionBtn').addEventListener('click',()=>{state.animated=!state.animated;syncMotion();});syncMotion();
function setupAudio(){
  if(audioContext)return;
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)throw new Error('This browser does not support music analysis. Try a current browser.');
  audioContext=new AudioCtx({latencyHint:'interactive'});analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.12;
  reactivity=new AudioReactivity(audioContext.sampleRate,analyser.fftSize);
  frequency=new Uint8Array(analyser.frequencyBinCount);gain=audioContext.createGain();gain.gain.value=Number($('#volume').value)/100;
  recordDestination=audioContext.createMediaStreamDestination();
  const source=audioContext.createMediaElementSource(audio);source.connect(analyser);analyser.connect(gain);gain.connect(audioContext.destination);analyser.connect(recordDestination);
}
async function play(){setupAudio();await audioContext.resume();await audio.play();}
function syncPlaying(){ const playing=!audio.paused;$('#playBtn').setAttribute('aria-label',playing?'Pause music':'Play music');$('#playBtn svg').innerHTML=playing?'<path d="M9 5v14M15 5v14"/>':'<path d="m9 5 10 7-10 7Z"/>';$('#liveState').textContent=state.recording?'Recording film':playing?'Reacting to your music':state.loaded?'Music paused':'Ambient preview'; }
audio.addEventListener('play',syncPlaying);audio.addEventListener('pause',syncPlaying);
audio.addEventListener('ended',()=>{if(state.recording)stopRecording();syncPlaying();});
audio.addEventListener('timeupdate',()=>{const duration=audio.duration||0;$('#elapsed').textContent=time(audio.currentTime);$('#duration').textContent=time(duration);$('#seek').value=duration?audio.currentTime/duration*100:0;});
audio.addEventListener('error',()=>{state.loaded=false;$('#playBtn').disabled=true;$('#recordBtn').disabled=true;$('#seek').disabled=true;feedback('This audio file could not be opened. Try MP3, WAV, or M4A.');});
audio.addEventListener('loadedmetadata',()=>{state.loaded=true;$('#playBtn').disabled=false;$('#seek').disabled=false;$('#recordBtn').disabled=!canRecord;$('#duration').textContent=time(audio.duration);$('#trackDetail').textContent=`${time(audio.duration)} / Audio stays on your device`;syncPlaying();});
$('#playBtn').addEventListener('click',async()=>{try{audio.paused?await play():audio.pause();}catch(e){feedback(e.message);}});
$('#seek').addEventListener('input',()=>{if(state.recording)return;audio.currentTime=Number($('#seek').value)/100*audio.duration;});
$('#sensitivity').addEventListener('input',e=>{state.response=Number(e.target.value)/100;$('#responseValue').value=e.target.value+'%';});
$('#volume').addEventListener('input',e=>{$('#volumeValue').value=e.target.value+'%';if(gain)gain.gain.setTargetAtTime(Number(e.target.value)/100,audioContext.currentTime,.02);});
async function loadFile(file){
  if(state.recording)return;
  if(!file)return;
  if(file.size>300*1024*1024){feedback('Choose an audio file smaller than 300 MB.');return;}
  if(file.type&&!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|aac|ogg|flac|aiff|opus)$/i.test(file.name)){feedback('Choose an audio file, such as MP3, WAV, or M4A.');return;}
  feedback('');audio.pause();state.loaded=false;$('#playBtn').disabled=true;$('#recordBtn').disabled=true;$('#seek').disabled=true;
  reactivity?.reset();motion.beats=[];motion.pulse=0;
  if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL=URL.createObjectURL(file);audio.src=sourceURL;audio.loop=false;audio.load();$('#trackName').textContent=file.name.replace(/\.[^.]+$/,'');$('#trackDetail').textContent='Opening your soundtrack…';
  $('#downloadLink').hidden=true;
}
$('#audioFile').addEventListener('change',e=>loadFile(e.target.files[0]));
for(const event of ['dragenter','dragover'])$('#dropzone').addEventListener(event,e=>{e.preventDefault();$('#dropzone').classList.add('dragover');});
for(const event of ['dragleave','drop'])$('#dropzone').addEventListener(event,e=>{e.preventDefault();$('#dropzone').classList.remove('dragover');if(event==='drop')loadFile(e.dataTransfer.files[0]);});
function makeDemo(){
  // Original pentatonic ambient composition, synthesized locally into a WAV file.
  const sr=22050,seconds=48,count=sr*seconds,data=new Float32Array(count),beat=.625;
  function add(at,length,fn,level){const start=Math.floor(at*sr),end=Math.min(count,start+Math.floor(length*sr));for(let i=start;i<end;i++){const t=(i-start)/sr;data[i]+=fn(t,length)*level;}}
  const tones=[293.665,349.228,391.995,440,523.251,587.33,698.456];
  for(let step=0;step<seconds/beat;step++){
    const at=step*beat;
    if(step%2===0)add(at,.46,t=>Math.sin(TAU*(48*t+3.2*(1-Math.exp(-t*28))))*Math.exp(-t*12),.48);
    if(step%4===2)add(at,.18,t=>(Math.sin(t*15321)+Math.sin(t*19393))*.5*Math.exp(-t*29),.07);
    add(at,.07,t=>(Math.sin(t*38441)+Math.sin(t*27131))*Math.exp(-t*90),step%2?.025:.012);
    if(step%2===0){const freq=tones[[0,2,4,2,1,3,5,4][Math.floor(step/2)%8]];add(at+.03,2.3,t=>(Math.sin(TAU*freq*t)*.7+Math.sin(TAU*freq*2.002*t)*.2+Math.sin(TAU*freq*3*t)*.1)*Math.exp(-t*3.1)*Math.min(1,t*70),.18);add(at+.37,1.8,t=>Math.sin(TAU*freq*t)*Math.exp(-t*3),.05);}
    if(step%8===0){const root=tones[Math.floor(step/8)%3]/4;[root,root*1.5,root*2].forEach(f=>add(at,5,(t,len)=>Math.sin(TAU*f*t)*Math.sin(Math.PI*t/len)**2,.075));}
  }
  const wav=new ArrayBuffer(44+count*2),v=new DataView(wav);const str=(p,s)=>{for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i));};str(0,'RIFF');v.setUint32(4,36+count*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,count*2,true);
  for(let i=0;i<count;i++){const fade=Math.min(1,i/sr/1.5,(count-i)/sr/2);v.setInt16(44+i*2,Math.max(-1,Math.min(1,data[i]*fade))*.85*32767,true);}
  return new File([wav],'Water & wood — Oto studio.wav',{type:'audio/wav'});
}
const TAU=Math.PI*2;
$('#demoBtn').addEventListener('click',async()=>{try{if(state.recording)return;$('#demoBtn').disabled=true;$('#demoBtn').setAttribute('aria-busy','true');setupAudio();await audioContext.resume();await loadFile(makeDemo());await new Promise((resolve,reject)=>{audio.addEventListener('canplay',resolve,{once:true});audio.addEventListener('error',reject,{once:true});});await play();}catch{feedback('The demo could not start. Try uploading an audio file.');}finally{$('#demoBtn').disabled=false;$('#demoBtn').removeAttribute('aria-busy');}});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
$('#stillBtn').addEventListener('click',async()=>{await artworkReady;paintArtwork();canvas.toBlob(blob=>{if(blob)download(blob,`oto-${scenes[state.scene].name.toLowerCase().replaceAll(' ','-')}.png`);else feedback('Could not save this image. Please try again.');},'image/png');});
const formats=['video/mp4;codecs=avc1.424028,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
const mime=typeof MediaRecorder!=='undefined'?formats.find(f=>MediaRecorder.isTypeSupported(f)):null;
const canRecord=Boolean(mime&&canvas.captureStream);
$('#exportNote').textContent=canRecord?`1080 × 1920 / ${mime.includes('mp4')?'MP4':'WebM'} with audio`:'Video recording needs a current Chrome, Edge, or Safari.';
function lockRecording(locked){for(const selector of ['#audioFile','#demoBtn','#seek','#playBtn','#recordLength'])$(selector).disabled=locked;document.querySelectorAll('.artwork').forEach(b=>b.disabled=locked);$('#motionBtn').disabled=locked;}
function stopRecording(){if(recorder&&recorder.state!=='inactive')recorder.stop();}
$('#recordBtn').addEventListener('click',async()=>{
  if(state.recording){stopRecording();return;}
  if(!state.loaded||!canRecord)return;
  try{
    feedback('');await artworkReady;setupAudio();await audioContext.resume();audio.currentTime=0;state.time=0;Object.assign(motion,createMotion());reactivity.reset();state.animated=true;syncMotion();
    const stream=canvas.captureStream(30);for(const track of recordDestination.stream.getAudioTracks())stream.addTrack(track);
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000,audioBitsPerSecond:192000});const chunks=[];const limit=Math.min(Number($('#recordLength').value),audio.duration||60);
    recorder.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data);});
    recorder.addEventListener('stop',()=>{
      clearInterval(recordTimer);state.recording=false;audio.pause();stream.getVideoTracks().forEach(track=>track.stop());lockRecording(false);$('#recordBtn').classList.remove('recording');$('#recordBtn span').textContent='Record a film';syncPlaying();
      if(chunks.length){const blob=new Blob(chunks,{type:recorder.mimeType});if(filmURL)URL.revokeObjectURL(filmURL);filmURL=URL.createObjectURL(blob);const a=$('#downloadLink');a.href=filmURL;a.download=`oto-${scenes[state.scene].name.toLowerCase().replaceAll(' ','-')}.${mime.includes('mp4')?'mp4':'webm'}`;a.textContent=`Download film (${(blob.size/1048576).toFixed(1)} MB)`;a.hidden=false;feedback('Your film is ready. Save it below.');}else feedback('No video was captured. Try recording again.');
    });
    recorder.addEventListener('error',()=>{feedback('Recording failed. Try a shorter film or a different browser.');stopRecording();});
    state.recording=true;lockRecording(true);$('#downloadLink').hidden=true;$('#recordBtn').classList.add('recording');recordStart=performance.now();recorder.start(1000);await play();syncPlaying();
    recordTimer=setInterval(()=>{const elapsed=(performance.now()-recordStart)/1000;$('#recordBtn span').textContent=`Stop recording / ${Math.ceil(Math.max(0,limit-elapsed))}s`;if(elapsed>=limit)stopRecording();},200);
  }catch(e){stopRecording();state.recording=false;lockRecording(false);feedback(`Recording could not start. ${e.message}`);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.recording){stopRecording();feedback('Recording stopped because the tab was hidden. Keep this tab visible while recording.');}});
let previous=performance.now(),lastPaint=0;
function frame(now){
  requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(document.hidden)return;
  const playing=!audio.paused&&state.loaded;
  const features=reactivity?.sample(analyser,dt,state.response,playing);
  if(features){
    const soften=(current,target,attack,release)=>current+(target-current)*(1-Math.exp(-dt/(target>current?attack:release)));
    state.bass=soften(state.bass,features.bass,.12,.38);state.mid=soften(state.mid,features.mid,.16,.45);state.high=soften(state.high,features.high,.1,.3);
  }
  if(analyser&&playing){analyser.getByteFrequencyData(frequency);meter.forEach((el,i)=>{const index=Math.min(frequency.length-1,Math.floor(2*(1.23**i)));el.style.transform=`scaleY(${.12+frequency[index]/255*.88})`;el.style.opacity='.9';});}
  else meter.forEach(el=>{el.style.transform='scaleY(.12)';el.style.opacity='.45';});
  $('#beatLight').style.opacity=String(.15+(features?.pulse??0)*.85);$('#beatLight').dataset.count=String(features?.beatCount??0);
  const status=playing?(features?.signal?'Audio detected / following the beat':'Listening for sound…'):state.loaded?'Press play to activate the response':'Add a track to activate the response';
  if($('#signalStatus').textContent!==status)$('#signalStatus').textContent=status;
  if(playing&&!state.recording)$('#liveState').textContent=features?.signal?'Following your music':'Quiet passage';
  if(state.animated){motion.beats=features?.beats??[];motion.pulse=features?.pulse??0;state.time+=dt*(playing?.18+(features?.energy??0)*.48:.06);advanceMotion(motion,dt,state.bass,state.mid,playing);}
  if(now-lastPaint>32){paintArtwork();lastPaint=now;}
}
requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{if(state.recording)stopRecording();audio.pause();if(sourceURL)URL.revokeObjectURL(sourceURL);if(filmURL)URL.revokeObjectURL(filmURL);});
