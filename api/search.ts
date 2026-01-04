import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Product {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  detailPageUrl: string;
}

interface RakutenItem {
  Item: {
    itemCode: string;
    itemName: string;
    itemPrice: number;
    mediumImageUrls: Array<{ imageUrl: string }>;
    itemUrl: string;
  };
}

interface RakutenResponse {
  Items?: RakutenItem[];
  error?: string;
  error_description?: string;
}

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;
const RAKUTEN_API_URL = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  let query = Array.isArray(q) ? q[0] : q;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query parameter "q" is required (min 2 characters)' });
  }

  // 楽天APIは128文字制限
  if (query.length > 128) {
    query = query.substring(0, 128);
  }

  // Check environment variables
  if (!RAKUTEN_APP_ID) {
    console.error('Missing RAKUTEN_APP_ID');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const url = `${RAKUTEN_API_URL}?applicationId=${RAKUTEN_APP_ID}&keyword=${encodeURIComponent(query)}&format=json&hits=20`;

    const response = await fetch(url);
    const data: RakutenResponse = await response.json();

    if (data.error) {
      console.error('Rakuten API error:', data.error, data.error_description);
      return res.status(500).json({
        error: 'Rakuten API error',
        message: data.error_description || data.error,
      });
    }

    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ products: [] });
    }

    const products: Product[] = data.Items.map(({ Item }) => ({
      id: Item.itemCode,
      title: Item.itemName,
      imageUrl: Item.mediumImageUrls?.[0]?.imageUrl?.replace('?_ex=128x128', '?_ex=300x300') || null,
      price: Item.itemPrice,
      detailPageUrl: Item.itemUrl,
    }));

    return res.status(200).json({ products });
  } catch (error: any) {
    console.error('Rakuten API error:', error);

    return res.status(500).json({
      error: 'Failed to search products',
      message: error.message || 'Unknown error',
    });
  }
}
