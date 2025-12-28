import { GoogleGenAI, Chat, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";

class GeminiService {
  private chat: Chat | null = null;
  // Using Flash model for speed and free tier compatibility
  private modelId = 'gemini-3-flash-preview';
  // Switched to Nano Banana (2.5 Flash Image) for free tier support
  private imageModelId = 'gemini-2.5-flash-image';

  private getAi() {
    const apiKey = process.env.API_KEY;
    // Fallback or error logging is handled by the SDK or the UI check in App.tsx
    return new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }

  public getModelVersion(): string {
    return this.modelId;
  }

  public resetChat() {
    this.chat = null;
  }

  private initChat() {
    if (!this.chat) {
      const openWebsiteTool: FunctionDeclaration = {
        name: "openWebsite",
        description: "Opens a website URL in a new tab. Use this when the user asks to open a specific website or link.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: "The full URL to open (e.g., https://www.google.com). Infer the URL if the user mentions a common service.",
            },
          },
          required: ["url"],
        },
      };

      const ai = this.getAi();
      this.chat = ai.chats.create({
        model: this.modelId,
        config: {
          systemInstruction: "You are Nexus, an advanced AI chatbot powered by Gemini 3 Flash. You are helpful, creative, and precise. You can help with writing, analysis, coding, and general questions. You also have tools to open websites if requested. Keep responses formatted nicely in Markdown. CRITICAL: Do NOT use Markdown code blocks (triple backticks) for mathematical equations, formulas, or expressions. Use plain text with Unicode symbols (e.g. θ, π, √, ∫, ∑) or standard mathematical notation inline. Only use code blocks for executable programming code (Python, JS, C++, etc.).",
          tools: [{ functionDeclarations: [openWebsiteTool] }],
        },
      });
    }
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    this.initChat();
    
    if (!this.chat) {
      throw new Error("Failed to initialize chat.");
    }

    try {
      // Initial request with the user message
      let result = await this.chat.sendMessageStream({ message });
      
      while (true) {
        const functionCalls: any[] = [];
        
        for await (const chunk of result) {
          const responseChunk = chunk as GenerateContentResponse;
          
          // Yield text if present (model might explain what it's doing)
          if (responseChunk.text) {
            yield responseChunk.text;
          }
          
          // Collect function calls from the chunk
          if (responseChunk.functionCalls) {
            functionCalls.push(...responseChunk.functionCalls);
          }
        }
        
        // If no function calls were made, the turn is complete
        if (functionCalls.length === 0) {
          break;
        }
        
        // Execute function calls and prepare responses
        const functionResponses = functionCalls.map(call => {
          if (call.name === 'openWebsite') {
             const url = call.args.url;
             let status = "success";
             try {
                if (typeof window !== 'undefined') {
                    // Ensure protocol is present
                    let validUrl = url;
                    if (!/^https?:\/\//i.test(validUrl)) {
                        validUrl = 'https://' + validUrl;
                    }
                    console.log(`AI opening: ${validUrl}`);
                    window.open(validUrl, '_blank');
                }
             } catch (e) {
                console.error("Failed to open URL", e);
                status = "failed: " + e;
             }
             
             return {
                functionResponse: {
                    name: 'openWebsite',
                    id: call.id,
                    response: { result: status }
                }
             };
          }
          
          // Handle unknown functions
          return {
             functionResponse: {
                 name: call.name,
                 id: call.id,
                 response: { result: "Unknown function" }
             }
          };
        });
        
        // Send the execution results back to the model to continue the conversation
        // The model will likely respond with a confirmation message
        result = await this.chat.sendMessageStream({ message: functionResponses });
      }

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  /**
   * specialized method for AI Workspace Curation.
   */
  public async generateSmartShortcuts(existingTitles: string[], userPrompt?: string): Promise<any[]> {
    try {
      let prompt = `The user currently has these apps on their dashboard: ${existingTitles.join(', ')}. `;
      
      if (userPrompt && userPrompt.trim().length > 0) {
        prompt += `The user specifically asked for tools related to: "${userPrompt}". 
                   Ignore the previous persona if it conflicts. Focus entirely on providing the best web apps for "${userPrompt}". `;
      } else {
        prompt += `Identify the user's persona (e.g., developer, designer, casual, news reader). 
                   Based on this, suggest exactly 3 NEW, DIFFERENT, high-utility web apps they are likely to use. `;
      }

      prompt += `Do not suggest apps they already have. Return exactly 3 suggestions.`;

      const ai = this.getAi();
      // Using gemini-3-flash-preview for speed and efficiency
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                color: { type: Type.STRING, description: "A hex color code matching the brand" },
                reason: { type: Type.STRING, description: "Short reason why this was suggested" }
              },
              required: ["title", "url", "color"]
            }
          }
        }
      });

      const jsonText = response.text || "[]";
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Smart Shortcut Generation Error:", error);
      return [];
    }
  }

  /**
   * Specialized method for Map/Location queries using gemini-2.5-flash
   */
  public async getMapInfo(prompt: string, latitude: number, longitude: number) {
    try {
      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert navigation assistant. When the user asks for locations, provide ratings, distance, and type. When asked for a route or directions, you MUST calculate and provide the following details at the very top of your response in this exact format:\n|DISTANCE: [value]|DURATION: [value]|TRAFFIC: [value]|\n\nThen provide the step-by-step directions or route summary below. Use the Google Maps tool to verify.",
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: latitude,
                longitude: longitude
              }
            }
          }
        },
      });
      
      return {
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (error) {
      console.error("Map Gen Error:", error);
      throw error;
    }
  }

  /**
   * Edit image using gemini-2.5-flash-image (Nano Banana)
   */
  public async editImage(imageBase64: string, mimeType: string, prompt: string): Promise<string | null> {
    try {
      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: this.imageModelId,
        contents: {
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        // Removed imageConfig (imageSize/aspectRatio) as it is not supported in Flash Image models
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Image Edit Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();