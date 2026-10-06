const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize database on startup
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS beers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brewery VARCHAR(255),
        abv FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Get all beers
app.get('/api/beers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching beers:', err);
    res.status(500).json({ error: 'Failed to fetch beers' });
  }
});

// API: Add a beer
app.post('/api/beers', async (req, res) => {
  const { name, brewery, abv } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Beer name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO beers (name, brewery, abv) VALUES ($1, $2, $3) RETURNING *',
      [name, brewery || null, abv || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding beer:', err);
    res.status(500).json({ error: 'Failed to add beer' });
  }
});

// API: Delete a beer
app.delete('/api/beers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM beers WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting beer:', err);
    res.status(500).json({ error: 'Failed to delete beer' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🍺 Belgian Beer Tally running on port ${port}`);
  });
});
