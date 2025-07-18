'use server';

/**
 * @fileOverview AI-powered validation for GitHub repository URLs.
 *
 * - validateRepoUrl - A function that validates a given repository URL.
 * - ValidateRepoUrlInput - The input type for the validateRepoUrl function.
 * - ValidateRepoUrlOutput - The return type for the validateRepoUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateRepoUrlInputSchema = z.object({
  repoUrl: z.string().describe('The URL of the GitHub repository to validate.'),
});
export type ValidateRepoUrlInput = z.infer<typeof ValidateRepoUrlInputSchema>;

const ValidateRepoUrlOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the repository URL is valid, accessible, and cloneable.'),
  reason: z.string().optional().describe('The reason why the repository URL is not valid, if applicable.'),
});
export type ValidateRepoUrlOutput = z.infer<typeof ValidateRepoUrlOutputSchema>;

export async function validateRepoUrl(input: ValidateRepoUrlInput): Promise<ValidateRepoUrlOutput> {
  return validateRepoUrlFlow(input);
}

const validateRepoUrlPrompt = ai.definePrompt({
  name: 'validateRepoUrlPrompt',
  input: {schema: ValidateRepoUrlInputSchema},
  output: {schema: ValidateRepoUrlOutputSchema},
  prompt: `You are an AI assistant that validates GitHub repository URLs.

  Determine if the given repository URL is valid, accessible, and cloneable.

  If the URL is valid, set isValid to true and do not set the reason field.
  If the URL is not valid, set isValid to false and provide a reason in the reason field.

  Repository URL: {{{repoUrl}}}`,
});

const validateRepoUrlFlow = ai.defineFlow(
  {
    name: 'validateRepoUrlFlow',
    inputSchema: ValidateRepoUrlInputSchema,
    outputSchema: ValidateRepoUrlOutputSchema,
  },
  async input => {
    const {output} = await validateRepoUrlPrompt(input);
    return output!;
  }
);
