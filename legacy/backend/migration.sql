-- ============================================================
-- jeffef.dev — Tabelas do site pessoal
-- Rodar no banco PostgreSQL do Finanza (ou banco separado)
-- ============================================================

-- Notas / posts do diário
CREATE TABLE IF NOT EXISTS site_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'diário',  -- diário | trabalho | leitura | movimento | projeto
  body        TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  image_url   TEXT,
  published   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fotos da galeria do hero
CREATE TABLE IF NOT EXISTS site_photos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT        NOT NULL,
  caption     TEXT,
  position    INTEGER     NOT NULL DEFAULT 0,  -- ordem de exibição
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status chips do hero ("construindo o Finanza", etc.)
CREATE TABLE IF NOT EXISTS site_status (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT        NOT NULL,
  color_var   TEXT        NOT NULL DEFAULT 'blue',  -- blue | green | rose | gold | sky
  position    INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true
);

-- Perfil (campos editáveis)
CREATE TABLE IF NOT EXISTS site_profile (
  key         TEXT        PRIMARY KEY,  -- 'name' | 'location' | 'bio' | 'formation' | 'languages' | 'work_focus' | 'interests' | 'hero_title' | 'hero_lead' | 'hero_aside' | 'closing'
  value       TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DADOS INICIAIS ──────────────────────────────────────────

INSERT INTO site_status (label, color_var, position) VALUES
  ('construindo o Finanza', 'blue',  0),
  ('estudando dados e BI',  'green', 1),
  ('organizando este site', 'rose',  2)
ON CONFLICT DO NOTHING;

INSERT INTO site_profile (key, value) VALUES
  ('hero_title',  'Um arquivo vivo para ideias, rotina e movimento.'),
  ('hero_lead',   'Tecnologia, dados, BI, finanças, leitura, trabalho, rotina e movimento. Um site pessoal que aceita registros pequenos, sem transformar tudo em vitrine.'),
  ('hero_aside',  'Não é currículo, não é Instagram, não é vitrine. É um caderno aberto para ideias, registros e projetos que fazem sentido na minha semana.'),
  ('name',        'Jefferson de Paula'),
  ('location',    'Itapeva, SP'),
  ('bio',         'Trabalho com gestão de TI, infraestrutura, sistemas, dados e BI. Gosto de construir ferramentas úteis, organizar informações e manter projetos pessoais vivos sem transformar tudo em performance.'),
  ('formation',   'ADS, BI/Big Data/IA e Engenharia de Computação'),
  ('languages',   'Português e inglês profissional'),
  ('work_focus',  'Finanza como laboratório pessoal. Um app para acompanhar dinheiro, rotina e decisões sem expor tudo.'),
  ('interests',   'BI que vira decisão|Infraestrutura com contexto humano|Ferramentas pessoais mais privadas|Projetos pequenos com uso real'),
  ('closing',     'Menos palco, mais registro. Menos algoritmo, mais memória própria.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_photos (url, caption, position) VALUES
  ('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=82', 'Caminhos, viagens e movimento quando existirem.', 0),
  ('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=82',  'Trabalho, notas e pequenas melhorias.', 1),
  ('https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=82',  'Leitura, rotina e ideias soltas.', 2)
ON CONFLICT DO NOTHING;

INSERT INTO site_notes (title, type, body, tags) VALUES
  ('Começar pelo direito de postar pouco.',
   'diário',
   'Nem toda entrada precisa ter paisagem bonita ou conclusão pronta. Algumas coisas só precisam existir antes de virarem explicação.',
   ARRAY['vida comum', 'site pessoal']),
  ('Dados, rotina e decisão.',
   'trabalho',
   'Gosto quando uma informação deixa de ficar espalhada e começa a ajudar alguém a decidir melhor. BI, no fundo, tem muito de arrumar a mesa.',
   ARRAY['BI', 'gestão', 'dados']),
  ('Caminhos continuam aqui.',
   'movimento',
   'Corrida e trilha aparecem quando acontecem, mas não precisam carregar a identidade inteira do site. Elas são parte do mês, não o mês inteiro.',
   ARRAY['corrida', 'trilha', 'memória'])
ON CONFLICT DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER site_notes_updated_at
  BEFORE UPDATE ON site_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER site_profile_updated_at
  BEFORE UPDATE ON site_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
