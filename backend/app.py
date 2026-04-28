from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configurar SQLite
DB_PATH = 'dofus.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def initialize_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Crear tablas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rune_prices (
            runeId INTEGER PRIMARY KEY,
            runeName TEXT NOT NULL,
            price INTEGER NOT NULL,
            updatedAt TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            runeId INTEGER NOT NULL,
            runeName TEXT NOT NULL,
            price INTEGER NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS broken_items (
            id TEXT PRIMARY KEY,
            itemName TEXT NOT NULL,
            breakPercentage REAL NOT NULL,
            itemPrice INTEGER NOT NULL,
            craftPrice INTEGER NOT NULL,
            runesObtained TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS runes (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS equipment (
            id INTEGER PRIMARY KEY
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS equipment_items (
            itemId INTEGER PRIMARY KEY,
            itemData TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            itemId INTEGER PRIMARY KEY
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items_cache (
            cacheKey TEXT PRIMARY KEY,
            items TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS characteristics_cache (
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS item_images_cache (
            images TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

# Inicializar la base de datos al iniciar
initialize_database()

# API para precios de runas
@app.route('/api/rune-prices', methods=['GET'])
def get_rune_prices():
    conn = get_db_connection()
    rune_prices = conn.execute('SELECT * FROM rune_prices').fetchall()
    conn.close()
    return jsonify([dict(row) for row in rune_prices])

@app.route('/api/rune-prices', methods=['POST'])
def set_rune_price():
    data = request.json
    rune_id = data['runeId']
    rune_name = data['runeName']
    price = data['price']
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar si ya existe el precio
    cursor.execute('SELECT * FROM rune_prices WHERE runeId = ?', (rune_id,))
    existing = cursor.fetchone()
    
    if existing:
        # Guardar en historial si el precio cambió
        if existing['price'] != price:
            cursor.execute('''
                INSERT INTO price_history (runeId, runeName, price, timestamp)
                VALUES (?, ?, ?, ?)
            ''', (rune_id, rune_name, existing['price'], now))
        
        # Actualizar precio
        cursor.execute('''
            UPDATE rune_prices SET runeName = ?, price = ?, updatedAt = ?
            WHERE runeId = ?
        ''', (rune_name, price, now, rune_id))
    else:
        # Insertar nuevo precio con historial inicial de 0
        cursor.execute('''
            INSERT INTO price_history (runeId, runeName, price, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (rune_id, rune_name, 0, now))
        cursor.execute('''
            INSERT INTO rune_prices (runeId, runeName, price, updatedAt)
            VALUES (?, ?, ?, ?)
        ''', (rune_id, rune_name, price, now))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/rune-prices/<int:rune_id>', methods=['DELETE'])
def delete_rune_price(rune_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM rune_prices WHERE runeId = ?', (rune_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para historial de precios
@app.route('/api/price-history', methods=['GET'])
def get_price_history():
    conn = get_db_connection()
    history = conn.execute('SELECT * FROM price_history ORDER BY timestamp DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in history])

@app.route('/api/price-history', methods=['DELETE'])
def clear_price_history():
    conn = get_db_connection()
    conn.execute('DELETE FROM price_history')
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para items rotos
@app.route('/api/broken-items', methods=['GET'])
def get_broken_items():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM broken_items').fetchall()
    conn.close()
    return jsonify([dict(row) for row in items])

@app.route('/api/broken-items', methods=['POST'])
def add_broken_item():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO broken_items (id, itemName, breakPercentage, itemPrice, craftPrice, runesObtained, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (data['id'], data['itemName'], data['breakPercentage'], data['itemPrice'], 
          data['craftPrice'], json.dumps(data['runesObtained']), data.get('createdAt', datetime.now().isoformat())))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/broken-items/<item_id>', methods=['DELETE'])
def delete_broken_item(item_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM broken_items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para datos de runas
@app.route('/api/runes', methods=['GET'])
def get_runes_data():
    conn = get_db_connection()
    runes = conn.execute('SELECT data FROM runes').fetchall()
    conn.close()
    return jsonify([json.loads(row['data']) for row in runes])

@app.route('/api/runes', methods=['POST'])
def set_runes_data():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Limpiar datos existentes
    cursor.execute('DELETE FROM runes')
    
    # Insertar nuevos datos
    for rune in data:
        cursor.execute('INSERT INTO runes (id, data) VALUES (?, ?)', (rune['id'], json.dumps(rune)))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para limpiar todos los datos
@app.route('/api/clear-all', methods=['POST'])
def clear_all_data():
    conn = get_db_connection()
    conn.execute('DELETE FROM rune_prices')
    conn.execute('DELETE FROM price_history')
    conn.execute('DELETE FROM broken_items')
    conn.execute('DELETE FROM runes')
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para resetear precios a 0
@app.route('/api/reset-prices', methods=['POST'])
def reset_all_prices_to_zero():
    conn = get_db_connection()
    conn.execute('UPDATE rune_prices SET price = 0, updatedAt = ?', (datetime.now().isoformat(),))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para equipo
@app.route('/api/equipment', methods=['GET'])
def get_equipment():
    conn = get_db_connection()
    equipment = conn.execute('SELECT * FROM equipment').fetchall()
    conn.close()
    return jsonify([dict(row) for row in equipment])

@app.route('/api/equipment', methods=['POST'])
def set_equipment():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Limpiar datos existentes
    cursor.execute('DELETE FROM equipment')
    
    # Insertar nuevos datos
    for item in data:
        cursor.execute('INSERT INTO equipment (id) VALUES (?)', (item,))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para items de equipo
@app.route('/api/equipment-items', methods=['GET'])
def get_equipment_items():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM equipment_items').fetchall()
    conn.close()
    result = {}
    for row in items:
        result[row['itemId']] = json.loads(row['itemData'])
    return jsonify(result)

@app.route('/api/equipment-items', methods=['POST'])
def set_equipment_item():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO equipment_items (itemId, itemData)
        VALUES (?, ?)
    ''', (data['itemId'], json.dumps(data)))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/equipment-items/<int:item_id>', methods=['DELETE'])
def remove_equipment_item(item_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM equipment_items WHERE itemId = ?', (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para caché de items
@app.route('/api/items-cache/<type_id>', methods=['GET'])
def get_items_cache(type_id):
    conn = get_db_connection()
    cache_key = f'type_{type_id}'
    cached = conn.execute('SELECT * FROM items_cache WHERE cacheKey = ?', (cache_key,)).fetchone()
    conn.close()
    
    if not cached:
        return jsonify(None)
    
    # Verificar si el caché tiene más de 24 horas
    cache_time = datetime.fromisoformat(cached['timestamp'])
    hours_diff = (datetime.now() - cache_time).total_seconds() / 3600
    
    if hours_diff < 24:
        return jsonify(json.loads(cached['items']))
    
    return jsonify(None)

@app.route('/api/items-cache', methods=['POST'])
def set_items_cache():
    data = request.json
    type_id = data['typeId']
    items = data['items']
    cache_key = f'type_{type_id}'
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO items_cache (cacheKey, items, timestamp)
        VALUES (?, ?, ?)
    ''', (cache_key, json.dumps(items), now))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para caché de características
@app.route('/api/characteristics-cache', methods=['GET'])
def get_characteristics_cache():
    conn = get_db_connection()
    cached = conn.execute('SELECT * FROM characteristics_cache').fetchone()
    conn.close()
    
    if not cached:
        return jsonify(None)
    
    # Verificar si el caché tiene más de 24 horas
    cache_time = datetime.fromisoformat(cached['timestamp'])
    hours_diff = (datetime.now() - cache_time).total_seconds() / 3600
    
    if hours_diff < 24:
        return jsonify(json.loads(cached['data']))
    
    return jsonify(None)

@app.route('/api/characteristics-cache', methods=['POST'])
def set_characteristics_cache():
    data = request.json
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO characteristics_cache (data, timestamp)
        VALUES (?, ?)
    ''', (json.dumps(data), now))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API para caché de imágenes de items
@app.route('/api/item-images-cache', methods=['GET'])
def get_item_images_cache():
    conn = get_db_connection()
    cached = conn.execute('SELECT * FROM item_images_cache').fetchone()
    conn.close()
    
    if not cached:
        return jsonify(None)
    
    # Verificar si el caché tiene más de 24 horas
    cache_time = datetime.fromisoformat(cached['timestamp'])
    hours_diff = (datetime.now() - cache_time).total_seconds() / 3600
    
    if hours_diff < 24:
        return jsonify(json.loads(cached['images']))
    
    return jsonify(None)

@app.route('/api/item-images-cache', methods=['POST'])
def set_item_images_cache():
    data = request.json
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO item_images_cache (images, timestamp)
        VALUES (?, ?)
    ''', (json.dumps(data), now))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
