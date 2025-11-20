import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    twttr?: any;
    instgrm?: any;
  }
}

export default function UniversalEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    if (url.includes('x.com') || url.includes('twitter.com')) {
      containerRef.current.innerHTML = `<blockquote class="twitter-tweet" data-dnt="true"><a href="${url}"></a></blockquote>`;

      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if (window.twttr?.widgets?.load) {
          window.twttr.widgets.load(containerRef.current);
        }
      };
    }

    else if (url.includes('instagram.com')) {
      containerRef.current.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${url}"><a href="${url}"></a></blockquote>`;

      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if (window.instgrm?.Embeds?.process) {
          window.instgrm.Embeds.process();
        }
      };
    }

    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.includes('v=') ? url.split('v=')[1]?.split('&')[0] : url.split('/').pop();
      containerRef.current.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" class="w-full aspect-video rounded-lg" allowFullScreen></iframe>`;
    }
  }, [url]);

  return <div ref={containerRef} className="my-8" />;
}
