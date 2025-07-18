'use server';
/**
 * @fileOverview An AI-powered headline generation tool for marketers.
 *
 * - generateHeadline - A function that generates compelling headlines based on business values.
 * - GenerateHeadlineInput - The input type for the generateHeadline function.
 * - GenerateHeadlineOutput - The return type for the generateHeadline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHeadlineInputSchema = z.object({
  businessValues: z
    .string()
    .describe(
      'A description of the business values that should be reflected in the headline.'
    ),
});
export type GenerateHeadlineInput = z.infer<typeof GenerateHeadlineInputSchema>;

const GenerateHeadlineOutputSchema = z.object({
  headline: z.string().describe('A compelling headline for the landing page.'),
});
export type GenerateHeadlineOutput = z.infer<typeof GenerateHeadlineOutputSchema>;

export async function generateHeadline(input: GenerateHeadlineInput): Promise<GenerateHeadlineOutput> {
  return generateHeadlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHeadlinePrompt',
  input: {schema: GenerateHeadlineInputSchema},
  output: {schema: GenerateHeadlineOutputSchema},
  prompt: `You are a marketing expert specializing in creating compelling headlines for landing pages. Your goal is to create a headline that captures the essence of the business values provided.

Business Values: {{{businessValues}}}

Headline:`,
});

const generateHeadlineFlow = ai.defineFlow(
  {
    name: 'generateHeadlineFlow',
    inputSchema: GenerateHeadlineInputSchema,
    outputSchema: GenerateHeadlineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
