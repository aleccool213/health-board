import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const weeks = defineCollection({
  loader: glob({ base: './src/content/weeks', pattern: '**/*.md' }),
  schema: z.object({
    week: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date(),
    days: z.number(),
    steps_avg: z.number(),
    sleep_hours_avg: z.number().nullable(),
    resting_hr_avg: z.number(),
    hrv_avg: z.number(),
    exercise_min_total: z.number(),
    workouts: z.number(),
    active_kcal_total: z.number(),
    partial: z.boolean().default(false),
  }),
});

export const collections = { weeks };
