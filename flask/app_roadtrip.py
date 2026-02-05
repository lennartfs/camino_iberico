from flask import Flask, request, jsonify
import psycopg2
import json
import smtplib
import os
from email.mime.text import MIMEText

app = Flask(__name__)


DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}

def prettier(value):
    return value.capitalize() if value != "pickup" else "Pick-Up"


def translate(value, rev):
    dictionaire = {
        "archaeological": "Archeologische Opgraving",
        "attraction": "Recreatief",
        "bench": "Bank",
        "camp_site": "Kampeerplek",
        "caravan_site": "Caravanparkeerplaats",
        "fort": "Fort",
        "monument": "Monument",
        "museum": "Museum",
        "park": "Park",
        "ruins": "Ruïne",
        "viewpoint": "Uitzichtpunt",
        "water_well": "Waterput",
    }

    key = next((k for k, v in dictionaire.items() if v == value), None)

    return dictionaire[value] if rev == 1 else key


def uren(getal):
    uren = int(getal)
    minuten = round((getal - uren) * 60)
    return f"{uren} uur en {minuten} minuten"


@app.route("/review_get", methods=["GET"])
def reviewget():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT CONCAT(g.voornaam, ' ', g.naam) AS gebruiker, r.beoordeling, concat(t.start_stad, '-', t.eind_stad) as route, r.beschrijvring
        from project_roadtrip.gebruikers g
        inner join
            project_roadtrip.recensies r on g.geb_id = r.geb_id
        inner join
            project_roadtrip.roadtrips t on r.route_id = t.route_id
        order by r.rec_id desc
        """,
    )
    tabel_tup = cur.fetchall()
    tabel_dict = [
        {
            "gebruiker": row[0],
            "beoordeling": int(row[1]),
            "route": row[2],
            "beschrijving": row[3],
        }
        for row in tabel_tup
    ]
    tabel_json = jsonify({"reviews": tabel_dict})
    cur.close()
    conn.close()
    return tabel_json


@app.route("/opvragen_autos", methods=["GET"])
def opvragen_autos():
    type_a = request.args.get("type_a", "")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(
        """
        select concat(a.merk, ' ', a.modelnaam)
        from project_roadtrip.autos AS a
        where a.type = %s
        """,
        (type_a,),
    )
    tabel_tup = cur.fetchall()
    tabel_dict = [{"naam": row[0]} for row in tabel_tup]
    return jsonify({"autos": tabel_dict})


@app.route("/opvragen_geld", methods=["GET"])
def opvragen_geld():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    auto_naam = str(request.args.get("auto_naam", ""))
    cur.execute(
        """
        SELECT a.huurprijs_pd
        FROM project_roadtrip.autos AS a
        WHERE CONCAT(a.merk, ' ', a.modelnaam) = %s
        """,
        (auto_naam,),
    )
    tabel_tup = cur.fetchall()
    tabel_dict = [{"huurprijs": str(row[0])} for row in tabel_tup]
    return jsonify({"categorie": tabel_dict})


@app.route("/review_toevoegen", methods=["POST"])
def add_review():
    naam = request.form.get("naam", "")
    voornaam = request.form.get("voornaam", "")
    route = str(request.form.get("route", "e-r"))
    ster = request.form.get("ster", "")
    beschrijving = request.form.get("beschrijving", "")

    # route_knip = functie die route opsplitst
    start_stad, eind_stad = route.split("-")

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # controleer of de route bestaat
    cur.execute(
        """
        SELECT route_id
        FROM project_roadtrip.roadtrips
        WHERE start_stad = %s AND eind_stad = %s
        """,
        (start_stad, eind_stad),
    )
    # fetchone haalt 1 enkele rij uit het resultaat van de query
    route_result = cur.fetchone()

    if not route_result:
        return jsonify({"error": "Route niet gevonden"}), 404

    route_id = route_result[0]

    # controleer of de gebruiker bestaat
    cur.execute(
        """
        SELECT geb_id
        FROM project_roadtrip.gebruikers
        WHERE naam = %s AND voornaam = %s
        """,
        (naam, voornaam),
    )

    gebruiker_result = cur.fetchone()

    if gebruiker_result:
        # gebruiker bestaat, dus id nemen
        geb_id = gebruiker_result[0]
    else:
        # gebruiker bestaat nog niet, toevoegen
        cur.execute(
            """
            INSERT INTO project_roadtrip.gebruikers (naam, voornaam, email)
            VALUES (%s, %s, LOWER(%s || %s || '@gmail.be'))
            RETURNING geb_id
            """,
            (naam, voornaam, naam, voornaam),
        )
        # eerst toevoegen, dan pas de id nemen
        geb_id = cur.fetchone()[0]

    # recensie toevoegen
    cur.execute(
        """
        INSERT INTO project_roadtrip.recensies (geb_id, route_id, beoordeling, beschrijvring)
        VALUES (%s, %s, %s, %s)
        """,
        (geb_id, route_id, ster, beschrijving),
    )

    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Recensie Toegevoegd"}), 201


@app.route("/auto_compl", methods=["GET"])
def auto_compl():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    search = str(request.args.get("search", ""))
    search = "%" + search.lower() + "%"

    cur.execute(
        """
        select s.name as name
        from project_roadtrip.stedenroadtrips as s
        where LOWER(s.name) like LOWER(%s)
        """,
        (search,),
    )
    tabel_tup = cur.fetchall()
    tabel_dict = [{"name": row[0]} for row in tabel_tup]
    tabel_json = jsonify({"steden": tabel_dict})
    cur.close()
    conn.close()
    return tabel_json


@app.route("/get_routes", methods=["GET"])
def get_routes():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    stad1 = str(request.args.get("stad1", ""))
    stad2 = str(request.args.get("stad2", ""))
    cur.execute(
        """
        select r.gid, ST_AsGeoJSON(r.geom), r.route_id, concat(r.start_stad, '-', r.eind_stad) as name, r.duur_hr, r.beste_auto
        from project_roadtrip.roadtrips as r
        where (r.start_stad like %s or r.eind_stad like %s) or (r.start_stad like %s or r.eind_stad like %s)
        """,
        (stad1, stad1, stad2, stad2),
    )

    features = []
    for row in cur.fetchall():
        feature = {
            "type": "Feature",
            "id": row[0],
            "geometry": json.loads(row[1]),
            "properties": {
                "route_id": row[2],
                "name": row[3],
                "duur": uren(row[4]),
                "auto": prettier(row[5]),
            },
        }
        features.append(feature)

    cur.close()
    conn.close()

    geojson = {"type": "FeatureCollection", "features": features}

    return jsonify(geojson)


@app.route("/get_route_name", methods=["GET"])
def get_route_name():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    name_route = str(request.args.get("name_route", ""))
    stad1 = name_route.split("-")[0]
    stad2 = name_route.split("-")[1]
    cur.execute(
        """
        select r.gid, ST_AsGeoJSON(r.geom), r.route_id, concat(r.start_stad, '-', r.eind_stad) as name, r.duur_hr, r.beste_auto
        from project_roadtrip.roadtrips as r
        where r.start_stad like %s and r.eind_stad like %s
        """,
        (stad1, stad2),
    )

    features = []
    for row in cur.fetchall():
        feature = {
            "type": "Feature",
            "id": row[0],
            "geometry": json.loads(row[1]),
            "properties": {
                "route_id": row[2],
                "name": row[3],
                "duur": uren(row[4]),
                "auto": prettier(row[5]),
            },
        }
        features.append(feature)

    cur.close()
    conn.close()

    geojson = {"type": "FeatureCollection", "features": features}

    return jsonify(geojson)


@app.route("/get_pois", methods=["GET"])
def get_pois():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    name_route = str(request.args.get("name_route", ""))
    stad1, stad2 = name_route.split("-")

    cur.execute(
        """
        SELECT 
            p1.gid,
            ST_AsGeoJSON(p1.geom),
            p1.route_id,
            p1.fclass,
            p1.poi_id_,
            p1.name
        FROM project_roadtrip.pois_roadtrips AS p1
        INNER JOIN project_roadtrip.roadtrips AS r ON p1.route_id = r.route_id
        WHERE r.start_stad = %s AND r.eind_stad = %s
        """,
        (stad1, stad2),
    )

    features = []
    for row in cur.fetchall():
        feature = {
            "type": "Feature",
            "id": row[0],
            "geometry": json.loads(row[1]),
            "properties": {
                "route_id": row[2],
                "fclass": translate((row[3]), 1),
                "poi_id": row[4],
                "name": row[5],
            },
        }
        features.append(feature)

    cur.close()
    conn.close()

    geojson = {"type": "FeatureCollection", "features": features}
    return jsonify(geojson)


@app.route("/poi_toevoegen", methods=["POST"])
def add_poi():
    # ophalen en verwerken gegevens
    naam = request.form.get("naam", "")
    categorie = request.form.get("categorie", "")
    naam_route = str(request.form.get("naam_route", ""))
    lat = float(request.form.get("lat", 0))
    lng = float(request.form.get("lng", 0))

    categorie = translate(categorie, 2)

    stad1, stad2 = naam_route.split("-")

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # controleer of de route bestaat
    cur.execute(
        """
        WITH routeid AS (
        SELECT r1.route_id AS rid
        FROM project_roadtrip.roadtrips r1
        WHERE %s = r1.start_stad AND %s = r1.eind_stad
        )
        INSERT INTO project_roadtrip.pois_roadtrips (fclass, name, route_id, geom)
        SELECT %s, %s, routeid.rid, ST_SetSRID(ST_MakePoint(%s, %s, 0, 0), 4326)
        FROM routeid;
        """,
        (stad1, stad2, categorie, naam, lng, lat),
    )

    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Bedankt! Uw infopunt is opgeslagen!"})


@app.route("/send_mail", methods=["POST"])
def send_mail():
    data = request.get_json()
    ontvanger = data.get("to")
    onderwerp = data.get("subject")
    bericht = data.get("message")

    if not ontvanger or not onderwerp or not bericht:
        return jsonify({"error": "Missing fields"}), 400

    try:
        msg = MIMEText(bericht)
        msg["Subject"] = onderwerp
        msg["From"] = "caminoibericoinfo@gmail.com"
        msg["To"] = ontvanger

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login("caminoibericoinfo@gmail.com", "pfdldyscdenfkuay")
            server.send_message(msg)

        return jsonify({"message": "Mail succesvol verzonden!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

