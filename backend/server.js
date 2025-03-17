const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear la aplicación Express
const app = express();
const port = 5000;

// Habilitar CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Ruta a la base de datos (asegúrate de que la carpeta exista)
const dbPath = path.resolve(__dirname, 'events.db');
console.log('Ruta de la base de datos:', dbPath);

// Conectar a la base de datos SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    return;
  }
  console.log('Conectado a la base de datos SQLite en', dbPath);
  
  // Habilitar foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Crear la tabla de eventos si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora_inicio TEXT DEFAULT '00:00',
      hora_fin TEXT DEFAULT '23:59',
      lugar TEXT NOT NULL,
      tipo_actividad TEXT NOT NULL,
      empresa TEXT NOT NULL, 
      disertantes TEXT NOT NULL,
      descripcion TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla events:', err.message);
    } else {
      console.log('Tabla events creada correctamente o ya existía');
      
      // Verificar si la tabla tiene la estructura correcta
      db.all("PRAGMA table_info(events)", [], (err, columns) => {
        if (err) {
          console.error('Error al verificar estructura de tabla:', err.message);
          return;
        }
        
        console.log('Estructura de la tabla events:', columns);
        
        // Verificar si existen las columnas hora_inicio y hora_fin
        const hasHoraInicio = columns.some(col => col.name === 'hora_inicio');
        const hasHoraFin = columns.some(col => col.name === 'hora_fin');
        
        if (!hasHoraInicio || !hasHoraFin) {
          console.log('Actualizando estructura de tabla para añadir campos de hora...');
          
          // Añadir columnas si no existen
          if (!hasHoraInicio) {
            db.run('ALTER TABLE events ADD COLUMN hora_inicio TEXT DEFAULT "00:00"');
          }
          if (!hasHoraFin) {
            db.run('ALTER TABLE events ADD COLUMN hora_fin TEXT DEFAULT "23:59"');
          }
          
          console.log('Tabla actualizada con campos de hora');
        }
      });
    }
  });
});

// Obtener todas las categorías
app.get('/categories', (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ categories: rows });
    }
  });
});

// Obtener todos los eventos
app.get('/events', (req, res) => {
  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) {
      console.error('Error al consultar eventos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ events: rows });
  });
});

// Crear un nuevo evento
app.post('/events', (req, res) => {
  const { nombre, fecha, hora_inicio, hora_fin, lugar, tipo_actividad, empresa, disertantes, descripcion } = req.body;
  
  console.log('Datos recibidos para crear evento:', req.body);
  
  // Validación básica
  if (!nombre || !fecha) {
    return res.status(400).json({ error: 'El nombre y la fecha son obligatorios' });
  }
  
  db.run(
    `INSERT INTO events (nombre, fecha, hora_inicio, hora_fin, lugar, tipo_actividad, empresa, disertantes, descripcion) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, fecha, hora_inicio || '00:00', hora_fin || '23:59', lugar, tipo_actividad, empresa, disertantes, descripcion],
    function (err) {
      if (err) {
        console.error('Error al insertar evento:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM events WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Error al recuperar evento creado:', err.message);
          return res.status(500).json({ error: err.message });
        }
        console.log('Evento creado:', row);
        res.status(201).json(row);
      });
    }
  );
});

// Actualizar un evento existente
app.put('/events/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, hora_inicio, hora_fin, lugar, tipo_actividad, empresa, disertantes, descripcion } = req.body;
  
  console.log(`Actualizando evento ${id} con:`, req.body);
  
  db.run(
    `UPDATE events SET nombre = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, lugar = ?, 
     tipo_actividad = ?, empresa = ?, disertantes = ?, descripcion = ? WHERE id = ?`,
    [nombre, fecha, hora_inicio || '00:00', hora_fin || '23:59', lugar, tipo_actividad, empresa, disertantes, descripcion, id],
    function (err) {
      if (err) {
        console.error('Error al actualizar evento:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error al recuperar evento actualizado:', err.message);
          return res.status(500).json({ error: err.message });
        }
        console.log('Evento actualizado:', row);
        res.json(row);
      });
    }
  );
});

// Eliminar un evento
app.delete('/events/:id', (req, res) => {
  const { id } = req.params;
  
  console.log(`Eliminando evento ${id}`);
  
  db.run('DELETE FROM events WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error al eliminar evento:', err.message);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    res.json({ message: 'Evento eliminado correctamente' });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

// Manejo de cierre para cerrar correctamente la conexión a la BD
process.on('SIGINT', () => {
  console.log('Cerrando conexión a la base de datos...');
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message);
    } else {
      console.log('Conexión a la base de datos cerrada');
    }
    process.exit(0);
  });
});

// Deja fetchEvents como está y modifica handleAddEvent:
const handleAddEvent = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  try {
    const response = await axios.post(
      "http://localhost:5000/events",
      newEvent
    )
    console.log("Respuesta del servidor:", response.data)
    
    // Resto del código igual...
  } catch (error) {
    // Resto del código igual...
  }
}
