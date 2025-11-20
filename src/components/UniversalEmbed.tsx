import { useEffect, useRef } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';

    let script: HTMLScriptElement;

    if (url.includes('x.com') || url.includes('twitter.com')) {
      ref.current.innerHTML = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>`;
      script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
    }
    else if (url.includes('instagram.com')) {
      ref.current.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${url}"><a href="${url}"></a></blockquote>`;
      script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
    }
    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      ref.current.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" class="w-full aspect-video rounded-lg" allowFullScreen></iframe>`;
      return;
    }

    document.body.appendChild(script);
    script.onload = () => {
      if ((window as any).twttr?.widgets?.load) (window as any).twttr.widgets.load(ref.current);
      if ((window as any).instgrm?.Embeds?.process) (window as any).instgrm.Embeds.process();
    };

    return () => script?.remove();
  }, [url]);

  return <div ref={ref} className="my-8" />;
}
