import { getCollection } from 'astro:content';

export async function getPublishedNotas() {
  const notas = await getCollection('notas', ({ data }) => !data.draft);
  return notas.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function dateParts(date: Date) {
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    timeZone: 'UTC'
  }).format(date);
  const month = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    timeZone: 'UTC'
  }).format(date).replace('.', '');
  const year = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);

  return { day, month, year };
}

export function noteSlug(id: string) {
  return id.replace(/\.md$/, '');
}

export function accentForKind(kind: string) {
  return kind === 'trabalho' ? 'green' :
    kind === 'movimento' ? 'rose' :
    kind === 'leitura' ? 'gold' :
    kind === 'foto' ? 'sky' :
    'blue';
}

export function resolveAssetPath(path?: string) {
  if (!path) return undefined;

  if (/^https?:\/\//i.test(path)) return path;
  if (/^\/jeffef\//i.test(path)) return path;

  const normalized = path
    .replace(/^public[\\/]/i, '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  return `/jeffef/${normalized}`;
}
