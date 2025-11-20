import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    twttr?: any;
    instgrm?: any;
  }
}

import { useEffect, useRef } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !url) return;

    // Clear anything old
    ref.current.innerHTML = '';

    // ——— Twitter / X ———
    if (url.includes('x.com') || url.includes('twitter.com')) {
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'twitter-tweet';
      blockquote.innerHTML = `<a href="${url}">Loading tweet...</a>`;
      ref.current.appendChild(blockquote);

      // Load Twitter script only once
      if (!document.getElementById('twitter-script')) {
        const script = document.createElement('script');
        script.id = 'twitter-script';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
      } else if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(ref.current);
      }
      return;
    }

    // ——— Instagram ———
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      const div = document.createElement('div');
      div.className = 'instagram-media';
      div.setAttribute('data-instgrm-permalink-url', url);
      div.innerHTML = `<a href="${url}">Loading Instagram post...</a>`;
      ref.current.appendChild(div);

      if (!document.getElementById('instagram-script')) {
        const script = document.createElement('script');
        script.id = 'instagram-script';
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
      return;
    }

    // ——— YouTube ———
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '400';
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.allowFullscreen = true;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        ref.current.appendChild(iframe);
      }
    }
  }, [url]);

  return <div ref={ref} className="my-6" />;
}