export default {
  async fetch(request) {
    const sources = [
      'https://raw.githubusercontent.com/V2RAYCONFIGSPOOL/V2RAY_SUB/refs/heads/main/v2ray_configs_no10.txt',
      'https://raw.githubusercontent.com/V2RAYCONFIGSPOOL/V2RAY_SUB/refs/heads/main/v2ray_configs_no2.txt'
    ];

    const uniqueNodes = new Set();

    for (const url of sources) {
      try {
        const response = await fetch(url, { 
          redirect: 'follow',
          cf: { cacheTtl: 600 },  // 10 min cache to reduce load
        });

        if (!response.ok) continue;

        const text = await response.text();
        const lines = text.split('\n')
          .map(line => line.trim())
          .filter(line => line && (
            line.startsWith('vmess://') ||
            line.startsWith('vless://') ||
            line.startsWith('ss://')    ||
            line.startsWith('trojan://')
          ));

        lines.forEach(node => uniqueNodes.add(node));
      } catch (err) {
        console.error(`Source failed ${url}: ${err.message}`);
      }
    }

    const nodeList = Array.from(uniqueNodes).join('\n');

    // Safe UTF-8 to base64 function (this fixes the Latin1 error)
    function utf8ToBase64(str) {
      // encodeURIComponent → %XX → bytes → binary string → btoa
      return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
          (_, p1) => String.fromCharCode('0x' + p1)
        )
      );
    }

    let base64Subscription = '';
    try {
      base64Subscription = utf8ToBase64(nodeList);
    } catch (err) {
      console.error('Base64 encoding still failed:', err.message);
      base64Subscription = 'Encoding failed - likely very broken characters in sources. Try with fewer sources.';
    }

    return new Response(base64Subscription, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
