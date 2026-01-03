import type { VercelRequest, VercelResponse } from '@vercel/node';
import amazonPaapi from 'amazon-paapi';

interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  detailPageUrl: string;
}

const commonParameters = {
  AccessKey: process.env.AMAZON_ACCESS_KEY || '',
  SecretKey: process.env.AMAZON_SECRET_KEY || '',
  PartnerTag: process.env.AMAZON_PARTNER_TAG || '',
  PartnerType: 'Associates',
  Marketplace: 'www.amazon.co.jp',
};

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
  const query = Array.isArray(q) ? q[0] : q;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query parameter "q" is required (min 2 characters)' });
  }

  // Check environment variables
  if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY || !process.env.AMAZON_PARTNER_TAG) {
    console.error('Missing Amazon PA-API credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const requestParameters = {
      Keywords: query,
      SearchIndex: 'All',
      ItemCount: 10,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'Offers.Listings.Price',
      ],
    };

    const response = await amazonPaapi.SearchItems(commonParameters, requestParameters);

    if (!response.SearchResult?.Items) {
      return res.status(200).json({ products: [] });
    }

    const products: AmazonProduct[] = response.SearchResult.Items.map((item: any) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'タイトル不明',
      imageUrl: item.Images?.Primary?.Large?.URL || null,
      price: item.Offers?.Listings?.[0]?.Price?.Amount
        ? Math.round(item.Offers.Listings[0].Price.Amount)
        : null,
      detailPageUrl: item.DetailPageURL || `https://www.amazon.co.jp/dp/${item.ASIN}`,
    }));

    return res.status(200).json({ products });
  } catch (error: any) {
    console.error('Amazon PA-API error:', JSON.stringify(error, null, 2));

    // Handle specific PA-API errors
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    // PA-API specific error codes
    const errorCode = error.__type || error.code || '';
    if (errorCode.includes('TooManyRequests')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    if (errorCode.includes('InvalidPartnerTag') || error.message?.includes('InvalidPartnerTag')) {
      return res.status(403).json({ error: 'Invalid Partner Tag', details: 'アソシエイトタグが無効です' });
    }
    if (errorCode.includes('AccessDenied') || error.message?.includes('Forbidden')) {
      return res.status(403).json({
        error: 'PA-API Access Denied',
        details: 'PA-APIアクセスが拒否されました。アソシエイトアカウントのPA-API利用資格を確認してください。',
        hint: '日本では過去30日以内に3件以上の適格売上が必要です。'
      });
    }

    return res.status(500).json({
      error: 'Failed to search products',
      message: error.message || 'Unknown error',
      code: errorCode || undefined,
    });
  }
}
