import { useEffect, useRef } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !url) return;

    // Clean the container
    ref.current.innerHTML = '';

    // Twitter / X — FIXED VERSION
    if (url.includes('x.com') || url.includes('twitter.com')) {
      // Make sure URL has https://
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;

      const blockquote = document.createElement('blockquote');
      blockquote.className = 'twitter-tweet';
      blockquote.innerHTML = `<p lang="en" dir="ltr"></p><a href="${fullUrl}"></a>`;
      ref.current!.appendChild(blockquote);

      // Load Twitter script once
      if (!document.getElementById('twitter-widgets')) {
        const script = document.createElement('script');
        script.id = 'twitter-widgets';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);

        // Force load once script is ready
        script.onload = () => {
          if ((window as any).twttr?.widgets) {
            (window as any).twttr.widgets.load(ref.current!);
          }
        };
      } else if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(ref.current!);
      }
      return;
    }

    // Instagram
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      const div = document.createElement('div');
      div.className = 'instagram-media';
      div.setAttribute('data-instgrm-permalink-url', url);
      div.innerHTML = `<a href="${url}">Loading Instagram...</a>`;
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

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.width = '100%';
        iframe.height = '400';
        iframe.allowFullscreen = true;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.style.border = 'none';
        ref.current.appendChild(iframe);
      }
    }
  }, [url]);

  return <div ref={ref} className="my-8" />;
}