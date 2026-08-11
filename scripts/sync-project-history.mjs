import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repositories = {
  finanza: ['Jeffersonf', 'finanza'], finanzav3: ['Jeffersonf', 'finanza'], finfit: ['Jeffersonf', 'finfit'],
  finvita: ['Jeffersonf', 'finvita'], painelure2: ['Jeffersonf', 'painelure'], setechub: ['Jeffersonf', 'painelurelegado'],
  bandamarcial: ['Jeffersonf', 'banda-marcial'], arena: ['Jeffersonf', 'arena-futvolei'], jeffef: ['Jeffersonf', 'jeffef'],
  'finanza-next': ['Jeffersonf', 'finanza-next'], fisiosaas: ['Jeffersonf', 'FisioSaaS'], odysseus: ['pewdiepie-archdaemon', 'odysseus'],
  sisteminha: ['Jeffersonf', 'sisteminha'], 'agua-poke': ['Jeffersonf', 'agua-poke'], portfolio: ['Jeffersonf', 'portfolio'],
  'cadastro-time': ['Jeffersonf', 'cadastro-nosso-time'], 'formulario-cadastro': ['Jeffersonf', 'formulario-de-cadastro'],
  'python-alura': ['Jeffersonf', 'Python-Alura'], forgottenserver: ['Jeffersonf', 'FORGOTTENSERVER-ORTS']
};

const localOnly = {
  'finanza-android': [{ date:'2026-07-19T16:26:00-03:00', message:'Adicionados testes de gestos de navegação no aplicativo.', author:'alteração local' }],
  nexttrip: [{ date:'2026-08-11T09:29:00-03:00', message:'O roadmap do aplicativo foi revisado e atualizado.', author:'alteração local' }],
  'automacao-confirmacao': [{ date:'2026-06-30T21:17:00-03:00', message:'Atualizado o ambiente local usado para executar a automação.', author:'alteração local' }],
  'robo-sam': [{ date:'2026-04-13T10:55:00-03:00', message:'Atualizado o robô de automação de equipamentos.', author:'alteração local' }]
};

const outputDir = join(process.cwd(), 'public', 'project-history');
mkdirSync(outputDir, { recursive: true });

for (const [id, [owner, repo]] of Object.entries(repositories)) {
  const raw = execFileSync('gh', ['api', '--paginate', '--slurp', `repos/${owner}/${repo}/commits?per_page=100`], { encoding:'utf8', maxBuffer: 64 * 1024 * 1024 });
  const commits = JSON.parse(raw).flat().map(item => ({
    sha: item.sha.slice(0, 7),
    date: item.commit.author?.date ?? item.commit.committer?.date,
    message: item.commit.message.split('\n')[0],
    author: item.commit.author?.name ?? item.author?.login ?? 'autor não identificado',
    url: item.html_url
  }));
  writeFileSync(join(outputDir, `${id}.json`), JSON.stringify({ id, total: commits.length, commits }, null, 2));
  console.log(`${id}: ${commits.length}`);
}

for (const [id, commits] of Object.entries(localOnly)) {
  writeFileSync(join(outputDir, `${id}.json`), JSON.stringify({ id, total: commits.length, commits }, null, 2));
  console.log(`${id}: ${commits.length} alteração local`);
}
