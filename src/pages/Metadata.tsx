import { useEffect } from 'react';

const Metadata = () => {
  const metadata = {
    "name": "FilmAuth Token",
    "symbol": "FOT", 
    "description": "FilmAuth Token (FOT) is the native utility token for the FilmAuth blockchain file authentication platform. FOT enables users to verify file authenticity with unbreakable blockchain proof using Solana technology.",
    "image": "https://filmauth.lovable.app/assets/fot-logo.png",
    "external_url": "https://filmauth.lovable.app",
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
          "uri": "https://filmauth.lovable.app/assets/fot-logo.png",
          "type": "image/png"
        }
      ],
      "category": "image"
    }
  };

  useEffect(() => {
    // Set content type for proper JSON response
    if (typeof document !== 'undefined') {
      const metaContentType = document.createElement('meta');
      metaContentType.setAttribute('http-equiv', 'Content-Type');
      metaContentType.setAttribute('content', 'application/json');
      document.head.appendChild(metaContentType);
    }
  }, []);

  // Return raw JSON string without HTML wrapper
  return (
    <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, padding: 0 }}>
      {JSON.stringify(metadata, null, 2)}
    </div>
  );
};

export default Metadata;