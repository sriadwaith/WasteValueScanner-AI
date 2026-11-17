let model=null,currentImage=null,lastAI=null;
const wasteDB={
 bottle:{name:"Plastic Bottle",cat:"Plastic Waste",reuse:"Self-Watering Planter",value:"₹30 – ₹50",impact:"Reduces plastic pollution",icon:"🧴",steps:"Clean the bottle → cut an opening → add soil → plant a small seedling."},
 can:{name:"Aluminium Can",cat:"Metal Waste",reuse:"Mini Planter / Pen Holder",value:"₹25 – ₹60",impact:"Recovers valuable aluminium",icon:"🥫",steps:"Rinse the can → safely smooth the rim → decorate → use as a planter or holder."},
 cardboard:{name:"Cardboard Box",cat:"Paper / Cardboard",reuse:"Desk Organizer",value:"₹40 – ₹80",impact:"Saves paper resources",icon:"📦",steps:"Flatten the box → cut sections → reinforce → decorate and reuse."},
 newspaper:{name:"Newspaper",cat:"Paper Waste",reuse:"Seedling Pots / Gift Wrap",value:"₹20 – ₹40",impact:"Reduces paper waste",icon:"📰",steps:"Fold or roll sheets → form a small container → add soil for seedlings."},
 glass:{name:"Glass Bottle",cat:"Glass Waste",reuse:"Decorative Vase",value:"₹50 – ₹120",impact:"Avoids new glass production",icon:"🍾",steps:"Clean the bottle → remove labels → decorate → use as a vase."},
 cable:{name:"E-Waste Cable",cat:"E-Waste",reuse:"Parts Recovery / Repair",value:"₹20 – ₹100",impact:"Keeps electronics out of landfill",icon:"🔌",steps:"Do not burn or dismantle it casually → separate it → send to an authorised e-waste collector."}
};
const $=id=>document.getElementById(id);
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function showPage(page){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active-page"));$(page).classList.add("active-page");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));const t={home:"Turn waste into value.",scan:"Scan your waste.",history:"Your scan history.",tips:"Make greener choices.",about:"Built for a cleaner future."};$("pageTitle").textContent=t[page];if(page==="history")renderHistory();}
async function loadModel(){try{model=await mobilenet.load({version:2,alpha:1.0});$("modelStatus").textContent="● AI model ready";$("modelStatus").classList.remove("loading");}catch(e){$("modelStatus").textContent="● Offline / demo mode";console.error(e)}}
loadModel();

$("fileInput").addEventListener("change",e=>{const f=e.target.files[0];if(f)setImage(URL.createObjectURL(f));});
function setImage(url){currentImage=url;$("preview").src=url;$("preview").classList.add("show");$("previewEmpty").style.display="none";$("analyzeBtn").disabled=false;$("result").classList.add("hidden");}
$("dropzone").addEventListener("dragover",e=>{e.preventDefault();$("dropzone").style.background="#f1f8ed"});
$("dropzone").addEventListener("dragleave",()=>$("dropzone").style.background="");
$("dropzone").addEventListener("drop",e=>{e.preventDefault();$("dropzone").style.background="";const f=e.dataTransfer.files[0];if(f&&f.type.startsWith("image/"))setImage(URL.createObjectURL(f));});
function demoScan(){showPage("scan");setImage("data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400"><rect width="100%" height="100%" fill="#eef5eb"/><text x="50%" y="45%" text-anchor="middle" font-size="80">🧴</text><text x="50%" y="70%" text-anchor="middle" font-family="Arial" font-size="20" fill="#47604e">Plastic Bottle Demo</text></svg>`));lastAI={demo:true};}
async function analyze(){
 if(!currentImage)return;
 const r=$("result");r.classList.remove("hidden");r.innerHTML='<div style="padding:25px;text-align:center">🤖 <b>AI is analyzing the image…</b><p style="color:#789083;font-size:12px">Running computer vision in your browser.</p></div>';
 if(lastAI&&lastAI.demo){renderResult(wasteDB.bottle,[["plastic bottle",.94],["container",.72],["water bottle",.61]],true);return;}
 try{
   if(!model)model=await mobilenet.load({version:2,alpha:1.0});
   const img=$("preview"),pred=await model.classify(img,5);
   const mapped=mapPredictions(pred);
   renderResult(mapped.item,mapped.preds,false);
 }catch(e){r.innerHTML='<div style="padding:20px">AI could not analyze this image. Try a clearer image or use Demo Mode.</div>';console.error(e);}
}
function mapPredictions(pred){
 const text=pred.map(x=>x.className.toLowerCase()).join(" ");
 let item=wasteDB.cardboard;
 if(/water bottle|bottle|plastic/.test(text))item=wasteDB.bottle;
 else if(/can|tin/.test(text))item=wasteDB.can;
 else if(/carton|box|cardboard|packet/.test(text))item=wasteDB.cardboard;
 else if(/newspaper|paper/.test(text))item=wasteDB.newspaper;
 else if(/jar|glass|vase|bottle/.test(text))item=wasteDB.glass;
 else if(/cable|wire|plug|connector/.test(text))item=wasteDB.cable;
 return {item,preds:pred.map(x=>[x.className,x.probability])};
}
function renderResult(item,preds,demo){
 const top=Math.max(...preds.map(x=>x[1]));const confidence=Math.round(top*100);
 $("result").innerHTML=`<div class="result-head"><div style="font-size:65px">${item.icon}</div><div><div class="badge">${demo?"DEMO AI RESULT":"LIVE AI INFERENCE"}</div><h3>${item.name}</h3><div class="confidence">✓ ${confidence}% top-model confidence • ${demo?"demo mapping":"MobileNet prediction mapped to waste pathway"}</div></div></div>
 <div class="result-grid"><div class="metric"><small>CATEGORY</small><b>${item.cat}</b></div><div class="metric"><small>BEST REUSE IDEA</small><b>${item.reuse}</b></div><div class="metric"><small>ESTIMATED VALUE</small><b>${item.value}</b></div></div>
 <div class="metric" style="margin-top:12px"><small>🌱 ENVIRONMENTAL IMPACT</small><b>${item.impact}</b></div>
 <div class="metric" style="margin-top:12px"><small>🛠 HOW TO CREATE VALUE</small><b>${item.steps}</b></div>
 <details class="ai-list"><summary>View AI predictions</summary><div>${preds.map(p=>`<div><span>${p[0]}</span><b>${(p[1]*100).toFixed(1)}%</b></div>`).join("")}</div></details>
 <div style="margin-top:18px"><button class="primary" onclick='saveScan(${JSON.stringify(item)})'>Save to History ✓</button></div>`;
}
function saveScan(item){const h=JSON.parse(localStorage.getItem("wvs-history")||"[]");h.unshift({name:item.name,reuse:item.reuse,value:item.value,icon:item.icon,time:new Date().toLocaleString()});localStorage.setItem("wvs-history",JSON.stringify(h.slice(0,15)));renderHistory();alert("Saved to scan history!");}
function renderHistory(){const h=JSON.parse(localStorage.getItem("wvs-history")||"[]"),el=$("historyList");el.innerHTML=h.length?h.map(x=>`<div class="history-item"><div class="icon">${x.icon}</div><div><b>${x.name}</b><small>${x.reuse} • ${x.time}</small></div><div class="value">${x.value}</div></div>`).join(""):`<div class="upload-card" style="min-height:220px"><div class="upload-icon">◷</div><h3>No scans yet</h3><p>Your saved discoveries will appear here.</p><button class="primary" onclick="showPage('scan')">Scan something</button></div>`;}
function clearHistory(){localStorage.removeItem("wvs-history");renderHistory();}
renderHistory();