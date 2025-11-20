import { useEffect, useRef } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !url) return;

    // Clear previous content
    ref.current.innerHTML = '';

    // ───── Twitter / X ─────
    if (url.includes('x.com') || url.includes('twitter.com')) {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;

      const blockquote = document.createElement('blockquote');
      blockquote.className = 'twitter-tweet';
      blockquote.innerHTML = `<a href="${fullUrl}">Loading tweet...</a>`;
      ref.current.appendChild(blockquote);

      const loadTwitter = () => {
        if ((window as any).twttr?.widgets?.load) {
          (window as any).twttr.widgets.load(ref.current);
        }
      };

      // Load script once
      if (!document.getElementById('twitter-widgets')) {
        const script = document.createElement('script');
        script.id = 'twitter-widgets';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
        script.onload = loadTwitter;
        // Extra kicks for React StrictMode
        setTimeout(loadTwitter, 800);
        setTimeout(loadTwitter, 2000);
        setTimeout(loadTwitter, 4000);
      } else {
        loadTwitter();
        setTimeout(loadTwitter, 1000);
      }
      return;
    }

    // ───── Instagram ─────
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      const div = document.createElement('div');
      div.className = 'instagram-media';
      div.setAttribute('data-instgrm-permalink-url', url);
      div.innerHTML = `<a href="${url}">Loading Instagram post...</a>`;
      ref.current.appendChild(div);

      if (!document.getElementById('instagram-embed')) {
        const script = document.createElement('script');
        script.id = 'instagram-embed';
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
      return;
    }

    // ───── YouTube ─────
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
        iframe.width = '100%';
        iframe.height = '400';
        iframe.allowFullscreen = true;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.style.border = 'none';
        ref.current.appendChild(iframe);
      }
    }
  }, [url]);

  return <div ref={ref} className="my-8 rounded-lg overflow-hidden" />;
}