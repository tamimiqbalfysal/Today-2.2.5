'use server';

/**
 * @fileOverview A flow to generate a daily quote using AI, matching the mood and date.
 *
 * - generateDailyQuote - A function that generates a daily quote.
 * - GenerateDailyQuoteInput - The input type for the generateDailyQuote function.
 * - GenerateDailyQuoteOutput - The return type for the generateDailyQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyQuoteInputSchema = z.object({
  date: z.string().describe('The current date (day, month, and year).'),
  mood: z.string().optional().describe('The general mood or feeling of the day.'),
});
export type GenerateDailyQuoteInput = z.infer<typeof GenerateDailyQuoteInputSchema>;

const GenerateDailyQuoteOutputSchema = z.object({
  quote: z.string().describe('A relevant quote for the day, matching the mood and date.'),
});
export type GenerateDailyQuoteOutput = z.infer<typeof GenerateDailyQuoteOutputSchema>;

export async function generateDailyQuote(input: GenerateDailyQuoteInput): Promise<GenerateDailyQuoteOutput> {
  return generateDailyQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyQuotePrompt',
  input: {schema: GenerateDailyQuoteInputSchema},
  output: {schema: GenerateDailyQuoteOutputSchema},
  prompt: `You are an AI that generates inspirational and relevant quotes for the day.

  The quote should match the current date and, if provided, the general mood of the day.

  Current Date: {{{date}}}
  Mood: {{#if mood}}{{{mood}}}{{else}}General{{/if}}

  Generate a quote that is appropriate for the current context.
  The quote should be no more than 30 words.
  `,
});

const generateDailyQuoteFlow = ai.defineFlow(
  {
    name: 'generateDailyQuoteFlow',
    inputSchema: GenerateDailyQuoteInputSchema,
    outputSchema: GenerateDailyQuoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
