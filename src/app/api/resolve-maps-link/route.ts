import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Only allow Google Maps short links
    if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
      return NextResponse.json({ error: 'Only Google Maps short links are supported' }, { status: 400 });
    }

    // Follow the redirect to get the full URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });

    const resolvedUrl = response.url;

    // Extract coordinates from the resolved URL
    const pathMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (!pathMatch) {
      return NextResponse.json({
        error: 'Could not find coordinates in the resolved URL',
        resolvedUrl
      }, { status: 400 });
    }

    const lat = parseFloat(pathMatch[1]);
    const lng = parseFloat(pathMatch[2]);

    // Try to extract place name from URL
    const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/);
    let name = 'Custom Location';
    if (placeMatch) {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    return NextResponse.json({ name, lat, lng, resolvedUrl });
  } catch (error) {
    console.error('Error resolving maps link:', error);
    return NextResponse.json({ error: 'Failed to resolve the link' }, { status: 500 });
  }
}
