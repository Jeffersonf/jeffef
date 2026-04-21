import { defineCollection, z } from 'astro:content';

const notas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    kind: z.enum(['diario', 'trabalho', 'leitura', 'movimento', 'foto', 'ideia']).default('diario'),
    place: z.string().optional(),
    tags: z.array(z.string()).default([]),
    photo: z.string().optional(),
    photoAlt: z.string().optional(),
    draft: z.boolean().default(false)
  })
});

const site = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    eyebrow: z.string().optional(),
    heroTitle: z.string().optional(),
    heroLead: z.string().optional(),
    heroNote: z.string().optional(),
    chips: z.array(z.object({
      label: z.string(),
      color: z.enum(['blue', 'green', 'rose', 'gold', 'sky']).default('blue')
    })).default([]),
    sections: z.record(z.any()).optional(),
    closing: z.string().optional(),
    cards: z.array(z.object({
      label: z.string(),
      title: z.string(),
      body: z.string().optional(),
      highlight: z.boolean().default(false)
    })).default([])
  })
});

export const collections = { notas, site };
