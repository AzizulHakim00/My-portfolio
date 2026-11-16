/* AHO cinematic overlay. Works with both Vercel static and Spring Boot. */
(() => {
  "use strict";
  const overlay=document.getElementById("aho-cinematic-intro");
  if(!overlay)return;
  const video=overlay.querySelector("video"),skip=overlay.querySelector("[data-aho-skip]");
  const sound=overlay.querySelector("[data-aho-sound]");
  const key="aho-cinematic-intro-seen-v1",url=new URL(window.location.href);
  const force=url.searchParams.get("intro")==="1";
  const mobile=window.matchMedia("(max-width:767px)").matches;
  const reduce=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  const homepage=window.location.pathname==="/"||window.location.pathname==="/index.html";
  let seen=false;
  try{seen=sessionStorage.getItem(key)==="1"}catch(_){}
  if(!homepage||reduce||(window.location.hash&&window.location.hash!=="#home")||(seen&&!force))return;
  const main=document.querySelector("main"),header=document.querySelector(".site-header");
  const previousFocus=document.activeElement;
  let done=false,waiting=0,retried=false;
  function finish(){
    if(done)return;
    done=true;
    clearTimeout(waiting);
    try{sessionStorage.setItem(key,"1")}catch(_){}
    overlay.classList.add("is-closing");
    document.body.classList.remove("aho-intro-active");
    if(main)main.inert=false;
    if(header)header.inert=false;
    setTimeout(()=>{
      video.pause();
      video.removeAttribute("src");
      video.load();
      overlay.hidden=true;
      if(previousFocus&&previousFocus!==document.body&&previousFocus.isConnected&&previousFocus.focus)previousFocus.focus({preventScroll:true});
    },700);
  }
  function load(src){
    video.src=src;
    video.muted=true;
    video.volume=1;
    video.playsInline=true;
    video.setAttribute("playsinline","");
    video.load();
    const p=video.play();
    if(p&&p.catch)p.catch((err)=>{
      if(done||err.name==="AbortError"||video.getAttribute("src")!==src)return;
      finish();
    });
  }
  waiting=setTimeout(finish,8500);
  overlay.hidden=false;
  document.body.classList.add("aho-intro-active");
  if(main)main.inert=true;
  if(header)header.inert=true;
  skip.focus({preventScroll:true});
  skip.addEventListener("click",finish);
  video.addEventListener("canplay",()=>{
    clearTimeout(waiting);
    overlay.classList.add("is-ready");
  });
  video.addEventListener("ended",finish);
  video.addEventListener("timeupdate",()=>{
    overlay.classList.toggle("can-enter",video.currentTime>=12.3);
  });
  video.addEventListener("click",()=>{
    if(video.currentTime>=12.3)finish();
  });
  video.addEventListener("error",()=>{
    if(mobile&&!retried){
      retried=true;
      load("/assets/video/aho-intro.mp4");
    }else finish();
  });
  sound.addEventListener("click",()=>{
    video.muted=!video.muted;
    sound.textContent=video.muted?"Sound off":"Sound on";
    sound.setAttribute("aria-pressed",String(!video.muted));
  });
  overlay.addEventListener("keydown",(event)=>{
    if(event.key==="Escape")finish();
    if(event.key==="Tab"){
      const controls=[sound,skip],now=controls.indexOf(document.activeElement);
      if(now<0)return;
      event.preventDefault();
      controls[(now+(event.shiftKey?1:1))%2].focus();
    }
  });
  load(mobile?"/assets/video/aho-intro-mobile.mp4":"/assets/video/aho-intro.mp4");
})();