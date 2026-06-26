let map;
let userLat;
let userLon;
let restaurants = [];
let customLocation = false;
let recommendationMarker = null;

const greenIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greyIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const yellowIcon = L.icon({

    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize:[25,41],
    iconAnchor:[12,41],
    popupAnchor:[1,-34],
    shadowSize:[41,41]

});

const radius =
    document.getElementById("radius");

const radiusValue =
    document.getElementById("radiusValue");

radius.addEventListener(
    "input",
    () => {
        radiusValue.textContent =
            radius.value;
    }
);

document
    .getElementById("loadBtn")
    .addEventListener(
        "click",
        loadRestaurants
    );


document
    .getElementById(
        "searchLocationBtn"
    )
    .addEventListener(
        "click",
        setLocationFromInput
    );

document
    .getElementById(
        "useMyLocation"
    )
    .addEventListener(
        "click",
        () => {

            customLocation = false;

            loadRestaurants();

        }
    );

document
    .getElementById(
        "locationInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {
                setLocationFromInput();
            }

        }
    );
	
const cuisineMap = {

    italian: "Italienisch",
    greek: "Griechisch",
    kebab: "Döner",
    pizza: "Pizza",
    chinese: "Chinesisch",
    japanese: "Japanisch",
    sushi: "Sushi",
    thai: "Thai",
    turkish: "Türkisch",
    mexican: "Mexikanisch",
    indian: "Indisch",
    burger: "Burger",
    german: "Deutsch",
	ice_cream: "Eis",
	tea: "Tee",
	coffee_shop: "Kaffee",
	cake: "Kuchen",
	pastry: "Gebäck",
	syrian: "Syrisch",
	international: "Iternational",
	sandwich: "Sandwiches",
	seafood: "Meeresfrüchte",
	asian: "Asiatisch",
	vietnamese: "Vietnamesisch",
	salad: "Salat",
	chicken: "Huhn",
	regional: "Regional",
	fast_food: "Fastfood",
	schnitzel: "Schitzel",
	österreichisch: "Österreichisch",
	steak_house: "Steak",
	mediterranean: "Mediterran",
	traditional: "Traditional"

};

function normalizeCuisine(c=""){

    if(!c){
        return "Unbekannt";
    }

    return c
        .split(";")
        .map(item => {

            item = item.trim().toLowerCase();

            return cuisineMap[item] || item;

        })
        .join(", ");

}

function distanceKm(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(
            dLat / 2
        ) ** 2 +
        Math.cos(
            lat1 *
            Math.PI /
            180
        ) *
        Math.cos(
            lat2 *
            Math.PI /
            180
        ) *
        Math.sin(
            dLon / 2
        ) ** 2;

    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(
                1 - a
            )
        )
    );
}

function getSelectedCuisines() {

    const showAll =
        document.getElementById(
            "showAll"
        );

    if (
        showAll.checked
    ) {
        return null;
    }

    return [
        ...document.querySelectorAll(
            ".cuisineFilter:checked"
        )
    ].map(
        checkbox =>
            checkbox.value
    );
}

function getOpeningStatus(openingHoursString){

    if(
        !openingHoursString ||
        typeof opening_hours === "undefined"
    ){
        return {
            status: "unknown",
            text: "Keine Öffnungszeiten hinterlegt"
        };
    }

    try{

        const oh =
            new opening_hours(
                openingHoursString
            );

        const isOpen =
            oh.getState();

        const nextChange =
            oh.getNextChange();

        if(nextChange){

            const time =
                nextChange.toLocaleTimeString(
                    "de-DE",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            const now =
                new Date();

            const sameDay =
                now.toDateString() ===
                nextChange.toDateString();

            if(isOpen){

                return {
                    status: "open",
                    text: `Schließt um ${time}`
                };

            }

            if(sameDay){

                return {
                    status: "closed",
                    text: `Öffnet um ${time}`
                };

            }

            const weekday =
                nextChange.toLocaleDateString(
                    "de-DE",
                    {
                        weekday: "long"
                    }
                );

            return {
                status: "closed",
                text: `Öffnet ${weekday} um ${time}`
            };

        }

        return {
            status: isOpen
                ? "open"
                : "closed",

            text: isOpen
                ? "Geöffnet"
                : "Geschlossen"
        };

    }catch(error){

        console.error(error);

        return {
            status: "unknown",
            text: "Öffnungszeiten ungültig"
        };

    }

}

async function setLocationFromInput() {

    const place =
        document
        .getElementById(
            "locationInput"
        )
        .value
        .trim();

    if (!place) {
        return;
    }

    const url =
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;

    const response =
        await fetch(
            url
        );

    const data =
        await response.json();

    if (
        !data.length
    ) {

        alert(
            "Ort nicht gefunden"
        );

        return;
    }

    userLat =
        Number(
            data[0].lat
        );

    userLon =
        Number(
            data[0].lon
        );

    customLocation = true;
	
	localStorage.setItem(
    "savedLocation",
    JSON.stringify({
        name: place,
        lat: userLat,
        lon: userLon
    })
);

    startSearch();
}

async function loadRestaurants() {

    if (
        customLocation
    ) {

        startSearch();

        return;
    }

    navigator
        .geolocation
        .getCurrentPosition(
            position => {

                userLat =
                    position.coords.latitude;

                userLon =
                    position.coords.longitude;

                startSearch();

            }
        );
		

}
async function startSearch() {
	
	if(recommendationMarker){

    map?.removeLayer(
        recommendationMarker
    );

    recommendationMarker = null;
}
	
	document
    .getElementById("loading")
    .classList
    .remove("hidden");
	
	document
    .getElementById("loadBtn")
    .disabled = true;

const recommendBtn =
    document.getElementById(
        "recommendBtn"
    );

if(recommendBtn){
    recommendBtn.disabled = true;
}

    if (map) {
        map.remove();
    }

    map = L.map("map").setView(
        [userLat, userLon],
        13
    );

    L.tileLayer(
        "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
        {
            maxZoom: 18,
            attribution:
                "&copy; OpenStreetMap"
        }
    ).addTo(map);

    L.marker(
        [userLat, userLon]
    )
    .addTo(map)
    .bindPopup(
        customLocation
            ? "📍 Gewählter Ort"
            : "📍 Dein Standort"
    );

    const radiusMeters =
        Number(radius.value) * 1000;

    const query = `
[out:json];

(
node["amenity"~"restaurant|fast_food|cafe"]
(around:${radiusMeters},${userLat},${userLon});

way["amenity"~"restaurant|fast_food|cafe"]
(around:${radiusMeters},${userLat},${userLon});
);

out center tags;
`;

let response;

try {

    response =
        await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: query
            }
        );

    if(!response.ok){

        throw new Error(
            `Overpass Fehler ${response.status}`
        );

    }

} catch(error) {

    console.error(error);

    alert(
        "Restaurantdaten konnten nicht geladen werden."
    );
	
	document
    .getElementById("loading")
    .classList
    .add("hidden");
	
	document
    .getElementById("loadBtn")
    .disabled = false;

    return;
}

const data =
    await response.json();

    restaurants = [];

    for (const element of data.elements) {

        const lat =
            element.lat ||
            element.center?.lat;

        const lon =
            element.lon ||
            element.center?.lon;

        if (!lat || !lon) {
            continue;
        }

        const tags =
            element.tags || {};
			
		const address = [
    tags["addr:street"],
    tags["addr:housenumber"]
]
.filter(Boolean)
.join(" ");
			
		console.log(
    tags.name,
    tags["addr:street"],
    tags["addr:housenumber"]
);
			
			
		const name =
    tags.name ||
    "Unbekannt";
			
			const wikidata =
    tags.wikidata || null;
	
	if(
    tags.wikidata ||
    tags["brand:wikidata"]
){
    console.log(
        tags.name,
        tags.wikidata,
        tags["brand:wikidata"]
    );
}
			
			console.log(
    tags.name,
    tags.opening_hours
);
if(tags.opening_hours){
    console.log(
        "FOUND:",
        tags.name,
        tags.opening_hours
    );
}
console.log(
    name,
    tags.wikidata
);
console.log(tags);


        const cuisine =
            normalizeCuisine(
                tags.cuisine || ""
            );

        const distance =
            distanceKm(
                userLat,
                userLon,
                lat,
                lon
            );

        const opening =
            getOpeningStatus(
                tags.opening_hours
            );


        const mapsUrl =
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

        restaurants.push({

            name,
            cuisine,
			
			address,

            distance,

            status:
                opening.status,

            info:
                opening.text,


            mapsUrl,

            lat,
            lon

        });

        let markerIcon;

if(opening.status === "open"){

    markerIcon = greenIcon;

}
else if(opening.status === "closed"){

    markerIcon = redIcon;

}
else{

    markerIcon = greyIcon;

}

L.marker(
    [lat, lon],
    {
        icon: markerIcon
    }
)
.addTo(map)
.bindPopup(`
    <b>${name}</b>
    <br>
    ${cuisine}
    <br>
    ${distance.toFixed(1)} km
    <br>
    ${opening.text}
    <br><br>
    <a
        target="_blank"
        href="${mapsUrl}"
    >
        🧭 Route starten
    </a>
`);

    }
	
	

    renderRestaurants();

    recommendRestaurant();
	
	document
    .getElementById("loading")
    .classList
    .add("hidden");
	
	document
    .getElementById("loadBtn")
    .disabled = false;



}

function renderRestaurants() {

    const container =
        document.getElementById(
            "allList"
        );

    container.innerHTML = "";

    const selectedCuisines =
        getSelectedCuisines();

    const filteredRestaurants =
        restaurants.filter(
            restaurant => {

                const showAll =
                    document.getElementById(
                        "showAll"
                    ).checked;

                if(showAll){
                    return true;
                }

                if(
                    selectedCuisines.length === 0
                ){
                    return true;
                }

                return selectedCuisines.includes(
                    restaurant.cuisine
                );

            }
        );
		
		document.getElementById(
    "restaurantCount"
).textContent =
    restaurants.length;

    const statusOrder = {

        open: 0,

        unknown: 1,

        closed: 2

    };

    filteredRestaurants.sort(
        (a, b) => {

            if(
                statusOrder[a.status] !==
                statusOrder[b.status]
            ){

                return (
                    statusOrder[a.status] -
                    statusOrder[b.status]
                );

            }

            return (
                a.distance -
                b.distance
            );

        }
    );

    filteredRestaurants.forEach(
        restaurant => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "restaurant-card";

            card.innerHTML = `

                <div class="card-header">

                    <div class="restaurant-name">
                        ${restaurant.name}
                    </div>

                    <div class="restaurant-cuisine">
                        🍴 ${restaurant.cuisine}
                    </div>

                </div>

                <div class="restaurant-location">

                    ${
                        restaurant.address ||
                        "Adresse unbekannt"
                    }

                    •

                    ${restaurant.distance.toFixed(1)} km

                </div>

                <div class="restaurant-opening ${restaurant.status}">

                    ${restaurant.info}

                </div>

<div class="route-button">

    <a
        href="${restaurant.mapsUrl}"
        target="_blank"
        class="route-link"
    >

        <span class="route-text">
            🧭 Route starten
        </span>

        <span class="route-divider"></span>

        <span class="route-icon">

            <svg
                viewBox="0 0 66 43"
                width="20"
                height="20"
            >
                <path
                    fill="#222"
                    d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"
                />
            </svg>

        </span>

        <span class="route-arrow">

    <svg class="arrow one" viewBox="0 0 66 43">
        <path d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"/>
    </svg>

    <svg class="arrow two" viewBox="0 0 66 43">
        <path d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"/>
    </svg>

    <svg class="arrow three" viewBox="0 0 66 43">
        <path d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"/>
    </svg>

</span>

    </a>

</div>

            `;

            container.appendChild(
                card
            );

        }
    );

}

function recommendRestaurant() {

    const selected =
        getSelectedCuisines();

    const candidates =
        restaurants.filter(
            restaurant => {

                if (
                    restaurant.status === "closed"
                ) {
                    return false;
                }

                if (
                    selected === null
                ) {
                    return true;
                }

                return selected.includes(
                    restaurant.cuisine
                );

            }
        );

    const box =
        document.getElementById(
            "recommendation"
        );

    if (
        candidates.length === 0
    ) {

        box.innerHTML =
            "<h3>Keine passenden Restaurants gefunden.</h3>";

        return;

    }

    const restaurant =
        candidates[
            Math.floor(
                Math.random() *
                candidates.length
            )
        ];
		
	if(recommendationMarker){

    map.removeLayer(
        recommendationMarker
    );

}
recommendationMarker =
    L.marker(
        [
            restaurant.lat,
            restaurant.lon
        ],
        {
            icon: yellowIcon,
            zIndexOffset:1000
        }
    )
    .addTo(map)
    .bindPopup(`
        <b>⭐ Empfehlung</b>
        <br>
        ${restaurant.name}
    `);

recommendationMarker.openPopup();
	map.flyTo(
    [
        restaurant.lat,
        restaurant.lon
    ],
    15
);

    box.innerHTML = `
<div class="recommendation-header">

    <h2>⭐ Empfehlung</h2>

    <button
        id="recommendBtn"
        class="button-5"
    >
        🎲 Neu
    </button>

</div>


<div class="recommendation-body">

    <div class="recommendation-title">

    <div class="recommendation-name-row">

        <h3>${restaurant.name}</h3>

        <span class="recommendation-cuisine">
            🍴 ${restaurant.cuisine}
        </span>

    </div>

</div>

    <div class="recommendation-distance">
        ${restaurant.distance.toFixed(1)} km entfernt
    </div>

    <div class="recommendation-opening ${restaurant.status}">
        ${restaurant.info}
    </div>


<div class="route-button">

    <a
        href="${restaurant.mapsUrl}"
        target="_blank"
        class="route-link"
    >

        <span class="route-text">
            🧭 Route starten
        </span>

        <span class="route-divider"></span>

        <span class="route-icon">

            <svg
                viewBox="0 0 66 43"
                width="20"
                height="20"
            >
                <path
                    fill="#222"
                    d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"
                />
            </svg>

        </span>

        <span class="route-arrow">

    <svg class="arrow one" viewBox="0 0 66 43">
        <path d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"/>
    </svg>

    <svg class="arrow two" viewBox="0 0 66 43">
        <path d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"/>
    </svg>

    <svg class="arrow three" viewBox="0 0 66 43">
        <path d="M40 3 L63 21.5 L40 40 L40 28 L0 28 L0 15 L40 15 Z"/>
    </svg>

</span>

    </a>

</div>
</div>

`;
	
	document
    .getElementById("recommendBtn")
    ?.addEventListener(
        "click",
        recommendRestaurant
    );

}

function loadSavedLocation(){

    const saved =
        localStorage.getItem(
            "savedLocation"
        );

    if(!saved){
        return;
    }

    try{

        const location =
            JSON.parse(saved);

        userLat =
            location.lat;

        userLon =
            location.lon;

        customLocation =
            true;

        document.getElementById(
            "locationInput"
        ).value =
            location.name;

        startSearch();

    }catch(error){

        console.error(error);

    }

}

document
    .querySelectorAll(
        ".cuisineFilter"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                () => {

                    document
                        .getElementById(
                            "showAll"
                        )
                        .checked = false;

                    renderRestaurants();

                    recommendRestaurant();

                }
            );

        }
    );

document
    .getElementById(
        "showAll"
    )
    .addEventListener(
        "change",
        () => {

            renderRestaurants();

            recommendRestaurant();

        }
    );

document
    .getElementById(
        "hideClosed"
    )
    .addEventListener(
        "change",
        () => {

            renderRestaurants();

            recommendRestaurant();

        }
    );
window.addEventListener(
    "load",
    loadSavedLocation
);

const particles =
    document.getElementById(
        "particles"
    );

for(let i = 0; i < 30; i++){

    const particle =
        document.createElement(
            "div"
        );

    particle.className =
        "particle";

    particle.style.position =
        "absolute";

    particle.style.left =
        Math.random() * 100 + "%";

    particle.style.top =
        Math.random() * 100 + "%";

    particle.style.animation =
        `floatParticle ${
            15 + Math.random() * 20
        }s linear infinite`;

    particles.appendChild(
        particle
    );

}