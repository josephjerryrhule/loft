export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If the request is for the root or index.html, serve the Heyzine flipbook HTML
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const targetUrl = 'https://heyzine.com/flip-book/6ffda81bd4.html';
      
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
          'Accept': request.headers.get('Accept') || '*/*',
          'Accept-Language': request.headers.get('Accept-Language') || ''
        }
      });

      if (!response.ok) {
        return new Response(`Error fetching flipbook: ${response.statusText}`, { status: response.status });
      }

      // Read the HTML content
      let html = await response.text();

      // Replace Heyzine references with our custom domain for canonical URL, OG tags, etc.
      html = html.replaceAll('https://heyzine.com/flip-book/6ffda81bd4.html', `https://${url.host}/`);
      html = html.replaceAll('https://landoffairytales.aflip.in/6ffda81bd4.html', `https://${url.host}/`);
      
      // Handle backslash-escaped URLs in the JSON metadata config
      html = html.replaceAll('https:\\/\\/heyzine.com\\/flip-book\\/6ffda81bd4.html', `https:\\/\\/${url.host}`);
      html = html.replaceAll('https:\\/\\/landoffairytales.aflip.in', `https:\\/\\/${url.host}`);

      // Override SEO Title and Description
      html = html.replaceAll('Our Preposition', 'Land of Fairy Tales - Schools Proposal');
      html = html.replaceAll('Created with the Heyzine flipbook maker', 'LOFT is a confidence-building ecosystem powered by stories, communication, imagination, culture, and emotional development.');


      // Serve the modified HTML response
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // For any other path, proxy the request directly to heyzine.com
    const targetUrl = new URL(url.pathname + url.search, 'https://heyzine.com');
    
    // Copy headers and override Host and Origin to match target
    const headers = new Headers(request.headers);
    headers.set('Host', 'heyzine.com');
    headers.set('Origin', 'https://heyzine.com');
    if (headers.has('Referer')) {
      headers.set('Referer', 'https://heyzine.com/');
    }

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'manual'
    });

    try {
      const response = await fetch(proxyRequest);
      
      // Copy the response headers, adding CORS headers if necessary
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 502 });
    }
  }
};
