'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting tip percentages based on user location and service quality feedback.
 *
 * - suggestTipPercentage - A function that takes location and service quality as input and returns a suggested tip percentage.
 * - SuggestTipInput - The input type for the suggestTipPercentage function.
 * - SuggestTipOutput - The return type for the suggestTipPercentage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTipInputSchema = z.object({
  location: z
    .string()
    .describe('The user\u2019s current location (e.g., city, state).'),
  serviceQuality: z
    .string()
    .describe(
      'The user\u2019s feedback on the service quality (e.g., excellent, good, fair, poor).'
    ),
});
export type SuggestTipInput = z.infer<typeof SuggestTipInputSchema>;

const SuggestTipOutputSchema = z.object({
  suggestedTipPercentage: z
    .number()
    .describe('The suggested tip percentage based on location and service quality.'),
});
export type SuggestTipOutput = z.infer<typeof SuggestTipOutputSchema>;

export async function suggestTipPercentage(
  input: SuggestTipInput
): Promise<SuggestTipOutput> {
  return suggestTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTipPrompt',
  input: {schema: SuggestTipInputSchema},
  output: {schema: SuggestTipOutputSchema},
  prompt: `You are a helpful assistant designed to suggest an appropriate tip percentage based on the user's location and their feedback on the service quality.

  Location: {{{location}}}
  Service Quality: {{{serviceQuality}}}

  Consider these factors when suggesting a tip percentage:
  - Location: Tipping customs vary by location. Research the typical tipping percentage for the user's location.
  - Service Quality: Adjust the tip percentage based on the user's feedback. Excellent service should warrant a higher tip, while poor service may warrant a lower tip.

  Output only a numerical percentage, without any additional text or explanation.
  `,
});

const suggestTipFlow = ai.defineFlow(
  {
    name: 'suggestTipFlow',
    inputSchema: SuggestTipInputSchema,
    outputSchema: SuggestTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
