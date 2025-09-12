// This is a Vercel Serverless Function that acts as a proxy to the Origami API.
// It bypasses client-side CORS issues and keeps API credentials secure on the server.

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    // Get the body from the client request (e.g., { entity_data_name: 'clients' })
    const clientRequestBody = await request.json();

    const origamiApiUrl = 'https://mganim.origami.ms/entities/api/instance_data/format/json';
    // These environment variables must be set in Vercel, NOT prefixed with VITE_.
    const origamiUsername = process.env.ORIGAMI_USERNAME;
    const origamiApiSecret = process.env.ORIGAMI_API_SECRET;

    if (!origamiUsername || !origamiApiSecret) {
      console.error('Origami API credentials are not set on the server.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construct the body for the real Origami API request
    const origamiRequestBody = {
      ...clientRequestBody, // Pass through params from the client
      username: origamiUsername,
      api_secret: origamiApiSecret,
    };

    const origamiResponse = await fetch(origamiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(origamiRequestBody),
    });

    if (!origamiResponse.ok) {
        const errorText = await origamiResponse.text();
        console.error(`Origami API error: ${origamiResponse.status}`, errorText);
        return new Response(JSON.stringify({ error: `שגיאה בגישה ל-API החיצוני: ${origamiResponse.status}` }), {
            status: origamiResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const data = await origamiResponse.json();

    // Return the successful response from Origami back to the client
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Add caching to improve performance and reduce API calls
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error('Proxy internal error:', error);
    return new Response(JSON.stringify({ error: 'An internal proxy error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
