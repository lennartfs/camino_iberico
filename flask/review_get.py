from flask import Flask, request, jsonify
import psycopg2
import json
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)

DB_CONFIG = {
    "dbname": "student_lefrerik_1",
    "user": "student_lefrerik",
    "password": "lenneke",
    "host": "we12s016.ugent.be",
    "port": "5432",
}

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
