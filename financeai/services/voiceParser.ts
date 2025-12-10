
import { CATEGORIES, ACCOUNT_TYPES } from '../types';

interface ParsedTransaction {
  amount?: number;
  category?: string;
  description?: string;
  type?: string;
  transcript?: string;
}

interface ParsedAccount {
  name?: string;
  type?: string;
  initialBalance?: number;
  transcript?: string;
}

const getGeminiModule = async () => {
  try {
    // @ts-ignore
    const module = await import("https://esm.sh/@google/genai");
    return module;
  } catch (error) {
    console.error("Failed to load Gemini SDK:", error);
    throw new Error("Could not load AI library.");
  }
};

const getApiKey = () => {
  const apiKey = (window as any).process?.env?.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return null;
  }
  return apiKey;
};

export const processVoiceInput = async (base64Audio: string, mimeType: string): Promise<ParsedTransaction> => {
  const apiKey = getApiKey();
  if (!apiKey) return { transcript: "API Key missing. Voice processing disabled." };

  try {
    const { GoogleGenAI, Type } = await getGeminiModule();
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    const prompt = `
      Listen to this audio. The user is describing a financial transaction.
      
      Tasks:
      1. Transcribe the audio exactly.
      2. Extract the transaction details.
      3. Perform any math described (e.g., "spent 90 dollars split 3 ways" -> amount is 30).
      4. Infer the best category from this list: ${CATEGORIES.join(', ')}. If unsure, use 'Other'.
      5. Determine if it is an 'income' (received money) or 'expense' (spent money). Default to 'expense'.
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Audio } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["income", "expense", "transfer"] }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { transcript: "No response from AI." };
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini processing error:", error);
    return { transcript: "Error processing audio with AI." };
  }
};

export const processVoiceAccountInput = async (base64Audio: string, mimeType: string): Promise<ParsedAccount> => {
  const apiKey = getApiKey();
  if (!apiKey) return { transcript: "API Key missing." };

  try {
    const { GoogleGenAI, Type } = await getGeminiModule();
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    const prompt = `
      Listen to this audio. The user is describing a financial account to add.
      
      Tasks:
      1. Transcribe the audio.
      2. Extract the Account Name (e.g., "Chase Sapphire", "Emergency Fund").
      3. Extract the Initial Balance/Amount.
      4. Infer the Account Type from this list: ${ACCOUNT_TYPES.join(', ')}. 
         - "Bank", "Checking" -> Checking
         - "Savings" -> Savings
         - "Card", "Visa", "Amex" -> Credit Card
         - "Loan", "Mortgage" -> Loan
         - "Stocks", "401k" -> Investment
         - "Wallet", "Pocket" -> Cash
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Audio } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            name: { type: Type.STRING },
            initialBalance: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ACCOUNT_TYPES }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { transcript: "No response from AI." };
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini processing error:", error);
    return { transcript: "Error processing audio with AI." };
  }
};
