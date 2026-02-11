import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

const IMAGE_GENERATE_URL = 'https://toolkit.rork.com/images/generate/';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80';

export const buildRecipeImagePrompt = (
  title: string,
  ingredients?: { name: string }[]
): string => {
  const ingredientList = ingredients
    ?.slice(0, 6)
    .map((i) => i.name)
    .join(', ');

  return `Professional food photography of "${title}". ${
    ingredientList ? `Key ingredients: ${ingredientList}. ` : ''
  }Beautifully plated on a ceramic dish, top-down angle, soft natural lighting, shallow depth of field, warm tones, styled with fresh herbs and garnish. Clean modern kitchen background, slightly blurred. High-end restaurant quality presentation. Photorealistic, appetizing, vibrant colors.`;
};

const saveImageToFile = async (base64Data: string, mimeType: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return `data:${mimeType};base64,${base64Data}`;
    }

    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const file = new File(Paths.document, fileName);
    file.create();
    file.write(base64Data, { encoding: 'base64' });
    console.log('[ImageGen] Saved image to:', file.uri);
    return file.uri;
  } catch (error) {
    console.log('[ImageGen] File save failed, using data URI fallback:', error);
    return `data:${mimeType};base64,${base64Data}`;
  }
};

export const generateRecipeImage = async (
  title: string,
  ingredients?: { name: string }[]
): Promise<string | null> => {
  try {
    console.log('[ImageGen] Starting generation for:', title);
    const prompt = buildRecipeImagePrompt(title, ingredients);

    console.log('[ImageGen] Calling API...');
    const response = await fetch(IMAGE_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size: '1024x1024' }),
    });

    console.log('[ImageGen] API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      console.error('[ImageGen] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[ImageGen] Response keys:', Object.keys(data));

    const base64 = data.image?.base64Data || data.image?.base64;
    const mimeType = data.image?.mimeType || 'image/png';

    if (!base64) {
      console.error('[ImageGen] No image data in response. Full response:', JSON.stringify(data).substring(0, 200));
      return null;
    }

    console.log('[ImageGen] Got base64 data, length:', base64.length, 'mimeType:', mimeType);

    const imageUri = await saveImageToFile(base64, mimeType);
    if (imageUri) {
      console.log('[ImageGen] Image ready for:', title, 'uri:', imageUri.substring(0, 80));
    }
    return imageUri;
  } catch (error) {
    console.error('[ImageGen] Generation failed for:', title, error);
    return null;
  }
};

export const getPlaceholderImage = (): string => FALLBACK_IMAGE;

export const isPlaceholderImage = (uri: string): boolean => {
  return uri.includes('unsplash.com') || uri === FALLBACK_IMAGE;
};
