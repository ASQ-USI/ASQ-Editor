javascript:(function(){
  //load css
  var aeC=document.createElement("link")
  aeC.setAttribute("rel", "stylesheet")
  aeC.setAttribute("type", "text/css")
  aeC.setAttribute("href", 'https://raw.github.com/ASQ-USI/ASQ-Editor/devel/dist/ASQ-Editor.min.css')
  document.getElementsByTagName('head')[0].appendChild(aeC);

  //load script
  var aES=document.createElement('SCRIPT');
  aES.type='text/javascript';
  aES.src='https://raw.github.com/ASQ-USI/ASQ-Editor/devel/dist/ASQ-Editor.min.js';
  if(typeof(aES)!=='undefined'){
    document.getElementsByTagName('head')[0].appendChild(aES);
  }
  // aES.onloadDone=false;//for Opera
  // aES.onload=function(){
  //   aES.onloadDone=true;
  // };
  // aEScript.onReadystatechange=function(){
  //   if(aEScript.readyState==='loaded'&& !aEScript.onloadDone){
  //     aEScript.onloadDone=true;callback();
  //   }
  // } 
})();