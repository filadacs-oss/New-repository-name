import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function categorizeEmail(subject: string, content: string): Promise<'Work' | 'Personal' | 'Promotions' | 'Social' | 'Other'> {
  const model = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Categorize the following email into one of these categories: Work, Personal, Promotions, Social, Other. 
      Base the categorization on the context and intent of the email.
      
      Examples:
      - Meeting, deadline, project, invoice -> Work
      - Family, friends, plans, hobbies -> Personal
      - Sales, offers, newsletters, discounts -> Promotions
      - Facebook, LinkedIn, notifications from social platforms -> Social
      - Everything else -> Other

      Subject: ${subject}
      Content: ${content}`,
      config: {
        systemInstruction: "You are an expert email organizer. Return ONLY the category name: Work, Personal, Promotions, Social, or Other. Do not include any other text."
      }
    });
    const category = response.text?.trim() as any;
    const validCategories = ['Work', 'Personal', 'Promotions', 'Social', 'Other'];
    return validCategories.includes(category) ? category : 'Other';
  } catch (error: any) {
    console.error("Categorization API Error:", error);
    return 'Other';
  }
}
