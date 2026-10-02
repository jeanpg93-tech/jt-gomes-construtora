import { useEffect, useState } from 'react';
import { resolveFileUrl } from '@/api/dataClient';
export default function FileImage({ src, alt, ...props }) {
  const [resolved, setResolved] = useState(src?.startsWith('storage://') ? null : src);
  useEffect(() => {
    let active = true;
    setResolved(null);
    resolveFileUrl(src).then(url => { if (active) setResolved(url); }).catch(() => { if (active) setResolved(null); });
    return () => { active = false; };
  }, [src]);
  return resolved ? <img src={resolved} alt={alt} {...props} /> : <span role="img" aria-label={alt} {...props} />;
}
