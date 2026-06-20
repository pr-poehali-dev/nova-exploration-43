"""
Единый API для ФонМаркет: авторизация, объявления, загрузка фото.
Маршруты:
  POST /auth/register   — регистрация
  POST /auth/login      — вход
  POST /auth/logout     — выход
  GET  /auth/me         — текущий пользователь
  PUT  /auth/me         — обновление профиля

  GET  /listings        — каталог (фильтры: brand, condition, min_price, max_price, search, sort)
  GET  /listings/my     — мои объявления
  GET  /listings/{id}   — детали объявления
  POST /listings        — создать объявление
  PUT  /listings/{id}   — обновить статус объявления

  POST /upload          — загрузить фото (base64), возвращает CDN URL
"""
import json
import os
import hashlib
import secrets
import base64
import uuid
import psycopg2
import boto3
from datetime import datetime, timedelta

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg})}

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def get_session_user(conn, sid):
    if not sid:
        return None
    with conn.cursor() as c:
        c.execute(
            "SELECT u.id, u.email, u.name, u.phone, u.avatar_url, u.created_at "
            "FROM users u JOIN sessions s ON u.id=s.user_id "
            "WHERE s.id=%s AND s.expires_at>NOW()", (sid,)
        )
        r = c.fetchone()
    if not r:
        return None
    return {'id': r[0], 'email': r[1], 'name': r[2], 'phone': r[3], 'avatar_url': r[4],
            'created_at': r[5].isoformat() if r[5] else None}

def make_session(conn, user_id):
    sid = secrets.token_hex(32)
    exp = datetime.now() + timedelta(days=30)
    with conn.cursor() as c:
        c.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s,%s,%s)", (sid, user_id, exp))
    conn.commit()
    return sid

def listing_row(r, photos=None):
    return {
        'id': r[0], 'user_id': r[1], 'title': r[2], 'brand': r[3], 'model': r[4],
        'storage': r[5], 'condition': r[6], 'price': r[7], 'description': r[8],
        'city': r[9], 'status': r[10], 'views': r[11],
        'created_at': r[12].isoformat() if r[12] else None,
        'seller_name': r[13] if len(r) > 13 else None,
        'seller_phone': r[14] if len(r) > 14 else None,
        'photos': photos or []
    }

def load_photos(conn, listing_ids):
    if not listing_ids:
        return {}
    ph = ','.join(['%s'] * len(listing_ids))
    with conn.cursor() as c:
        c.execute(f"SELECT listing_id, url FROM listing_photos WHERE listing_id IN ({ph}) ORDER BY sort_order", listing_ids)
        m = {}
        for lid, url in c.fetchall():
            m.setdefault(lid, []).append(url)
    return m

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/').rstrip('/')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event['body']) if event.get('body') else {}
    sid = (event.get('headers') or {}).get('X-Session-Id') or (event.get('headers') or {}).get('x-session-id', '')

    seg = [s for s in path.split('/') if s]
    group = seg[0] if seg else ''
    sub = seg[1] if len(seg) > 1 else ''

    conn = db()
    try:
        # ── AUTH ────────────────────────────────────────────────────────────────
        if group == 'auth':
            if sub == 'register' and method == 'POST':
                email = body.get('email', '').strip().lower()
                pw = body.get('password', '')
                name = body.get('name', '').strip()
                if not email or not pw or not name:
                    return err('Заполните все поля')
                with conn.cursor() as c:
                    c.execute("SELECT id FROM users WHERE email=%s", (email,))
                    if c.fetchone():
                        return err('Email уже зарегистрирован', 409)
                    c.execute("INSERT INTO users (email,password_hash,name) VALUES (%s,%s,%s) RETURNING id",
                              (email, hash_pw(pw), name))
                    uid = c.fetchone()[0]
                conn.commit()
                return ok({'session_id': make_session(conn, uid), 'user': {'id': uid, 'email': email, 'name': name}})

            if sub == 'login' and method == 'POST':
                email = body.get('email', '').strip().lower()
                pw = body.get('password', '')
                with conn.cursor() as c:
                    c.execute("SELECT id,name,email FROM users WHERE email=%s AND password_hash=%s", (email, hash_pw(pw)))
                    r = c.fetchone()
                if not r:
                    return err('Неверный email или пароль', 401)
                return ok({'session_id': make_session(conn, r[0]), 'user': {'id': r[0], 'name': r[1], 'email': r[2]}})

            if sub == 'logout' and method == 'POST':
                if sid:
                    with conn.cursor() as c:
                        c.execute("UPDATE sessions SET expires_at=NOW() WHERE id=%s", (sid,))
                    conn.commit()
                return ok({'ok': True})

            if sub == 'me':
                user = get_session_user(conn, sid)
                if not user:
                    return err('Не авторизован', 401)
                if method == 'GET':
                    return ok({'user': user})
                if method == 'PUT':
                    with conn.cursor() as c:
                        c.execute("UPDATE users SET name=%s, phone=%s, avatar_url=%s WHERE id=%s",
                                  (body.get('name', user['name']), body.get('phone', user['phone']),
                                   body.get('avatar_url', user['avatar_url']), user['id']))
                    conn.commit()
                    return ok({'ok': True})

        # ── UPLOAD ──────────────────────────────────────────────────────────────
        if group == 'upload' and method == 'POST':
            img = body.get('image', '')
            ct = body.get('content_type', 'image/jpeg')
            if not img:
                return err('Нет изображения')
            if ',' in img:
                img = img.split(',', 1)[1]
            data = base64.b64decode(img)
            ext = 'png' if 'png' in ct else ('webp' if 'webp' in ct else 'jpg')
            key = f"phones/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=data, ContentType=ct)
            cdn = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            return ok({'url': cdn})

        # ── LISTINGS ────────────────────────────────────────────────────────────
        if group == 'listings':
            # Мои объявления
            if sub == 'my' and method == 'GET':
                user = get_session_user(conn, sid)
                if not user:
                    return err('Не авторизован', 401)
                with conn.cursor() as c:
                    c.execute("""SELECT l.id,l.user_id,l.title,l.brand,l.model,l.storage,
                                        l.condition,l.price,l.description,l.city,l.status,l.views,
                                        l.created_at,u.name,u.phone
                                 FROM listings l JOIN users u ON l.user_id=u.id
                                 WHERE l.user_id=%s ORDER BY l.created_at DESC""", (user['id'],))
                    rows = c.fetchall()
                pm = load_photos(conn, [r[0] for r in rows])
                return ok({'listings': [listing_row(r, pm.get(r[0], [])) for r in rows]})

            # Детали / обновить статус
            if sub.isdigit():
                lid = int(sub)
                if method == 'GET':
                    with conn.cursor() as c:
                        c.execute("""SELECT l.id,l.user_id,l.title,l.brand,l.model,l.storage,
                                            l.condition,l.price,l.description,l.city,l.status,l.views,
                                            l.created_at,u.name,u.phone
                                     FROM listings l JOIN users u ON l.user_id=u.id WHERE l.id=%s""", (lid,))
                        r = c.fetchone()
                    if not r:
                        return err('Не найдено', 404)
                    with conn.cursor() as c:
                        c.execute("UPDATE listings SET views=views+1 WHERE id=%s", (lid,))
                        c.execute("SELECT url FROM listing_photos WHERE listing_id=%s ORDER BY sort_order", (lid,))
                        photos = [p[0] for p in c.fetchall()]
                    conn.commit()
                    return ok({'listing': listing_row(r, photos)})

                if method == 'PUT':
                    user = get_session_user(conn, sid)
                    if not user:
                        return err('Не авторизован', 401)
                    with conn.cursor() as c:
                        c.execute("UPDATE listings SET status=%s WHERE id=%s AND user_id=%s",
                                  (body.get('status', 'active'), lid, user['id']))
                    conn.commit()
                    return ok({'ok': True})

            # Каталог
            if method == 'GET':
                where = ["l.status='active'"]
                args = []
                for f, col in [('brand','l.brand'),('condition','l.condition')]:
                    if params.get(f):
                        where.append(f"{col}=%s"); args.append(params[f])
                if params.get('min_price'):
                    where.append("l.price>=%s"); args.append(int(params['min_price']))
                if params.get('max_price'):
                    where.append("l.price<=%s"); args.append(int(params['max_price']))
                if params.get('city'):
                    where.append("l.city ILIKE %s"); args.append(f"%{params['city']}%")
                if params.get('search'):
                    where.append("(l.title ILIKE %s OR l.model ILIKE %s)")
                    args += [f"%{params['search']}%", f"%{params['search']}%"]
                order = {'price_asc':'l.price ASC','price_desc':'l.price DESC'}.get(params.get('sort',''),'l.created_at DESC')
                sql = f"""SELECT l.id,l.user_id,l.title,l.brand,l.model,l.storage,
                                 l.condition,l.price,l.description,l.city,l.status,l.views,
                                 l.created_at,u.name,u.phone
                          FROM listings l JOIN users u ON l.user_id=u.id
                          WHERE {' AND '.join(where)} ORDER BY {order} LIMIT 100"""
                with conn.cursor() as c:
                    c.execute(sql, args)
                    rows = c.fetchall()
                pm = load_photos(conn, [r[0] for r in rows])
                return ok({'listings': [listing_row(r, pm.get(r[0], [])) for r in rows]})

            # Создать объявление
            if method == 'POST':
                user = get_session_user(conn, sid)
                if not user:
                    return err('Не авторизован', 401)
                title = body.get('title', '').strip()
                brand = body.get('brand', '').strip()
                model = body.get('model', '').strip()
                price = int(body.get('price', 0))
                condition = body.get('condition', '')
                if not title or not brand or not model or not condition or price <= 0:
                    return err('Заполните обязательные поля')
                with conn.cursor() as c:
                    c.execute("""INSERT INTO listings (user_id,title,brand,model,storage,condition,price,description,city)
                                 VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                              (user['id'], title, brand, model,
                               body.get('storage',''), condition, price,
                               body.get('description',''), body.get('city','')))
                    new_id = c.fetchone()[0]
                    for i, url in enumerate(body.get('photos', [])):
                        c.execute("INSERT INTO listing_photos (listing_id,url,sort_order) VALUES (%s,%s,%s)", (new_id, url, i))
                conn.commit()
                return ok({'id': new_id, 'ok': True})

        return err('Not found', 404)
    finally:
        conn.close()
