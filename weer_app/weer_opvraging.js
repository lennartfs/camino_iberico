/** ELa
    capitalize = hoofdletters maken
    windconv_nl = klasse die in het nederlands van graden de windrichting en het juiste icoon geeft
    opvraging() = vraagt globaal van een adres de lengte en breedtegraden op
    event listener = op enter drukken om ook te zoeken
    backimg_nl = zorgt ervoor dat de achtergrond wijzigt met het weer in nederlands
    weer_opvraging() = geeft het toekomstige weer zowel huidig als voor komede dagen
 */

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

class Windconv_nl{
    constructor(deg) {this.deg = parseFloat(deg)}

    richting(){
        if(this.deg > 337.5 || this.deg <= 22.5){
            return " N"
        }
        else if(this.deg > 22.5 && this.deg <= 67.5){
            return " NO"
        }
        else if(this.deg > 67.5 &&  this.deg <= 112.5){
            return " O"
        }
        else if(this.deg > 112.5 && this.deg <= 157.5){
            return " ZO"
        }
        else if(this.deg > 157.5 && this.deg <= 202.5){
            return " Z"
        }
        else if(this.deg > 202.5 &&  this.deg <= 247.5){
            return " ZW"
        }
        else if(this.deg > 247.5 && this.deg <= 292.5){
            return " W"
        }
        else if(this.deg > 292.5 && this.deg <= 337.5){
            return " NW"
        }
    }
    // functie aanmaken dat van een richting de juiste hoek geeft voor het icoon
    icoon(richt) {
        // deze const is een dictionary
        const richting_hoek = {
            " N": 135,
            " NO": 180,
            " O": 225,
            " ZO": 270,
            " Z": 315,
            " ZW": 360,
            " W": 45,
            " NW": 90
        };
        return richting_hoek[richt] || 0; // Als de richting ontbreekt, geef dan 0 terug
    }

    getWindIcoon() {
        return this.icoon(this.richting()); // Methode gebruikt een andere methode binnen de klasse
    }
}

function opvraging() {
    $.ajax({
        url: 'https://api.opencagedata.com/geocode/v1/json?',
        type: 'GET',
        data: {q: $('#adres').val(), key: '5d51a489fc4d4fd7a2903677c45712bc'},
        dataType: 'json',
        success: function(response) {
            if(response.results.length > 0){
                let lat = response.results[0].geometry.lat
                let lon = response.results[0].geometry.lng
                $('#lat').html(lat.toPrecision(4));
                $('#lon').html(lon.toPrecision(4));
                weer_opvraging(lat, lon)
            }
            else{
                alert("Geef een geldige locatie op.")
            }
        }
    });
}

document.addEventListener("keydown", event => {
    if(event.key === "Enter"){
        opvraging()
    }
})

function back_img_nl(descr){
    if(descr.includes("regen")){
        $('#bod').css('background-image', 'url(rainy.jpg)')
    }
    else if(descr.includes("helder")){
        $('#bod').css('background-image', 'url(clear.jpg)')
    }
    else if(descr.includes("zeer lichte")){
        $('#bod').css('background-image', 'url(clear_cloudy.jpg)')
    }
    else if(descr.includes("licht bewolkt")){
        $('#bod').css('background-image', 'url(cloudy.jpg)')
    }
    else if(descr.includes("half") || descr.includes("overcast")){
        $('#bod').css('background-image', 'url(overcast.jpg)')
    }
    else if(descr.includes("sneeuw") || descr.includes("sleet")){
        $('#bod').css('background-image', 'url(snow.jpg)')
    }
    else if(descr.includes("mist") || descr.includes("rook") || descr.includes("nevel")){
        $('#bod').css('background-image', 'url(mist.jpg)')
    }
    else if(descr.includes("onweer")){
        $('#bod').css('background-image', 'url(thunderstorm.jpg)')
    }
}

function weer_opvraging(latx, lony) {
    /**
     totale data voor elke opvraging:
     {lat: latx, lon: lony, appid: '3b8cd8cbf15463e9357c07fae902f53e', units: 'metric'}
     3 ajax opvragingen toevoegen
     1. Temperatuur en wind in tabel plaatsen temp: id=#temp en wind: id=#wind
     response.list[0].main.temp
     response.list[0].wind.speed
     2. de bron van (src) afbeelding aanpassen: https://openweathermap.org/img/wn/xxx.png op plek van
     xxx 3 letters aanpassen
     response.list[0].weather[0].icon
     3. weersvoorspellingen opvragen op basis van coord
     Gebruik Javascript templates om de data om te zetten in een HTML-blokje icoon + temperatuur + tijd/datum
     **/

    $.ajax({
        url: 'https://api.openweathermap.org/data/2.5/weather',
        type: 'GET',
        data: {lat: latx, lon: lony, appid: '3b8cd8cbf15463e9357c07fae902f53e', units: 'metric', lang: "nl"},
        dataType: 'json',
        success: function (response) {
            const windje_nl = new Windconv_nl(response.wind.deg)
            $('#wind_dir').html(windje_nl.richting())
            $('#wind_icoon').css('transform', `rotate3d(0, 0, 1, ${windje_nl.getWindIcoon()}deg)`)
            back_img_nl(response.weather[0].description)

            $('#temp').html(Math.round(response.main.temp))
            $('#tempfeel').html(Math.round(response.main.feels_like))
            $('#wind').html(Math.round((response.wind.speed * 3.6)))
            $('#wind_bft').html(Math.round(((response.wind.speed / 0.836)**(2/3))))

            $('#desc').html(capitalize(response.weather[0].description))
            document.getElementById("icon").src = 'https://openweathermap.org/img/wn/' + response.weather[0].icon + '.png'

            console.log(windje)
            console.log(icoon(windje.richting()))
            console.log(windje.richting())

        }
    })

}