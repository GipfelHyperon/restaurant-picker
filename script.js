let map;
let userLat;
let userLon;
let restaurants = [];
let customLocation = false;

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
    .getElementById("recommendBtn")
    .addEventListener(
        "click",
        recommendRestaurant
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

function normalizeCuisine(
    cuisine = ""
) {

    cuisine =
        cuisine.toLowerCase();

    if (
        cuisine.includes(
            "italian"
        ) ||
        cuisine.includes(
            "pizza"
        )
    ) {
        return "Italienisch";
    }

    if (
        cuisine.includes(
            "greek"
        )
    ) {
        return "Griechisch";
    }

    if (
        cuisine.includes(
            "asian"
        ) ||
        cuisine.includes(
            "chinese"
        ) ||
        cuisine.includes(
            "thai"
        ) ||
        cuisine.includes(
            "japanese"
        ) ||
        cuisine.includes(
            "sushi"
        )
    ) {
        return "Asiatisch";
    }

    if (
        cuisine.includes(
            "burger"
        )
    ) {
        return "Burger";
    }

    if (
        cuisine.includes(
            "german"
        ) ||
        cuisine.includes(
            "regional"
        )
    ) {
        return "Deutsch";
    }

    return "Sonstige";
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

function getOpeningStatus(
    openingHours
) {

    if (
        !openingHours
    ) {

        return {
            status:
                "unknown",
            text:
                "⚪ Keine Öffnungszeiten hinterlegt"
        };

    }

    try {

        const oh =
            new opening_hours(
                openingHours
            );

        const isOpen =
            oh.getState();

        if (
            isOpen
        ) {

            return {
                status:
                    "open",
                text:
                    "🟢 Jetzt geöffnet"
            };

        }

        return {
            status:
                "closed",
            text:
                "🔴 Aktuell geschlossen"
        };

    } catch {

        return {
            status:
                "unknown",
            text:
                "⚪ Keine Öffnungszeiten hinterlegt"
        };

    }

}

async function getRestaurantImage(tags){

    if(tags.image){
        return tags.image;
    }

    const wikidata =
        tags.wikidata ||
        tags["brand:wikidata"];

    if(!wikidata){
        return null;
    }

    try{

        const response =
            await fetch(
                `https://www.wikidata.org/wiki/Special:EntityData/${wikidata}.json`
            );

        const data =
            await response.json();

        const entity =
            data.entities[wikidata];

        if(
            !entity?.claims?.P18
        ){
            return null;
        }

        const imageName =
            entity.claims.P18[0]
            .mainsnak
            .datavalue
            .value;

        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}`;

    }catch(error){

        console.error(error);

        return null;

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
		
	localStorage.setItem(
    "savedLocation",
    JSON.stringify({
        name: locationInput.value,
        lat: userLat,
        lon: userLon
    })
);

}
async function startSearch() {

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

        const image =
            await getRestaurantImage(
                tags
            );

        const mapsUrl =
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

        restaurants.push({

            name,
            cuisine,

            distance,

            status:
                opening.status,

            info:
                opening.text,

            image,

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

}

function renderRestaurants() {

    const container =
        document.getElementById(
            "allList"
        );

    container.innerHTML = "";

    const selectedCuisines =
        getSelectedCuisines();

    restaurants
        .filter(restaurant => {

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

        })
        .sort(
            (a,b) =>
                a.distance - b.distance
        )
        .forEach(restaurant => {

            let statusBadge = "";

            if(
                restaurant.status ===
                "open"
            ){

                statusBadge = `
                    <span class="status open">
                        🟢 Offen
                    </span>
                `;

            }
            else if(
                restaurant.status ===
                "closed"
            ){

                statusBadge = `
                    <span class="status closed">
                        🔴 Geschlossen
                    </span>
                `;

            }
            else{

                statusBadge = `
                    <span class="status unknown">
                        ⚪ Unbekannt
                    </span>
                `;

            }

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

        📍 ${
            restaurant.address ||
            "Adresse unbekannt"
        }

        •

        ${restaurant.distance.toFixed(1)} km

    </div>

    <div class="restaurant-opening">

        ${restaurant.info}

    </div>

    <a
        class="route-button"
        target="_blank"
        href="${restaurant.mapsUrl}"
    >
        🧭 Route starten
    </a>

`;

            container.appendChild(
                card
            );

        });

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

    box.innerHTML = `

        <h3>
            ⭐ Empfehlung
        </h3>

        <b>
            ${restaurant.name}
        </b>

        <br>

        🍽️
        ${restaurant.cuisine}

        <br>

        📍
        ${restaurant.distance.toFixed(1)} km

        <br>

        ${restaurant.info}

        <br><br>

        <a
            class="route-button"
            href="${restaurant.mapsUrl}"
            target="_blank"
        >
            🧭 Route starten
        </a>

    `;

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