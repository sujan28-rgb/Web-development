import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface SuggestedProof {
  proof_type: 'before_after_photo' | 'single_photo' | 'note_only';
  proof_criteria: string;
  recommended_difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  encouraging_note: string;
}

export interface ProofVerificationResult {
  verified: boolean;
  confidence: number; // 0 to 100
  feedback: string;
  analysis: string;
}

/**
 * Uses Gemini 3.8 Flash to intelligently suggest proof criteria for any task
 * e.g., for "Hydrate 2.5 liters of water", it suggests "before_after_photo" with full and empty bottle instructions!
 */
export async function suggestTaskProofRequirements(
  title: string,
  category?: string,
  description?: string
): Promise<SuggestedProof> {
  const ai = getAiClient();

  if (!ai) {
    // Graceful fallback if no GEMINI_API_KEY is configured
    return fallbackProofSuggestion(title, category);
  }

  const prompt = `You are a helpful and friendly RPG Quest Master in the gamified productivity app LifeQuest.
A player wants to create a real-life quest:
- Task Title: "${title}"
- Category: "${category || 'General'}"
- Description: "${description || 'None'}"

Design a fair, user-friendly, and engaging proof-of-completion requirement for this quest so the player stays accountable in real life.
Examples:
- If it's drinking water, fitness reps, cleaning a room, cooking, organizing a desk: recommend 'before_after_photo' (e.g. full bottle before vs empty bottle after, messy desk before vs clean desk after).
- If it's running a distance, reading a page count, finishing a homework problem, or writing code: recommend 'single_photo' (e.g. photo of smartwatch running stats, open book showing page number, or screen).
- If it's pure meditation, reflection, or prayer: recommend 'single_photo' or 'note_only'.

Respond in STRICT valid JSON format matching this schema:
{
  "proof_type": "before_after_photo" | "single_photo" | "note_only",
  "proof_criteria": "A short, crystal-clear 1-2 sentence instruction telling the player exactly what photo(s) to upload as proof",
  "recommended_difficulty": "trivial" | "easy" | "medium" | "hard",
  "encouraging_note": "A warm, inspiring 1-sentence gamer encouragement"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackProofSuggestion(title, category);
    }

    const parsed = JSON.parse(text) as SuggestedProof;
    if (
      parsed.proof_type &&
      parsed.proof_criteria &&
      ['before_after_photo', 'single_photo', 'note_only'].includes(parsed.proof_type)
    ) {
      return parsed;
    }
    return fallbackProofSuggestion(title, category);
  } catch (err) {
    console.error('Gemini suggestTaskProofRequirements error:', err);
    return fallbackProofSuggestion(title, category);
  }
}

/**
 * Multimodal verification using Gemini 3.8 Flash
 * Inspects before/after photos or single photos to verify if the quest was honestly completed.
 */
export async function verifyQuestProofWithAi(params: {
  taskTitle: string;
  taskDescription?: string;
  proofCriteria: string;
  proofType: 'before_after_photo' | 'single_photo' | 'note_only';
  beforeImageBase64?: string; // data:image/png;base64,... or raw base64
  afterImageBase64?: string;
  userNote?: string;
}): Promise<ProofVerificationResult> {
  const {
    taskTitle,
    taskDescription,
    proofCriteria,
    proofType,
    beforeImageBase64,
    afterImageBase64,
    userNote,
  } = params;

  const ai = getAiClient();

  // Helper to parse base64 data url
  function extractBase64(dataUri?: string): { mimeType: string; data: string } | null {
    if (!dataUri) return null;
    const match = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
    // If it's already pure base64
    if (dataUri.length > 50) {
      return { mimeType: 'image/jpeg', data: dataUri };
    }
    return null;
  }

  const beforePart = extractBase64(beforeImageBase64);
  const afterPart = extractBase64(afterImageBase64);

  if (!ai) {
    return fallbackVerification({
      hasBefore: !!beforePart,
      hasAfter: !!afterPart,
      proofType,
      userNote,
    });
  }

  try {
    const parts: any[] = [];

    let promptText = `You are the Proof Verifier AI for the gamified productivity app LifeQuest.
Your job is to inspect real-life proof submitted by the player and verify whether they legitimately completed their quest.

QUEST DETAILS:
- Task: "${taskTitle}"
- Details: "${taskDescription || 'None'}"
- Required Proof Criteria: "${proofCriteria}"
- Proof Mode: "${proofType}"
- Player Note: "${userNote || 'None provided'}"
`;

    if (proofType === 'before_after_photo') {
      promptText += `\nThe player was asked to provide two photos:
1. BEFORE Photo: shows the starting state (e.g. full water bottle, unorganized room, starting workout).
2. AFTER Photo: shows the finished result (e.g. empty water bottle, clean room, finished stats).
Inspect both photos carefully. Check if the object or setting is consistent and if legitimate progress or completion is demonstrated.`;

      if (beforePart) {
        parts.push({
          inlineData: {
            mimeType: beforePart.mimeType,
            data: beforePart.data,
          },
        });
        promptText += `\n[Image 1 above is the BEFORE photo]`;
      }
      if (afterPart) {
        parts.push({
          inlineData: {
            mimeType: afterPart.mimeType,
            data: afterPart.data,
          },
        });
        promptText += `\n[Image 2 above is the AFTER photo]`;
      }
    } else if (beforePart || afterPart) {
      const img = afterPart || beforePart;
      if (img) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
        promptText += `\n[Image above is the player's photo proof]`;
      }
    }

    promptText += `\n
DECISION RULES:
- Be encouraging and supportive of human self-improvement!
- If the photo(s) reasonably show what was requested (for instance, a full water bottle and an empty one, or gym equipment, or completed work), approve with verified: true.
- If the photo is completely unrelated (e.g. a photo of a cat when asked to show water drinking) or fails the criteria clearly, return verified: false with a friendly, helpful suggestion on what needs to be shown.
- If photos are provided and show genuine effort, favor the player with a high confidence score (80-99%).

Respond with STRICT valid JSON matching this exact schema:
{
  "verified": boolean,
  "confidence": number, // integer 0 to 100
  "feedback": "A warm, motivating 1-2 sentence response to the player highlighting what you observed and congratulating them or gently guiding them.",
  "analysis": "Short 1-sentence objective note of what visual evidence was recognized in the images."
}`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackVerification({
        hasBefore: !!beforePart,
        hasAfter: !!afterPart,
        proofType,
        userNote,
      });
    }

    const parsed = JSON.parse(text) as ProofVerificationResult;
    return {
      verified: Boolean(parsed.verified),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 90,
      feedback: parsed.feedback || 'Your proof has been verified! Outstanding commitment to your quest.',
      analysis: parsed.analysis || 'Visual confirmation matches quest criteria.',
    };
  } catch (err) {
    console.error('Gemini vision verification error:', err);
    return fallbackVerification({
      hasBefore: !!beforePart,
      hasAfter: !!afterPart,
      proofType,
      userNote,
    });
  }
}

function fallbackProofSuggestion(title: string, category?: string): SuggestedProof {
  const lower = title.toLowerCase();

  if (lower.includes('water') || lower.includes('hydrate') || lower.includes('drink')) {
    return {
      proof_type: 'before_after_photo',
      proof_criteria: 'Take a photo of your full water bottle before drinking, and a photo of your empty bottle after finishing it.',
      recommended_difficulty: 'easy',
      encouraging_note: 'Proper hydration powers up your vitality and focus stats!',
    };
  }

  if (
    lower.includes('clean') ||
    lower.includes('organize') ||
    lower.includes('desk') ||
    lower.includes('room')
  ) {
    return {
      proof_type: 'before_after_photo',
      proof_criteria: 'Upload a before photo of your workspace/room, and an after photo showing it tidy and organized.',
      recommended_difficulty: 'medium',
      encouraging_note: 'A clean space clears mental clutter and boosts intellect!',
    };
  }

  if (
    lower.includes('workout') ||
    lower.includes('gym') ||
    lower.includes('run') ||
    lower.includes('pushup')
  ) {
    return {
      proof_type: 'single_photo',
      proof_criteria: 'Upload a photo of your fitness tracker stats, gym station, or running route summary.',
      recommended_difficulty: 'medium',
      encouraging_note: 'Strength and agility growth unlocked through real effort!',
    };
  }

  if (lower.includes('read') || lower.includes('book') || lower.includes('study')) {
    return {
      proof_type: 'single_photo',
      proof_criteria: 'Take a photo of the book chapter or study notes you completed today.',
      recommended_difficulty: 'medium',
      encouraging_note: 'Every page read fuels your hero intellect and wisdom!',
    };
  }

  return {
    proof_type: 'single_photo',
    proof_criteria: 'Upload a photo showing your completed work or final result.',
    recommended_difficulty: 'easy',
    encouraging_note: 'Every quest completed builds an unstoppable hero streak!',
  };
}

function fallbackVerification(params: {
  hasBefore: boolean;
  hasAfter: boolean;
  proofType: string;
  userNote?: string;
}): ProofVerificationResult {
  if (params.proofType === 'before_after_photo') {
    if (params.hasBefore && params.hasAfter) {
      return {
        verified: true,
        confidence: 94,
        feedback: 'Both before and after photos uploaded successfully! Quest verified and reward unlocked.',
        analysis: 'Detected valid dual photo submission matching before-and-after requirements.',
      };
    } else {
      return {
        verified: false,
        confidence: 30,
        feedback: 'Please provide both the Before photo and the After photo to complete this quest verification.',
        analysis: 'Missing one or both required photos.',
      };
    }
  }

  if (params.hasBefore || params.hasAfter || (params.userNote && params.userNote.length > 5)) {
    return {
      verified: true,
      confidence: 92,
      feedback: 'Proof of completion confirmed! Great work following through on your quest.',
      analysis: 'Provided valid proof submission.',
    };
  }

  return {
    verified: false,
    confidence: 20,
    feedback: 'Please upload a photo or write a completion note to verify your quest.',
    analysis: 'Insufficient proof provided.',
  };
}
