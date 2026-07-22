export default async function handler(req, res) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/certs');
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json(data);
  } catch (error) {
    console.error('Failed to fetch Google certs:', error);
    res.status(502).json({ error: 'Failed to fetch Google certs' });
  }
}
