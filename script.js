let map;
let userLat;
let userLon;
let restaurants = [];

let customLocation = false;

const radius = document.getElementById("radius");
const radiusValue = document.getElementById("radiusValue");

radius.addEventListener("input", () => {
    radiusValue.textContent = radius.value;
});

document
    .getElementById("loadBtn")
    .addEventListener("click", loadRestaurants);

document
    .getElementById("recommendBtn")
    .addEventListener("click", recommendRestaurant);

function normalizeCuisine(cuisine = "") {

    cuisine = cuisine.toLowerCase();

    if (
        cuisine.includes("italian") ||
        cuisine.includes("pizza")
    ) {
        return "Italienisch";
    }

    if (
        cuisine.includes("greek")
    ) {
        return "Griechisch";
    }

    if (
        cuisine.includes("asian") ||
        cuisine.includes("chinese") ||
        cuisine.includes("japanese") ||
        cuisine.includes("sushi") ||
        cuisine.includes("thai")
    ) {
        return "Asiatisch";
    }

    if (
        cuisine.includes("burger")
    ) {
        return "Burger";
    }

    if (
        cuisine.includes("german") ||
        cuisine.includes("regional")
    ) {
        return "Deutsch";
    }

    return "Sonstige";
}

async function setLocationFromInput(){

    const place =
        document
        .getElementById(
            "locationInput"
        )
        .value
        .trim();

    if(!place){
        return;
    }

    const url =
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;

    const response =
        await fetch(url);

    const data =
        await response.json();

    if(!data.length){

        alert(
            "Ort nicht gefunden"
        );

        return;
    }

    userLat =
        Number(data[0].lat);

    userLon =
        Number(data[0].lon);

    customLocation = true;

    loadRestaurants();
}

function distanceKm(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
}

function getSelectedCuisines() {

    const showAll =
        document.getElementById(
            "showAll"
        );

    if (showAll.checked) {
        return null;
    }

    return [
        ...document.querySelectorAll(
            ".cuisineFilter:checked"
        )
    ].map(
        checkbox => checkbox.value
    );
}

async function loadRestaurants(){

    if(!customLocation){

        navigator.geolocation.getCurrentPosition(
            position => {

                userLat =
                    position.coords.latitude;

                userLon =
                    position.coords.longitude;

                startSearch();

            }
        );

    }else{

        startSearch();

    }

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
            attribution: "&copy; OpenStreetMap"
        }
    ).addTo(map);

    L.marker([userLat, userLon])
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

            const response =
                await fetch(
                    "https://overpass-api.de/api/interpreter",
                    {
                        method: "POST",
                        body: query
                    }
                );

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

                const info =
                    tags.opening_hours
                    ? "Öffnungszeiten vorhanden"
                    : "Keine Öffnungszeiten hinterlegt";

                const mapsUrl =
                    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

                restaurants.push({
                    name,
                    cuisine,
                    distance,
                    info,
                    mapsUrl,
                    lat,
                    lon
                });

                L.marker([lat, lon])
                    .addTo(map)
                    .bindPopup(`
                        <b>${name}</b><br>
                        ${cuisine}<br>
                        ${distance.toFixed(1)} km<br>
                        ${info}<br><br>
                        <a
                           href="${mapsUrl}"
                           target="_blank">
                           🧭 Route starten
                        </a>
                    `);
            }

            renderRestaurants();

            recommendRestaurant();

}

function renderRestaurants() {

    const list =
        document.getElementById(
            "allList"
        );

    list.innerHTML = "";

    const selected =
        getSelectedCuisines();

    restaurants
        .filter(restaurant => {

            if (
                selected === null
            ) {
                return true;
            }

            return selected.includes(
                restaurant.cuisine
            );
        })
        .sort(
            (a, b) =>
                a.distance -
                b.distance
        )
        .forEach(restaurant => {

            const card =
    document.createElement("div");

card.className =
    "restaurant-card";

card.innerHTML = `
    <div class="restaurant-name">
        ${restaurant.name}
    </div>

    <div class="restaurant-info">
        🍽️ ${restaurant.cuisine}
    </div>

    <div class="restaurant-info">
        📍 ${restaurant.distance.toFixed(1)} km
    </div>

    <div class="restaurant-info">
        🕒 ${restaurant.info}
    </div>

    <a
        class="route-button"
        href="${restaurant.mapsUrl}"
        target="_blank"
    >
        🧭 Route
    </a>
`;

list.appendChild(card);
        });
}

function recommendRestaurant() {

    const selected =
        getSelectedCuisines();

    const candidates =
        restaurants.filter(
            restaurant => {

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

    const recommendationBox =
        document.getElementById(
            "recommendation"
        );

    if (
        candidates.length === 0
    ) {

        recommendationBox.innerHTML =
            "Keine Restaurants gefunden.";

        return;
    }

    const recommendation =
        candidates[
            Math.floor(
                Math.random() *
                candidates.length
            )
        ];

    recommendationBox.innerHTML = `
        <h3>⭐ Empfehlung</h3>

        <b>${recommendation.name}</b>
        <br>

        🍽️ ${recommendation.cuisine}
        <br>

        📍 ${recommendation.distance.toFixed(1)} km
        <br>

        🕒 ${recommendation.info}
        <br><br>

        <a
          href="${recommendation.mapsUrl}"
          target="_blank">
          🧭 Route starten
        </a>
    `;
}

document
    .querySelectorAll(
        ".cuisineFilter"
    )
    .forEach(checkbox => {

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
    });

document
    .getElementById("showAll")
    .addEventListener(
        "change",
        () => {

            renderRestaurants();

            recommendRestaurant();
        }
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
    .getElementById("searchLocationBtn")
    .addEventListener(
        "click",
        setLocationFromInput
    );
	
	document
    .getElementById("locationInput")
    .addEventListener(
        "keydown",
        event => {

            if(event.key === "Enter"){
                setLocationFromInput();
            }

        }
    );