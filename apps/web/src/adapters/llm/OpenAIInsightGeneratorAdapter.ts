import OpenAI from 'openai';
import { IInsightGeneratorPort, InsightGeneratorError } from '../../ports/outbound/IInsightGeneratorPort';
import { AttemptResult, Application, ApplicationInsight } from '@ceevee/types';

export class OpenAIInsightGeneratorAdapter implements IInsightGeneratorPort {
  private client: OpenAI;

  constructor() {
    // Assuming you have your OpenAI key in your environment variables
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generate(newJobDescription: string, pastApplications: Application[]): Promise<AttemptResult<InsightGeneratorError, ApplicationInsight>> {
    try {
      // Map past applications into a clean, readable string for the prompt
      const historyContext = pastApplications.map(app => 
        `- Job ID: ${app.jobId} | Status: ${app.status} | Notes: ${app.notes || 'None'}`
      ).join('\n');

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2, // Low temperature for analytical accuracy
        response_format: { type: 'json_object' }, // Force JSON output
        messages: [
          {
            role: 'system',
            content: `You are an expert career coach AI. Analyze the user's past job application outcomes and the new job description they are viewing. 
            Output JSON strictly matching this shape: 
            { 
              "positivePatterns": ["string array of what worked in similar past roles"], 
              "warnings": ["string array of red flags or patterns of rejection in similar past roles"], 
              "overallAdvice": "A short summary paragraph of strategy" 
            }.`
          },
          {
            role: 'user',
            content: `New Job Description:\n${newJobDescription}\n\nPast Similar Applications:\n${historyContext}`
          }
        ]
      });

      const insight = JSON.parse(response.choices[0].message.content || '{}') as ApplicationInsight;
      return { success: true, error: null, value: insight };

    } catch (error: any) {
      return { success: false, error: { type: 'api_error', message: error.message }, value: null };
    }
  }
}