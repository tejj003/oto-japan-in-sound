// Presentation has its own screen-sized canvas; the portrait export stays intact.
export function setupFullscreen(frame,button,onResize){
  let active=false,native=false,previousInert=[];
  const canvas=document.createElement('canvas');
  canvas.id='presentationArt';canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Fullscreen music-reactive Japanese landscape');
  frame.append(canvas);
  function resize(){
    if(!active)return;
    const {width,height}=frame.getBoundingClientRect();
    const density=Math.min(devicePixelRatio||1,2,Math.sqrt(5_000_000/(width*height)));
    const w=Math.max(1,Math.round(width*density)),h=Math.max(1,Math.round(height*density));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    onResize();
  }
  const observer=new ResizeObserver(resize);observer.observe(frame);
  window.addEventListener('resize',resize);
  const chrome=[...document.querySelectorAll('.skip-link,.masthead,#about,.studio-heading,.collection,.controls,footer,.preview-meta,.preview-bottom,.stage-corner')];
  const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
  frame.tabIndex=-1;

  function restoreStudio(){
    if(!active)return;
    active=false;native=false;
    document.body.classList.remove('art-only');
    chrome.forEach((el,i)=>{el.inert=previousInert[i];});
    button.focus({preventScroll:true});
  }
  async function leave(){
    if(!active)return;
    if(fullscreenElement()===frame){
      const exit=document.exitFullscreen||document.webkitExitFullscreen;
      try{await exit.call(document);}catch{/* Restore the studio if the browser already exited. */}
    }
    restoreStudio();
  }
  async function enter(){
    if(active)return;
    active=true;
    previousInert=chrome.map(el=>el.inert);
    chrome.forEach(el=>{el.inert=true;});
    document.body.classList.add('art-only');
    canvas.setAttribute('aria-label',frame.querySelector('#art').getAttribute('aria-label'));
    resize();
    frame.focus({preventScroll:true});
    const request=frame.requestFullscreen||frame.webkitRequestFullscreen;
    if(!request)return; // Art-only viewport on browsers without native fullscreen.
    try{
      await request.call(frame,{navigationUI:'hide'});
      native=fullscreenElement()===frame;
      if(!active&&native){
        await (document.exitFullscreen||document.webkitExitFullscreen).call(document);
      }
    }catch{/* Embedded browsers can deny fullscreen; the art-only viewport stays available. */}
  }
  button.addEventListener('click',enter);
  frame.addEventListener('click',()=>{if(active)void leave();});
  document.addEventListener('keydown',event=>{
    if(active&&event.key==='Escape'){event.preventDefault();void leave();}
  });
  function syncNative(){
    if(fullscreenElement()===frame)native=true;
    else if(native)restoreStudio();
  }
  document.addEventListener('fullscreenchange',syncNative);
  document.addEventListener('webkitfullscreenchange',syncNative);
  return {canvas,isActive:()=>active};
}
