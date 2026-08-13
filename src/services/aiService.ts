import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '';
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!API_KEY) {
  console.warn('LLM_API_KEY is not set — GoogleGenerativeAI client may fail to authenticate.');
}

const genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY!);

export async function summarizeText(text: string): Promise<string> {
  if (!text) throw new Error('Texto para resumo não fornecido');

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    // As requested, call generateContent directly with the raw text input
    let result: any;
    try {
      result = await model.generateContent(text);
    } catch (innerErr: any) {
      // If the model is not found or not supported, try to discover available models
      const innerMsg = innerErr?.message || String(innerErr);
      console.warn('generateContent failed, attempting model discovery');
      if (innerMsg.includes('Call ModelService.ListModels') || innerMsg.includes('not found')) {
        try {
          // First try to list models via SDK dynamic methods
          let listResp: any = null;
          try {
            const client: any = genAI as any;
            if (typeof client.listModels === 'function') listResp = await client.listModels();
            else if (client.modelService && typeof client.modelService.listModels === 'function') listResp = await client.modelService.listModels();
            else if (typeof client.getModels === 'function') listResp = await client.getModels();
          } catch (sdkListErr) {
            console.warn('SDK listModels attempt failed:', sdkListErr);
          }

          let models = listResp?.models || listResp?.model || listResp || [];

          // If SDK didn't return models, try REST API listModels
          if ((!models || (Array.isArray(models) && models.length === 0)) && API_KEY) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
              const resp = await fetch(url);
              const json = await resp.json();
              models = json?.models || json || [];
            } catch (restErr) {
              console.warn('REST listModels attempt failed:', restErr);
            }
          }

          // Prefer a model that mentions 'gemini' and supports generateContent or generative methods
          let candidate: any = null;
          if (Array.isArray(models) && models.length > 0) {
            candidate = models.find((m: any) => {
              const name = String(m.name || m.model || m.id || m).toLowerCase();
              const methods = m.supportedMethods || m.methods || m.supported_features || [];
              const supports = Array.isArray(methods) ? methods.join(' ').toLowerCase() : String(methods).toLowerCase();
              return name.includes('gemini') && (supports.includes('generate') || supports.includes('generatecontent'));
            });
            if (!candidate) {
              candidate = models.find((m: any) => String(m.name || m.model || m.id || '').toLowerCase().includes('gemini')) || models[0];
            }
          }

          if (candidate) {
            const candidateName = candidate.name || candidate.model || candidate.id || candidate;
            const model2 = genAI.getGenerativeModel({ model: candidateName });
            result = await model2.generateContent(text);
          } else {
            throw innerErr;
          }
        } catch (listErr: any) {
          console.warn('Failed to list or use discovered models');
          throw innerErr;
        }
      } else {
        throw innerErr;
      }
    }

    // Parse result for common SDK shapes
    // The SDK might return an object with `output`, `candidates` or `content` fields.
    let summary: string | undefined;

    if (result?.content) summary = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    else if (result?.output?.[0]?.content) {
      const c = result.output[0].content;
      if (Array.isArray(c)) summary = c.map((it: any) => it.text || it).join('\n');
      else summary = String(c);
    } else if (result?.candidates?.[0]?.content) summary = result.candidates[0].content;
    else if (result?.candidates?.[0]?.output) summary = result.candidates[0].output;
    else if (result?.generations?.[0]?.text) summary = result.generations[0].text;
    // Handle nested responses (some SDK versions wrap under `response`)
    else if (result?.response?.candidates?.[0]?.content?.parts) {
      const parts = result.response.candidates[0].content.parts;
      if (Array.isArray(parts)) summary = parts.map((p: any) => p.text || p).join('\n');
      else summary = String(parts);
    } else if (result?.response?.candidates?.[0]?.content?.text) {
      summary = result.response.candidates[0].content.text;
    } else if (result?.response?.candidates?.[0]?.content) {
      summary = typeof result.response.candidates[0].content === 'string'
        ? result.response.candidates[0].content
        : JSON.stringify(result.response.candidates[0].content);
    }

    if (!summary) throw new Error(`Resposta da Gemini inválida: ${JSON.stringify(result)}`);

    return summary.trim();
  } catch (err: any) {
    const message = err?.response?.data || err.message || String(err);
    throw new Error(`Falha ao obter resumo da Gemini: ${message}`);
  }
}

export default { summarizeText };
