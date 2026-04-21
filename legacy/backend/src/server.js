// ============================================================
// jeffef.dev — Backend do site pessoal
//
// COMO USAR:
//   Opção A) Servidor standalone: node src/server.js
//   Opção B) Integrar ao Finanza: copie o bloco marcado
//            como "ROTAS DO SITE" para dentro do seu server.js
//            e registre: app.use('/api/site', siteRouter)
//
// VARIÁVEIS DE AMBIENTE (.env):
//   DATABASE_URL=postgres://...    (mesmo do Finanza)
//   SITE_API_KEY=sua_chave_secreta (diferente da do Finanza, ou a mesma)
//   PORT=3001
// ============================================================

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '8mb' })); // permite imagens base64 pequenas

// ── MIDDLEWARE AUTH ──────────────────────────────────────────
// Só protege rotas de escrita (POST/PUT/DELETE)
function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.SITE_API_KEY) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  next();
}

// ============================================================
// ROTAS DO SITE  ← copie daqui até o final se integrar ao Finanza
// ============================================================
const router = express.Router();

// ── HEALTH ──────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ ok: true }));

// ── PAYLOAD COMPLETO (uma chamada carrega tudo) ──────────────
// O frontend chama GET /api/site/page na inicialização
router.get('/page', async (req, res) => {
  try {
    const [notes, photos, status, profile] = await Promise.all([
      pool.query(`SELECT * FROM site_notes WHERE published = true ORDER BY created_at DESC`),
      pool.query(`SELECT * FROM site_photos ORDER BY position ASC`),
      pool.query(`SELECT * FROM site_status WHERE active = true ORDER BY position ASC`),
      pool.query(`SELECT key, value FROM site_profile`),
    ]);

    const profileMap = {};
    profile.rows.forEach(r => { profileMap[r.key] = r.value; });

    res.json({
      notes:   notes.rows,
      photos:  photos.rows,
      status:  status.rows,
      profile: profileMap,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── NOTAS ───────────────────────────────────────────────────
router.get('/notes', async (req, res) => {
  const rows = await pool.query(`SELECT * FROM site_notes WHERE published = true ORDER BY created_at DESC`);
  res.json(rows.rows);
});

router.post('/notes', requireAuth, async (req, res) => {
  const { title, type = 'diário', body, tags = [], image_url, published = true } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title e body obrigatórios.' });
  const { rows } = await pool.query(
    `INSERT INTO site_notes (id, title, type, body, tags, image_url, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [uuidv4(), title, type, body, tags, image_url || null, published]
  );
  res.status(201).json(rows[0]);
});

router.put('/notes/:id', requireAuth, async (req, res) => {
  const { title, type, body, tags, image_url, published } = req.body;
  const { rows } = await pool.query(
    `UPDATE site_notes SET
       title      = COALESCE($1, title),
       type       = COALESCE($2, type),
       body       = COALESCE($3, body),
       tags       = COALESCE($4, tags),
       image_url  = COALESCE($5, image_url),
       published  = COALESCE($6, published)
     WHERE id = $7 RETURNING *`,
    [title, type, body, tags, image_url, published, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Nota não encontrada.' });
  res.json(rows[0]);
});

router.delete('/notes/:id', requireAuth, async (req, res) => {
  await pool.query(`DELETE FROM site_notes WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

// ── FOTOS ────────────────────────────────────────────────────
router.get('/photos', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM site_photos ORDER BY position ASC`);
  res.json(rows);
});

router.post('/photos', requireAuth, async (req, res) => {
  const { url, caption, position = 99 } = req.body;
  if (!url) return res.status(400).json({ error: 'url obrigatória.' });
  const { rows } = await pool.query(
    `INSERT INTO site_photos (id, url, caption, position) VALUES ($1,$2,$3,$4) RETURNING *`,
    [uuidv4(), url, caption || null, position]
  );
  res.status(201).json(rows[0]);
});

router.put('/photos/:id', requireAuth, async (req, res) => {
  const { url, caption, position } = req.body;
  const { rows } = await pool.query(
    `UPDATE site_photos SET
       url      = COALESCE($1, url),
       caption  = COALESCE($2, caption),
       position = COALESCE($3, position)
     WHERE id = $4 RETURNING *`,
    [url, caption, position, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Foto não encontrada.' });
  res.json(rows[0]);
});

router.delete('/photos/:id', requireAuth, async (req, res) => {
  await pool.query(`DELETE FROM site_photos WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

// ── STATUS CHIPS ─────────────────────────────────────────────
router.get('/status', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM site_status WHERE active = true ORDER BY position ASC`);
  res.json(rows);
});

router.post('/status', requireAuth, async (req, res) => {
  const { label, color_var = 'blue', position = 99 } = req.body;
  if (!label) return res.status(400).json({ error: 'label obrigatório.' });
  const { rows } = await pool.query(
    `INSERT INTO site_status (id, label, color_var, position) VALUES ($1,$2,$3,$4) RETURNING *`,
    [uuidv4(), label, color_var, position]
  );
  res.status(201).json(rows[0]);
});

router.put('/status/:id', requireAuth, async (req, res) => {
  const { label, color_var, position, active } = req.body;
  const { rows } = await pool.query(
    `UPDATE site_status SET
       label     = COALESCE($1, label),
       color_var = COALESCE($2, color_var),
       position  = COALESCE($3, position),
       active    = COALESCE($4, active)
     WHERE id = $5 RETURNING *`,
    [label, color_var, position, active, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Status não encontrado.' });
  res.json(rows[0]);
});

router.delete('/status/:id', requireAuth, async (req, res) => {
  await pool.query(`DELETE FROM site_status WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

// ── PERFIL ───────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  const { rows } = await pool.query(`SELECT key, value FROM site_profile`);
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  res.json(map);
});

// Atualiza um ou mais campos de perfil de uma vez
// Body: { "bio": "novo texto", "closing": "novo fechamento", ... }
router.put('/profile', requireAuth, async (req, res) => {
  const updates = req.body;
  if (!updates || !Object.keys(updates).length) {
    return res.status(400).json({ error: 'Nenhum campo enviado.' });
  }
  const ALLOWED = ['hero_title','hero_lead','hero_aside','name','location','bio',
                   'formation','languages','work_focus','interests','closing'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED.includes(k))
  );
  if (!Object.keys(filtered).length) {
    return res.status(400).json({ error: 'Nenhum campo válido.' });
  }
  await Promise.all(
    Object.entries(filtered).map(([k, v]) =>
      pool.query(
        `INSERT INTO site_profile (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [k, v]
      )
    )
  );
  // Devolve perfil completo atualizado
  const { rows } = await pool.query(`SELECT key, value FROM site_profile`);
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  res.json(map);
});

// ============================================================
// FIM DAS ROTAS DO SITE
// ============================================================

// Montar router no app (standalone)
app.use('/api/site', router);

// Se integrar ao Finanza, faça:
//   const siteRouter = require('./site-routes');
//   app.use('/api/site', siteRouter);
// e exporte o router no final deste arquivo:
// module.exports = router;

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`jeffef-site backend rodando na porta ${PORT}`));
