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
    // Try multiple patterns:
    // 1. @lat,lng format (most common)
    // 2. !3d lat !4d lng format (used in some mobile links)
    // 3. query=lat,lng format
    // 4. ll=lat,lng format
    let lat: number | null = null;
    let lng: number | null = null;

    // Pattern 1: @lat,lng
    const atMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Pattern 2: !3d and !4d (Google's data format)
    if (lat === null) {
      const d3Match = resolvedUrl.match(/!3d(-?\d+\.\d+)/);
      const d4Match = resolvedUrl.match(/!4d(-?\d+\.\d+)/);
      if (d3Match && d4Match) {
        lat = parseFloat(d3Match[1]);
        lng = parseFloat(d4Match[1]);
      }
    }

    // Pattern 3: query=lat,lng or q=lat,lng
    if (lat === null) {
      const queryMatch = resolvedUrl.match(/[?&](?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (queryMatch) {
        lat = parseFloat(queryMatch[1]);
        lng = parseFloat(queryMatch[2]);
      }
    }

    // Pattern 4: ll=lat,lng
    if (lat === null) {
      const llMatch = resolvedUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (llMatch) {
        lat = parseFloat(llMatch[1]);
        lng = parseFloat(llMatch[2]);
      }
    }

    // Pattern 5: ftid format with coordinates embedded (mobile share links)
    if (lat === null) {
      const ftidMatch = resolvedUrl.match(/!8m2!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (ftidMatch) {
        lat = parseFloat(ftidMatch[1]);
        lng = parseFloat(ftidMatch[2]);
      }
    }

    // Pattern 6: data= section coordinates
    if (lat === null) {
      const dataMatch = resolvedUrl.match(/data=.*?!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/);
      if (dataMatch) {
        lat = parseFloat(dataMatch[1]);
        lng = parseFloat(dataMatch[2]);
      }
    }

    // Try to extract place name from URL
    let name = 'Custom Location';
    let address: string | undefined;

    // Pattern: /place/Name
    const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // Pattern: ?q=Name+Address (mobile share links)
    const qMatch = resolvedUrl.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      const fullPlace = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
      const parts = fullPlace.split(',');
      name = parts[0].trim();
      if (parts.length > 1) {
        address = parts.slice(1).join(',').trim();
      }
    }

    // If we still don't have coordinates, that's okay - return name/address for search
    if (lat === null || lng === null) {
      return NextResponse.json({ name, address, resolvedUrl, needsGeocode: true });
    }

    return NextResponse.json({ name, lat, lng, address, resolvedUrl });
  } catch (error) {
    console.error('Error resolving maps link:', error);
    return NextResponse.json({ error: 'Failed to resolve the link' }, { status: 500 });
  }
}
