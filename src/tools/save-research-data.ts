import { Storage } from '../utils/storage.js';
import { MCPError } from '../utils/errors.js';

export interface ResearchData {
  topic: string;
  overview: string;
  keyConcepts: Array<{ term: string; definition: string; importance: string }>;
  comparison?: {
    title: string;
    options: Array<{ name: string; pros: string[]; cons: string[]; examples: string[] }>;
  };
  bestPractices: string[];
  commonQuestions: string[];
  sources: string[];
}

export const saveResearchDataTool = async (params: {
  topic: string;
  researchData: ResearchData;
}) => {
  try {
    const { topic, researchData } = params;
    const id = topic.toLowerCase().replace(/\s+/g, '_');

    await Storage.save('research', id, researchData);

    return {
      success: true,
      id: id,
      message: `Research data for "${topic}" saved successfully`
    };
  } catch (err: any) {
    throw new MCPError('save_research_error', 'Failed to save research data', { original: err?.message });
  }
};

export type SaveResearchDataInput = { topic: string; researchData: ResearchData };
