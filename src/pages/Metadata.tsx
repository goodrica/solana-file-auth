const Metadata = () => {
  const metadata = {
    "name": "FilmAuth Token",
    "symbol": "FOT",
    "description": "FilmAuth Token (FOT) is the native utility token for the FilmAuth blockchain file authentication platform. FOT enables users to verify file authenticity with unbreakable blockchain proof using Solana technology.",
    "image": "https://filmauthtoken.com/assets/fot-logo.png",
    "external_url": "https://filmauthtoken.com",
    "attributes": [
      {
        "trait_type": "Token Type",
        "value": "Utility"
      },
      {
        "trait_type": "Blockchain",
        "value": "Solana"
      },
      {
        "trait_type": "Use Case",
        "value": "File Authentication"
      }
    ],
    "properties": {
      "files": [
        {
          "uri": "https://filmauthtoken.com/assets/fot-logo.png",
          "type": "image/png"
        }
      ],
      "category": "image"
    }
  };

  // Return JSON as text for browsers to display
  return (
    <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
};

export default Metadata;