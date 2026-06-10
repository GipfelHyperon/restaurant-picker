
let map, userLat, userLon, restaurants=[];

const radius=document.getElementById("radius");
const radiusValue=document.getElementById("radiusValue");
radius.oninput=()=>radiusValue.textContent=radius.value;

function normalizeCuisine(c=""){
 c=c.toLowerCase();
 if(c.includes("italian")||c.includes("pizza")) return "Italienisch";
 if(c.includes("greek")) return "Griechisch";
 if(c.includes("asian")) return "Asiatisch";
 if(c.includes("burger")) return "Burger";
 if(c.includes("german")||c.includes("regional")) return "Deutsch";
 return "Sonstige";
}

function distanceKm(a,b,c,d){
 const R=6371;
 const dLat=(c-a)*Math.PI/180,dLon=(d-b)*Math.PI/180;
 const x=Math.sin(dLat/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLon/2)**2;
 return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function openingInfo(str){
 try{
  const oh=new opening_hours(str);
  const open=oh.getState();
  const next=oh.getNextChange();
  return {open,next};
 }catch{return null;}
}

document.getElementById("loadBtn").onclick=loadRestaurants;
document.getElementById("recommendBtn").onclick=recommend;

async function loadRestaurants(){
 navigator.geolocation.getCurrentPosition(async pos=>{
  userLat=pos.coords.latitude; userLon=pos.coords.longitude;

  if(map) map.remove();
  map=L.map("map").setView([userLat,userLon],13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  L.marker([userLat,userLon]).addTo(map).bindPopup("Dein Standort");

  const r=radius.value*1000;
  const query=`[out:json];(node["amenity"="restaurant"](around:${r},${userLat},${userLon});way["amenity"="restaurant"](around:${r},${userLat},${userLon}););out center tags;`;

  const res=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:query});
  const data=await res.json();

  restaurants=[];

  for(const el of data.elements){
   const lat=el.lat||el.center?.lat;
   const lon=el.lon||el.center?.lon;
   if(!lat||!lon) continue;

   const tags=el.tags||{};
   const name=tags.name||"Unbekannt";
   const cuisine=normalizeCuisine(tags.cuisine||"");
   const dist=distanceKm(userLat,userLon,lat,lon);

   let status="unknown", timeText="Öffnungszeiten unbekannt";
   if(tags.opening_hours){
     const info=openingInfo(tags.opening_hours);
     if(info){
       status=info.open?"open":"closed";
       if(info.next){
        const t=info.next.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
        timeText=info.open?`Schließt um ${t}`:`Öffnet um ${t}`;
       }
     }
   }

   const maps=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

   restaurants.push({name,cuisine,dist,status,timeText,maps,lat,lon});

   L.marker([lat,lon]).addTo(map).bindPopup(
    `<b>${name}</b><br>${cuisine}<br>${dist.toFixed(1)} km<br>${timeText}<br><a target="_blank" href="${maps}">🧭 Route starten</a>`
   );
  }

  render();
  recommend();
 });
}

function render(){
 const filter=document.getElementById("cuisine").value;
 openList.innerHTML=""; unknownList.innerHTML="";

 restaurants.filter(r=>!filter||r.cuisine===filter).forEach(r=>{
   const li=document.createElement("li");
   li.innerHTML=`<b>${r.name}</b> (${r.cuisine}) - ${r.dist.toFixed(1)} km - ${r.timeText} - <a target="_blank" href="${r.maps}">Route</a>`;
   if(r.status==="open") openList.appendChild(li);
   else if(r.status==="unknown") unknownList.appendChild(li);
 });
}

document.getElementById("cuisine").onchange=render;

function recommend(){
 const filter=document.getElementById("cuisine").value;
 const open=restaurants.filter(r=>r.status==="open" && (!filter||r.cuisine===filter));
 const box=document.getElementById("recommendation");
 if(!open.length){ box.innerHTML="Keine offenen Restaurants gefunden."; return; }
 const r=open[Math.floor(Math.random()*open.length)];
 box.innerHTML=`<h3>⭐ Empfehlung</h3><b>${r.name}</b><br>${r.cuisine}<br>${r.dist.toFixed(1)} km<br>${r.timeText}<br><a target="_blank" href="${r.maps}">🧭 Route starten</a>`;
}
