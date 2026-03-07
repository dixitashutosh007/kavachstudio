import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: '50mb' }));

// Health check route for AWS App Runner
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API endpoint for AI Image Enhancement
app.post('/api/enhance-image', async (req, res) => {
  const { image, stylePrompt, styleLabel } = req.body;
  
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set on the server');
    return res.status(500).json({ error: 'AI configuration error on server' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1] || 'image/png';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `TASK: EDIT THIS IMAGE.
STYLE: ${styleLabel} - ${stylePrompt}
INSTRUCTIONS: 
1. Apply the specified style to the player in the image.
2. CRITICAL: Frame the player so their face is the central focus. The image should be a professional "head and shoulders" or "waist up" portrait. If the original image is too far away, zoom in and crop to ensure the face is clearly visible and occupies a significant portion of the frame.
3. Enhance the colors, contrast, and vibrancy to make it look like a high-end sports broadcast graphic.
4. DO NOT distort the face of the player. Keep the facial features recognizable and clear.
5. If the style is 'Cricket Ground', replace the background with a professional cricket stadium.
6. If the style is 'Blurred Background', apply a cinematic bokeh effect.
7. Return ONLY the edited image in the response.`,
          },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from AI");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return res.json({ 
          image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` 
        });
      }
    }

    throw new Error("AI returned text instead of an image");
  } catch (error: any) {
    console.error('AI Enhancement Error:', error);
    res.status(500).json({ error: error.message || 'AI enhancement failed' });
  }
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
