const radius=document.getElementById('radius');
const radiusValue=document.getElementById('radiusValue');
const openList=document.getElementById('openList');
const unknownList=document.getElementById('unknownList');
const recommendation=document.getElementById('recommendation');

let currentOpen=[];

radius.addEventListener('input',()=>radiusValue.textContent=radius.value);

document.getElementById('loadBtn').addEventListener('click',loadRestaurants);
document.getElementById('recommendBtn').addEventListener('click',recommend);

async function loadRestaurants(){
 if(!navigator.geolocation){
   alert('Geolocation nicht verfügbar');
   return;
 }

 navigator.geolocation.getCurrentPosition(async(pos)=>{
   const lat=pos.coords.latitude;
   const lon=pos.coords.longitude;
   const r=Number(radius.value)*1000;

   const query=`
   [out:json];
   (
     node["amenity"="restaurant"](around:${r},${lat},${lon});
     way["amenity"="restaurant"](around:${r},${lat},${lon});
   );
   out tags center;
   `;

   const res=await fetch("https://overpass-api.de/api/interpreter",{
     method:"POST",
     body:query
   });

   const data=await res.json();

   openList.innerHTML='';
   unknownList.innerHTML='';
   currentOpen=[];

   data.elements.forEach(el=>{
      const tags=el.tags||{};
      const name=tags.name || "Unbekanntes Restaurant";

      if(tags.opening_hours){
          currentOpen.push(name);
          const li=document.createElement('li');
          li.textContent=name;
          openList.appendChild(li);
      } else {
          const li=document.createElement('li');
          li.textContent=name;
          unknownList.appendChild(li);
      }
   });

   recommend();
 });
}

function recommend(){
 if(currentOpen.length===0){
   recommendation.textContent='Noch keine geöffneten Restaurants geladen.';
   return;
 }

 const choice=currentOpen[Math.floor(Math.random()*currentOpen.length)];
 recommendation.textContent='⭐ Empfehlung: ' + choice;
}
