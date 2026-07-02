import{readCounter,incrementCounter,setCounter}from"./firebase.js";

const app=document.getElementById("app");
const video=document.getElementById("bgVideo");
const startScreen=document.getElementById("startScreen");
const startBtn=document.getElementById("startBtn");
const debug=document.getElementById("debug");

const V={
  relique:"videos/relique.mp4",
  intro:"videos/intro.mp4",
  boucle:"videos/boucle.mp4",
  fin:"videos/fin.mp4",
  ouverture:"videos/ouverture.mp4",
  reveil:"videos/reveil.mp4",
  attaque:"videos/attaque.mp4",
  accueil:"videos/accueil.mp4",
  piege1:"videos/piege1.mp4",
  piege2:"videos/piege2.mp4",
};

const SHOP={
  fuite:{
    open:"videos/open-boutique-fuyards.mp4",
    loop:"videos/fond-boutique-fuyards.mp4",
    exit:"videos/exit-boutique-fuyards.mp4"
  },
  sacrifice:{
    open:"videos/open-boutique-sacrifice.mp4",
    loop:"videos/fond-boutique-sacrifice.mp4",
    exit:"videos/exit-boutique-sacrifice.mp4"
  },
  soumission:{
    open:"videos/open-boutique-soumis.mp4",
    loop:"videos/fond-boutique-soumis.mp4",
    exit:"videos/exit-boutique-soumis.mp4"
  }
};

const SHOP_PRODUCTS={
  fuite:[
    ["images/artefact-fu.png","Artefact — Fuyards","Relique discrète pour ceux qui savent encore disparaître.","32 €"],
    ["images/bijou-fu.png","Bijou — Fuyards","Un signe porté par les survivants des passages oubliés.","18 €"],
    ["images/logo-fuyards.png","Logo — Fuyards","Marque du clan pour ceux qui refusent l’offrande.","8 €"],
    ["images/tenue-fu.png","Tenue — Fuyards","Pour se fondre dans l’ombre sans renoncer au seuil.","45 €"],
    ["images/tshirt-fu.png","T-shirt — Fuyards","Le vêtement des âmes qui ont choisi la survie.","25 €"]
  ],
  sacrifice:[
    ["images/artefact-sa.png","Artefact — Sacrifice","Relique offerte à ceux qui acceptent de payer le prix.","32 €"],
    ["images/bijou-sa.png","Bijou — Sacrifice","Sceau porté par les élus qui souffrent sans plier.","18 €"],
    ["images/logo-sacrifice.png","Logo — Sacrifice","Marque rouge du pacte et de l’offrande.","8 €"],
    ["images/tenue-sa.png","Tenue — Sacrifice","Pour entrer dans le cercle sans détourner le regard.","45 €"],
    ["images/tshirt-sa.png","T-shirt — Sacrifice","Le vêtement de ceux qui nourrissent le lien.","25 €"]
  ],
  soumission:[
    ["images/artefact-sou.png","Artefact — Soumis","Relique confiée à ceux qui courbent l’échine.","32 €"],
    ["images/bijou-sou.png","Bijou — Soumis","Signe d’appartenance à ceux qui ont accepté l’ordre.","18 €"],
    ["images/logo-soumis.png","Logo — Soumis","Marque du clan pour ceux qui obéissent au seuil.","8 €"],
    ["images/tenue-sou.png","Tenue — Soumis","Pour se présenter devant le trône sans résistance.","45 €"],
    ["images/tshirt-sou.png","T-shirt — Soumis","Le vêtement de ceux qui ont choisi l’obéissance.","25 €"]
  ]
};

const STANDARD_PRODUCTS=[
  ["images/affiche-st.png","Affiche","Visuel rituel pour marquer le passage des abysses.","12 €"],
  ["images/album-st.png","Album","Trace sonore du seuil et des créatures qui l’habitent.","15 €"],
  ["images/calice-st.gif","Calice","Objet cérémoniel pour conclure le rituel.","22 €"],
  ["images/casquette-st.png","Casquette","Pour garder la tête froide quand l’appel commence.","20 €"],
  ["images/tshirt1-st.png","T-shirt I","Premier fragment textile du rituel Néogate.","25 €"],
  ["images/tshirt2-st.png","T-shirt II","Variation standard pour porter l’appel hors de la salle.","25 €"],
  ["images/tshirt3-st.png","T-shirt III","Marque sombre pour ceux qui ont entendu la porte s’ouvrir.","25 €"],
  ["images/tshirt4-st.png","T-shirt IV","Une autre forme du sceau, imprimée pour les témoins.","25 €"],
  ["images/tshirt5-st.png","T-shirt V","Pour ceux qui ne veulent pas oublier le monstre endormi.","25 €"],
  ["images/tshirt6-st.png","T-shirt VI","Dernière variation standard du passage.","25 €"],
  ["images/verre-st.gif","Verre","Récipient d’apparat pour porter un toast au seuil.","14 €"],
  ["images/vinyle-st.png","Vinyle","Objet de collection pour écouter les abysses tourner.","30 €"]
];

const OBJECTIF=100;
let phase="start";
let timer=null;
let cameraStream=null;
let cameraScanFrame=null;
let activeShop=null;
let pendingShopAction=null;
let activeTrap=null;

function err(message){
  debug.style.display="block";
  debug.textContent=message;
}

function play(src,{loop=false,muted=false}={}){
  video.pause();
  video.removeAttribute("src");
  video.load();

  video.classList.remove("story-video","shop-video");

  if(src.includes("boutique")){
    video.classList.add("shop-video");
  }else{
    video.classList.add("story-video");
  }

  video.loop=loop;
  video.muted=muted;
  video.src=src;
  video.load();

  return video.play().catch(e=>{
    console.error(e);
    err("Vidéo bloquée : "+src);
  });
}

function playLoopBackground(){
  phase="background-loop";
  play(V.boucle,{loop:true,muted:false});
}

function transitionTo(callback){
  stopCamera();
  hide();
  phase="transition";
  play(V.fin,{loop:false,muted:false});
  const handler=()=>{
    video.removeEventListener("ended",handler);
    callback();
  };
  video.addEventListener("ended",handler);
}

function show(html){
  app.innerHTML=html;
  app.className="screen visible fade-in";
  omegaize(app);
}

function hide(){
  app.className="screen hidden";
}

function omegaize(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    node.nodeValue=node.nodeValue.replace(/[oO]/g,"Ω");
  });
}

video.addEventListener("error",()=>err("Erreur vidéo: "+(video.currentSrc||video.src)));

video.addEventListener("ended",()=>{
  if(phase==="accueil-video"){
    phase="relique";
    play(V.relique,{muted:false});
  }else if(phase==="relique"){
    phase="appel-intro";
    showAppel();
    play(V.intro,{muted:false});
  }else if(phase==="appel-intro"){
    phase="appel-boucle";
    play(V.boucle,{loop:true,muted:false});
  }else if(phase==="ouverture"){
    showHurlement();
  }else if(phase==="reveil"){
    showFuite();
  }else if(phase==="trap"){
    showTrapMessage();
  }else if(phase==="attaque"){
    showOffrande();
  }else if(phase==="shop-opening"){
    showShopProducts();
  }else if(phase==="shop-exit"){
    runShopExitAction();
  }
});

startBtn.textContent="Répondre à l'appel";

startBtn.addEventListener("click",()=>{
  startScreen.style.display="none";
  phase="accueil-video";
  play(V.accueil,{muted:false});
});

async function showAppel(){
  show(`
    <div class="panel">
      <h1>L'Appel des Abysses</h1>
      <p>
        Insouciant… toi qui as cédé à l’appel du monstre endormi.<br><br>
        En entamant ce funeste rituel, tu guides lentement la bête vers son réveil.<br><br>
        Par ton geste, tu as contribué à franchir l’irréparable.
      </p>
      <div class="counter-title">Nombre de blasphèmes</div>
      <div id="count" class="counter">Chargement...</div>
      <button id="next" class="ritual-button locked">Franchir le seuil</button>
    </div>
  `);

  try{
    const valeur=await incrementCounter("blasphemes");
    animateCount(valeur);

    if(valeur>=OBJECTIF){
      setTimeout(()=>document.getElementById("next").classList.remove("locked"),2000);
    }

document.getElementById("next").onclick=()=>{
  hide();
  phase="ouverture";
  play(V.ouverture,{muted:false});
};

  }catch(e){
    document.getElementById("count").textContent="Erreur Firebase";
  }
}

function animateCount(final){
  const el=document.getElementById("count");
  const start=Date.now();
  const duration=1800;

  function step(){
    const progress=Math.min((Date.now()-start)/duration,1);
    const current=Math.floor(progress*final);
    el.textContent=current+" / "+OBJECTIF;
    if(progress<1){
      requestAnimationFrame(step);
    }else{
      el.textContent=final+" / "+OBJECTIF;
    }
  }

  step();
}

function showHurlement(){
  playLoopBackground();
  show(`
    <div class="panel">
      <h1>Le Réveil</h1>
      <p>
        Il est presque trop tard.<br><br>
        Seuls vos hurlements et vos acclamations désespérées pourront peut-être bercer la bête et prolonger sa somnolence.<br><br>
        Accordez à vos âmes un court répit : braillez donc pour votre salut, inconscientes créatures.
      </p>
      <button id="mic" class="ritual-button">Autoriser le micro</button>
      <div id="intensity" class="counter">0 %</div>
      <div class="progress-wrap"><div id="bar" class="progress-bar"></div></div>
      <p id="micStatus" class="status">La bête écoute...</p>
      <button id="toFuite" class="ritual-button locked">Chercher une issue</button>
    </div>
  `);

  document.getElementById("mic").onclick=startMic;
  document.getElementById("toFuite").onclick=()=>{
  hide();
  phase="reveil";
  play(V.reveil,{muted:false});
};
}

async function startMic(){
  const status=document.getElementById("micStatus");
  const bar=document.getElementById("bar");
  const intensity=document.getElementById("intensity");
  const btn=document.getElementById("toFuite");

  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const ac=new AudioContext();
    const source=ac.createMediaStreamSource(stream);
    const analyser=ac.createAnalyser();
    const data=new Uint8Array(2048);
    analyser.fftSize=2048;
    source.connect(analyser);

    let valid=false;
let accumulated=0;
let lastTime=performance.now();
const targetSeconds=10;

document.getElementById("mic").style.display="none";

function loop(){
  if(valid)return;

  const now=performance.now();
  const delta=(now-lastTime)/1000;
  lastTime=now;

  analyser.getByteTimeDomainData(data);
  let max=0;
  for(const x of data)max=Math.max(max,Math.abs(x-128));
  const pct=Math.min(100,Math.round(max*1.25));

  intensity.textContent=pct+" %";
  bar.style.width=(accumulated/targetSeconds*100)+"%";

  if(pct>=80){

  accumulated=Math.min(targetSeconds,accumulated+delta);

  status.textContent=
    "Continuez à hurler... "+
    accumulated.toFixed(1)+
    " / "+
    targetSeconds+
    " s";

}else{

  status.textContent=
    "Hurlez plus fort. Progression conservée : "+
    accumulated.toFixed(1)+
    " / "+
    targetSeconds+
    " s";

}

  if(accumulated>=targetSeconds){
    valid=true;
    bar.style.width="100%";
    status.textContent="Vos cris ont retardé l'inévitable.";
    btn.classList.remove("locked");
    omegaize(status.parentElement);
    return;
  }

  requestAnimationFrame(loop);
}
    loop();
  }catch(e){
    status.textContent="Micro refusé ou indisponible.";
    omegaize(status.parentElement);
  }
}

function showFuite(){
  playLoopBackground();
  show(`
    <div class="panel">
      <h1>La Fuite</h1>
      <p>
        Trouvez un moyen de vous sauver du monstre.<br><br>
        Quelque part dans la salle, un passage attend les plus attentifs.<br><br>
        Ainsi quelques chanceux survivront peut-être, mais le temps vous est compté.
      </p>
      <div id="timer" class="timer">60:00</div>
      <p id="fuiteMsg" class="status">Les abysses vous observent aussi.</p>
      <div id="cameraBox" class="camera-box locked">
        <video id="cameraPreview" autoplay playsinline muted></video>
      </div>
      <button id="camera" class="ritual-button">Autoriser la caméra</button>
      <p class="small camera-help">
        Si cliquer ne vous aide pas, c'est sûrement que la bête joue avec votre esprit : défiez-la en ouvrant directement votre appareil photo. Vous devancerez peut-être même le monstre pour fuir.
      </p>
      <button id="patience" class="ritual-button locked">Ta patience va-t-elle être salvatrice ?</button>
    </div>
  `);

  let remaining=3600;
  const timerEl=document.getElementById("timer");
  const msg=document.getElementById("fuiteMsg");
  const patience=document.getElementById("patience");

  document.getElementById("camera").onclick=startCamera;
  patience.onclick=()=>transitionTo(showOffrande);

  clearInterval(timer);
  timer=setInterval(()=>{
    remaining--;
    const minutes=Math.floor(remaining/60);
    const seconds=(remaining%60).toString().padStart(2,"0");
    timerEl.textContent=minutes+":"+seconds;

    if(remaining===2700)msg.textContent="Les abysses grondent.";
    if(remaining===1800)msg.textContent="La porte tremble.";
    if(remaining===900)msg.textContent="Quelque chose approche.";
    if(remaining===300)msg.textContent="Il sent votre peur.";

    if(remaining<=0){
      clearInterval(timer);
      msg.textContent="Le temps n'a pas été votre allié.";
      patience.classList.remove("locked");
      omegaize(app);
    }
  },1000);
}

async function startCamera(){
  const msg=document.getElementById("fuiteMsg");
  const box=document.getElementById("cameraBox");
  const preview=document.getElementById("cameraPreview");

  try{
    stopCamera();

    cameraStream=await navigator.mediaDevices.getUserMedia({
      video:{
        facingMode:{ideal:"environment"},
        width:{ideal:1280},
        height:{ideal:720}
      },
      audio:false
    });

    preview.srcObject=cameraStream;
    await preview.play();

    box.classList.remove("locked");
    msg.textContent="La caméra s'ouvre. Cherchez les passages. Méfiez-vous des faux seuils.";
    omegaize(app);

    const canvas=document.createElement("canvas");
    const ctx=canvas.getContext("2d",{willReadFrequently:true});

    function scan(){
      if(!cameraStream || preview.readyState<2 || !preview.videoWidth){
        cameraScanFrame=requestAnimationFrame(scan);
        return;
      }

      canvas.width=preview.videoWidth;
      canvas.height=preview.videoHeight;
      ctx.drawImage(preview,0,0,canvas.width,canvas.height);

      const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);

      let code=null;

      try{
        code=jsQR(imageData.data,canvas.width,canvas.height,{
          inversionAttempts:"attemptBoth"
        });
      }catch(e){
        console.error(e);
      }

      if(code && code.data){
        msg.textContent="Un passage a été trouvé...";
        stopCamera();
        window.location.href=code.data;
        return;
      }

      cameraScanFrame=requestAnimationFrame(scan);
    }

    scan();

  }catch(e){
    console.error(e);
    msg.textContent="La caméra refuse de s'ouvrir. La bête joue peut-être avec votre esprit.";
    omegaize(app);
  }
}

function stopCamera(){
  if(cameraScanFrame){
    cancelAnimationFrame(cameraScanFrame);
    cameraScanFrame=null;
  }

  if(cameraStream){
    cameraStream.getTracks().forEach(track=>track.stop());
    cameraStream=null;
  }
}

function startTrap(name){
  stopCamera();
  clearInterval(timer);
  activeTrap=name;
  hide();
  phase="trap";
  play(V[name],{muted:false});
}

function startAttack(){
  stopCamera();
  clearInterval(timer);
  hide();
  phase="attaque";
  play(V.attaque,{muted:false});
}

function showTrapMessage(){
  show(`
    <div class="panel">
      <p class="trap-message">
        Vous échappez de peu au monstre et revenez en tremblant sur vos pas.
      </p>
    </div>
  `);

  setTimeout(()=>{
    activeTrap=null;
    showFuite();
  },4200);
}

function showOffrande(){
  playLoopBackground();
  clearInterval(timer);
  show(`
    <div class="panel">
      <h1>L'Offrande</h1>
      <p>
        Frêle et naïve créature…<br><br>
        Par cet acte immonde, tu me renouvelles ton allégeance.<br><br>
        Moi, le Destructeur, je t’ai appelé… et tu as répondu.
      </p>
      <div class="choices">
        <button class="choice" data-choice="sacrifice"><strong>Résister</strong>Certains doivent tomber pour que d’autres survivent.</button>
        <button class="choice" data-choice="fuite"><strong>Fuir</strong>Les profondeurs n'oublient jamais un visage.</button>
        <button class="choice" data-choice="soumission"><strong>Se soumettre</strong>Tu n’as jamais été libre.</button>
      </div>
      <p id="offrandeMsg" class="status"></p>
    </div>
  `);

  document.querySelectorAll(".choice").forEach(button=>{
    button.onclick=async()=>{
      const choice=button.dataset.choice;
      await incrementCounter(choice);
      document.getElementById("offrandeMsg").textContent="Ton choix a été gravé dans les abysses...";
      omegaize(app);
      setTimeout(()=>startShop(choice),650);
    };
  });
}
function productCard(product){
  const [img,title,desc,price]=product;
  return `
    <article class="product-card">
      <img src="${img}" alt="${title}">
      <h2>${title}</h2>
      <p>${desc}</p>
      <div class="price">${price}</div>
      <div class="fake-note">ÉDITION FACTICE</div>
    </article>
  `;
}

function productTrack(products){
  return [...products,...products].map(productCard).join("");
}
function startShop(choice){
  stopCamera();
  clearInterval(timer);

  activeShop=choice;
  pendingShopAction=null;
  const config=SHOP[choice];

  hide();
  phase="shop-opening";
  play(config.open,{loop:false,muted:false});
}

function showShopProducts(){
  const config=SHOP[activeShop];
  phase="shop-loop";

  play(config.loop,{loop:true,muted:false});

  app.innerHTML=`
  <div class="shop-stage">
    <main id="shopContent" class="shop-content visible">
      <section class="product-zone clan">
        <div class="product-track">${productTrack(SHOP_PRODUCTS[activeShop])}</div>
      </section>

      <section class="product-zone standard">
        <div class="product-track">${productTrack(STANDARD_PRODUCTS)}</div>
      </section>

      <div class="shop-actions">
        <button id="quitShop" class="ritual-button">QUITTER LA BOUTIQUE</button>
        <button id="newClan" class="ritual-button">CHOISIR UN NOUVEAU CLAN</button>
      </div>
    </main>
  </div>
`;
app.className="shop-ui visible";
omegaize(app);

  document.getElementById("quitShop").onclick=()=>exitShop("close");
  document.getElementById("newClan").onclick=()=>exitShop("offrande");

}

function exitShop(action){
  const config=SHOP[activeShop];
  pendingShopAction=action;
  phase="shop-exit";
  hide();
  play(config.exit,{loop:false,muted:false});

  setTimeout(()=>{
    if(phase==="shop-exit")runShopExitAction();
  },6500);
}

function runShopExitAction(){
  const action=pendingShopAction;
  pendingShopAction=null;
  activeShop=null;

  if(action==="offrande"){
    showOffrande();
    return;
  }

  if(action==="close"){
    phase="closed";
    window.close();
    show(`
      <div class="panel">
        <h1>VΩUS PΩUVEZ FERMER CET ΩNGLET</h1>
      </div>
    `);
  }
}
const routeParams=new URLSearchParams(window.location.search);
const route=routeParams.get("route");

function clearRoute(){
  window.history.replaceState({},document.title,window.location.pathname);
}

if(route==="appel"){
  startScreen.style.display="none";
  phase="appel-intro";
  showAppel();
  play(V.intro,{muted:false});
  clearRoute();
}

if(route==="reveil"){
  startScreen.style.display="none";
  showHurlement();
  clearRoute();
}

if(route==="fuite"){
  startScreen.style.display="none";
  showFuite();
  clearRoute();
}

if(route==="offrande"){
  startScreen.style.display="none";
  showOffrande();
  clearRoute();
}

function routeButton(label, action){
  startScreen.style.display="none";
  show(`
    <div class="panel">
      <button id="routeStart" class="ritual-button">${label}</button>
    </div>
  `);

  document.getElementById("routeStart").onclick=()=>{
    action();
    clearRoute();
  };
}

if(route==="piege1"){
  routeButton("Franchir le passage",()=>startTrap("piege1"));
}

if(route==="piege2"){
  routeButton("Franchir le passage",()=>startTrap("piege2"));
}

if(route==="attaque"){
  routeButton("Franchir le passage",()=>startAttack());
}