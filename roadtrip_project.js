function ster_leeg(n) {
  n = parseInt(n);
  return (
    '<i class="fa-solid fa-star"></i>'.repeat(n) +
    '<i class="fa-regular fa-star"></i>'.repeat(5 - n)
  );
}

$(document).ready(function () {
  $.ajax({
    url: "flask/review_get.py/review_get",
    type: "GET",
    dataType: "json",
    success: function (response) {
      console.log(response);

      let recensies = "";

      if (!response || !response.reviews || response.reviews.length === 0) {
        $("#reviews").html("<p>Geen recensies gevonden.</p>");
        return;
      }

      $.each(response.reviews, function (index, review) {
        recensies += `
        <div class="review">
          <p><b>Gebruiker: </b>${review.gebruiker}</p>
          <p><b>Beoordeling: </b><span class="ster">${ster_leeg(
            review.beoordeling
          )}</span></p>
          <p><b>Route: </b>${review.route}</p>
          <p>${review.beschrijving}</p>
        </div>
      `;
      });
      // pas hier reviews zetten want we willen de hele lijst
      $("#reviews").html(recensies);
    },
    error: function (xhr, status, error) {
      console.error("Fout bij ophalen van recensies:", error);
      $("#reviews").html("<p>Kan recensies niet ophalen.</p>");
    },
  });
});

window.onload = $("#auto_show").hide();
window.onload = $("#map_info_box").hide();
window.onload = $("#lat").hide();
window.onload = $("#lon").hide();

let steden_list = [
  "Porto",
  "Cascais",
  "Marbella",
  "Sevilla",
  "Zaragoza",
  "Barcelona",
  "Vigo",
  "San Sebastian",
  "Albufeira",
  "Santiago de Compostella",
];

function vul_in(category) {
  if (steden_list.includes($("#stad_1").val())) {
    $("#stad_2").val(category);
  } else {
    $("#stad_1").val(category);
  }
}

function auto_foto(value) {
  let dict = {
    "Mercedes-Benz V-Klasse Avantgarde": "mbv.jpg",
    "Volkswagen California": "vwc.jpeg",
    "Volkswagen ABT Camper": "vwabt.jpg",
    "Audi RS6": "ars6.jpg",
    "Ford Shelby Cobra": "fs.jpg",
    "Mercedes-Benz SLS AMG": "mbsls.jpg",
    "Audi RS5": "ars5.jpg",
    "Audi RS3 Sportback": "ars3.jpg",
    "Honda S2000": "hs2000",
    "Porsche  Speedster": "ps.jpg",
    "Rolls Royce  Black Badge Wraith": "rlb.jpg",
    "Nissan  Datsun Fairlady Z": "nd.jpg",
    "Jeep SRT SRT Grand Cherokee": "jgc.jpg",
    "Alfa Romeo  156 GTA": "ar156.jpg",
    "BMW M3": "bmwm3.jpg",
    "Ferrari 430 Scuderia": "f430.jpeg",
    "Hennesey  Venom GT": "hven.jpg",
    "Dodge Charger Hellcat": "dcharg.jpg",
    "Mercedes-Benz C63 Coupe Black Series": "mbblack.jpg",
    "BMW M3 Touring Competition": "bmwm3t.jpg",
    "Toyota Supra GR": "tsup.jpg",
    "Renault Megane RS Trophy": "rmt.jpg",
    "Alfa Romeo  Guila Quadrifoglio": "argq.jpg",
    "Audi RSQ8": "arsq8.jpg",
    "Dodge Challenger Hellcat": "dchallh.jpg",
    "Lamborghini  Gallardo Spyder LP570": "lgall.jpg",
    "Dodge Challenger SRT8": "dchallsrt.jpg",
    "Ford F150 Raptor": "ff150.jpeg",
    "Porsche  Boxter GTS": "pbox.jpg",
    "Mercedes-Benz G63": "mbg.jpg",
    "Bugatti  Veyron Grand Sport Vitesse": "bvey.jpg",
    "Volvo S60 B4 R": "vs60.jpg",
    "Lamborghini  Aventador LP750 ": "lav.jpg",
  };

  return dict[value];
}

function type_omzetting(type) {
  let dict = {
    Sedan: "sedan",
    Break: "break",
    "Pick-up": "pickup",
    Hatchback: "hatchback",
    Cabrio: "cabrio",
    Roadster: "roadster",
    Sport: "sport",
    Van: "van",
    SUV: "suv",
    Coupé: "coupe",
  };
  return dict[type];
}

function auto(waggie) {
  $("#auto_eind").html(waggie);
  let car = $("#auto_eind").html();
  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/opvragen_geld",
    type: "GET",
    dataType: "json",
    data: { auto_naam: car },
    success: function (response) {
      console.log(car);
      $("#huurprijs").html(response.categorie[0].huurprijs);
    },
  });

  let foto = `
    <img src="auto_fotos/${auto_foto(car)}" style="height:400px">
`;
  $("#auto_show").html(foto);
  $("#auto_show").show();
}

function auto_opvraging() {
  let typeAuto = type_omzetting($("#type_auto").val());

  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/opvragen_autos",
    type: "GET",
    dataType: "json",
    data: { type_a: typeAuto },
    success: function (response) {
      console.log("Ontvangen auto's:", response);
      let namen = "";
      $.each(response.autos, function (index, auto) {
        namen += `
                <a class="panel-block" onclick="auto('${auto.naam}')">${auto.naam}</a>`;
      });
      $("#autos").html(namen);
    },
  });

  let foto = `
      <img src="auto_icons/${type_omzetting(
        $("#type_auto").val()
      )}.png" class="auto_icons">
  `;
  $("#type_foto").html(foto);

  $("#gekozen_type").html($("#type_auto").val());
}

//map_view is de eerste kaart

let map = L.map("map_view", {
  minZoom: 5,
  maxZoom: 11,
  maxBounds: [
    [32.04, -35.89],
    [48.85, 29.19],
  ],
  maxBoundsViscosity: 1.0,
}).setView([40.67, -3.71], 5);

let bounds = L.latLngBounds(L.latLng(32.04, -35.89), L.latLng(48.85, 29.19));

osm_achtergrond1 = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  {
    zIndex: 1,
    bounds: bounds,
    minZoom: 9,
    maxZoom: 11,
  }
).addTo(map);

achtergrond1 = L.tileLayer(
  "https://we12s016.ugent.be/student/student_lefrerik/tiles/{z}/{x}/{y}.png",
  {
    zIndex: 2,
  }
).addTo(map);

// dit is de tweede kaart
let map2 = L.map("map_add", {
  minZoom: 5,
  maxZoom: 11,
  maxBounds: [
    [32.04, -35.89],
    [48.85, 29.19],
  ],
  maxBoundsViscosity: 1.0,
}).setView([40.67, -3.71], 5);

osm_achtergrond2 = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  {
    zIndex: 1,
    bounds: bounds,
    minZoom: 9,
    maxZoom: 11,
  }
).addTo(map2);

achtergrond2 = L.tileLayer(
  "https://we12s016.ugent.be/student/student_lefrerik/tiles/{z}/{x}/{y}.png",
  {
    zIndex: 2,
  }
).addTo(map2);

steden = L.tileLayer
  .wms("https://we12s016.ugent.be/8080/geoserver/gia2025/wms", {
    layers: "lefrerik_stedenroadtrips",
    format: "image/png",
    transparent: true,
  })
  .addTo(map)
  .bringToFront();

steden2 = L.tileLayer
  .wms("https://we12s016.ugent.be/8080/geoserver/gia2025/wms", {
    layers: "lefrerik_stedenroadtrips",
    format: "image/png",
    transparent: true,
  })
  .addTo(map2)
  .bringToFront();

map2.on("click", function (e) {
  console.log(e.latlng.lat);
  console.log(e.latlng.lng);
  $("#lat").html(e.latlng.lat);
  $("#lon").html(e.latlng.lng);
});

let markersLayer = L.layerGroup().addTo(map2);

function plaats_marker(lat, lon, name) {
  markersLayer.clearLayers();
  console.log("Marker plaatsen op:", lat, lon, "met naam:", name);
  let marker = L.circleMarker([lat, lon], {
    radius: 7,
    color: "white",
    fillColor: "black",
    fillOpacity: 0.6,
    weight: 2,
  }).addTo(markersLayer);

  marker.bindTooltip(name, {
    // alleen tonen bij hover
    permanent: false,
    direction: "top",
    offset: [0, -5],
  });
}

map2.on("click", function (e) {
  let naam_poi = $("#toevoegen_naam_poi").val();
  console.log("Marker wordt toegevoegd met naam:", naam_poi);

  //functie loggen
  console.log("plaats_marker functie:", plaats_marker);

  plaats_marker(e.latlng.lat, e.latlng.lng, naam_poi);
});

function toevoegen_poi() {
  if (!$("#lat").html() || !$("#lon").html()) {
    alert("Je moet een POI aanduiden op de kaart!");
  } else if (!$("#toevoegen_naam_poi").val()) {
    alert("Je moet je POI een naam geven!");
  } else {
    $.ajax({
      url: "https://we12s016.ugent.be/flask/student_lefrerik/poi_toevoegen",
      type: "POST",
      data: {
        naam: $("#toevoegen_naam_poi").val(),
        naam_route: $("#route_rev_naam").val(),
        categorie: $("#poi_class").val(),
        lat: $("#lat").html(),
        lng: $("#lon").html(),
      },
      dataType: "json",
      success: function (response) {
        console.log(response);
        console.log($("#lat").html());
        console.log($("#lon").html());
        html = `
                      <div class="notification is-primary" style="background-color:#f2be22; color:white; font-weight:bold">
                      ${response.message}
                      </article>
                  `;
        $("#bericht_toevoegen").html(html);
      },
    });
  }
}

function rate(stars) {
  document.getElementById("rev_ster").value = stars;

  let sterelements = document.querySelectorAll("#starRating span i");
  for (let i = 0; i < sterelements.length; i++) {
    //stel 3 sterren => 0, 1 en 2 zijn kleiner => fa-solid toegevoegd
    //3 en 4 => niet kleiner, lege worden toegevoegd
    if (i < stars) {
      sterelements[i].classList.remove("fa-regular", "fa-star");
      sterelements[i].classList.add("fa-solid", "fa-star");
    } else {
      sterelements[i].classList.remove("fa-solid", "fa-star");
      sterelements[i].classList.add("fa-regular", "fa-star");
    }
  }
}

function complete_1() {
  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/auto_compl",
    type: "GET",
    data: {
      search: $("#stad_1").val(),
    },
    dataType: "json",
    success: function (response) {
      console.log(response);
      html = "";
      $.each(response.steden, function (index, stad) {
        html =
          html +
          `<span class="tag is-primary is-clickable" onclick="vul_in('${stad.name}')" style="color: white">${stad.name}</span>`;
      });
      $("#autocomplete_tags").html(html);
    },
  });
}

function complete_2() {
  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/auto_compl",
    type: "GET",
    data: {
      search: $("#stad_2").val(),
    },
    dataType: "json",
    success: function (response) {
      console.log(response);
      html = "";
      $.each(response.steden, function (index, stad) {
        html =
          html +
          `<span class="tag is-primary is-clickable" onclick="vul_in('${stad.name}')" style="color: white">${stad.name}</span>`;
      });
      $("#autocomplete_tags").html(html);
    },
  });
}

// stijl routes test
let stijl_routes = {
  color: "#3878c7",
  weight: 4,
  fillColor: "#3878c7",
  lineCap: "round",
  lineJoin: "round",
};

let geselecteerdeRoute = null; // voor kaart 1
let geselecteerdeRoute2 = null; // voor kaart 2

function getroutes() {
  if (typeof routes !== "undefined" && map.hasLayer(routes)) {
    map.removeLayer(routes);
  }

  let stad_1 = $("#stad_1").val();
  let stad_2 = $("#stad_2").val();

  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/get_routes",
    data: { stad1: stad_1, stad2: stad_2 },
    dataType: "json",
    success: function (geojson_data) {
      routes = L.geoJSON(geojson_data, {
        style: stijl_routes,
        onEachFeature: inforoute,
      }).addTo(map);
      map.fitBounds(routes.getBounds());
    },
  });
}

function toonPOIsInInfoBox(routeNaam, geojsonData) {
  $("#map_info_box").show();
  const gegroepeerd = {};

  geojsonData.features.forEach((feature) => {
    const cat = feature.properties.fclass;
    if (!gegroepeerd[cat]) gegroepeerd[cat] = [];
    gegroepeerd[cat].push(feature.properties.name || "Naamloos");
  });

  let innerHTML = `
  <h3>Info: </h3>
  <span class="text">${routeNaam}</span>
  <p>Dit kan je tegenkomen:</p>
`;

  for (const [fclass, namen] of Object.entries(gegroepeerd)) {
    const html = `
    <details>
      <summary class="fclass" data-fclass="${fclass}">${fclass} (${
      namen.length
    })</summary>
      <ul>
        ${namen.map((naam) => `<li>${naam}</li>`).join("")}
      </ul>
    </details>
  `;
    innerHTML += html;
    $("#map_info_box").html(innerHTML);
  }
}

function laadPOIsVoorRoute(routeNaam) {
  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/get_pois",
    type: "GET",
    dataType: "json",
    data: { name_route: routeNaam },
    success: function (data) {
      if (typeof pois !== "undefined" && map.hasLayer(pois)) {
        map.removeLayer(pois);
      }

      pois = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
          const naam = feature.properties.name || "Onbekend POI";
          layer.bindPopup(
            `<strong>${naam}</strong><br>${feature.properties.fclass}`
          );
        },
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 5,
            color: "white",
            fillColor: "#1c3a4d",
            fillOpacity: 0.8,
          });
        },
      }).addTo(map);

      toonPOIsInInfoBox(routeNaam, data);
      $(document).on("click", ".fclass", function (e) {
        e.preventDefault(); // voorkomt standaard gedrag

        const geselecteerdeFclass = $(this).data("fclass");
        const parentDetail = $(this).parent();

        //alle details dichtklappen behalve de aangeklikte
        $("details").not(parentDetail).removeAttr("open");

        parentDetail.attr("open", true);

        //highlight alleen de juiste POIs op de kaart
        pois.eachLayer(function (layer) {
          if (
            layer.feature &&
            layer.feature.properties.fclass === geselecteerdeFclass
          ) {
            layer.setStyle({
              radius: 8,
              color: "white",
              fillColor: "#60b8f0",
              fillOpacity: 1,
            });
          } else {
            layer.setStyle({
              radius: 5,
              color: "white",
              fillColor: "#1c3a4d",
              fillOpacity: 0.8,
            });
          }
        });
      });
    },
  });
}

function inforoute(feature, layer) {
  layer.on("click", function (e) {
    if (geselecteerdeRoute) {
      geselecteerdeRoute.setStyle(stijl_routes);
    }

    layer.setStyle({
      color: "#0e5952",
      weight: 4,
      lineCap: "round",
      lineJoin: "round",
    });

    geselecteerdeRoute = layer;

    let info = `
    <strong>${feature.properties.name}</strong><br>
    Duur: ${feature.properties.duur}<br>
    Beste auto: ${feature.properties.auto}
  `;
    layer.bindPopup(info).openPopup();
    $("#gekozen_route").html(feature.properties.name);

    laadPOIsVoorRoute(feature.properties.name);
  });
}

function inforoute2(feature, layer) {
  layer.on("click", function (e) {
    console.log(feature.properties.name);

    if (geselecteerdeRoute2) {
      geselecteerdeRoute2.setStyle(stijl_routes);
    }

    layer.setStyle({
      color: "#0e5952",
      weight: 4,
      lineCap: "round",
      lineJoin: "round",
    });

    geselecteerdeRoute2 = layer;

    let info = `
    <strong>${feature.properties.name}</strong><br>
    Duur: ${feature.properties.duur}<br>
    Beste auto: ${feature.properties.auto}
  `;
    layer.bindPopup(info).openPopup();
  });
}

function route_review() {
  if (typeof routes2 !== "undefined" && map2.hasLayer(routes2)) {
    map2.removeLayer(routes2);
  }

  let route_name = $("#route_rev_naam").val();
  $("#route_rev_box").html(route_name);

  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/get_route_name",
    data: { name_route: route_name },
    dataType: "json",
    success: function (geojson_data) {
      routes2 = L.geoJSON(geojson_data, {
        style: stijl_routes,
        onEachFeature: inforoute2,
      }).addTo(map2);
      map2.fitBounds(routes2.getBounds()); // correcte fitBounds
    },
  });
}

function toevoegen_rev() {
  let naam = $("#rev_naam").val();
  let voornaam = $("#rev_voornaam").val();
  let route = $("#route_rev_box").html();
  let ster = $("#rev_ster").val();
  let beschrijving = $("#rev_bes").val();
  console.log(route);
  $.ajax({
    url: "https://we12s016.ugent.be/flask/student_lefrerik/review_toevoegen",
    type: "POST",
    dataType: "json",
    data: {
      naam: naam,
      voornaam: voornaam,
      route: route,
      ster: ster,
      beschrijving: beschrijving,
    },
    success: function (response) {
      console.log(response.message);
      alert("Je recensie succesvol opgeslagen, bedankt!");
    },
  });
}

function boek_roadtrip() {
  if (!$("#boek_email").val()) {
    alert("Geef uw e-mail in.");
  } else if (!$("#boek_naam").val()) {
    alert("Geef uw naam in.");
  } else if (!$("#boek_voornaam").val()) {
    alert("Geef uw voornaam in.");
  } else if (!$("#gekozen_route").html()) {
    alert("Duid een route aan op de kaart die u wilt boeken!");
  } else {
    const to = $("#boek_email").val();
    const subject = `Bevestiging boeking Roadtrip: ${$(
      "#gekozen_route"
    ).html()}`;
    const message = `
  Beste ${$("#boek_voornaam").val()} ${$("#boek_naam").val()},

  Uw roadtrip "${$(
    "#gekozen_route"
  ).html()}" is succesvol geboekt bij ons! Hieronder ziet u de details van de boeking:
  Auto: ${$("#auto_eind").html()}
  Gelieve bij aanvang van de roadtrip het bedrag (€${$(
    "#huurprijs"
  ).html()}) voor het aantal dagen dat u wenst de betalen. Na de betaling krijgt u meer details!

  Alvast bedankt!
  Met vriendelijke groeten
  Camino Ibérico

  `;

    $.ajax({
      url: "https://we12s016.ugent.be/flask/student_lefrerik/send_mail",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        to: to,
        subject: subject,
        message: message,
      }),
      success: function (response) {
        alert("Uw roadtrip is geboekt!");
      },
      error: function (xhr) {
        alert("Er ging iets mis: " + xhr.responseJSON.error);
      },
    });
  }
}

function geen_auto() {
  $("#auto_show").hide();
  $("#huurprijs").html("0");
  $("#auto_eind").html("Geen auto");
}



