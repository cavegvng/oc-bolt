import { useEffect, useState } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const [embedHtml, setEmbedHtml] = useState('');

  useEffect(() => {
    if (!url) return;

    if (url.includes('x.com') || url.includes('twitter.com')) {
      // Use Twitter's official oEmbed (no key needed)
      fetch(`https://publish.twitter.com/oembed?url=${url}&dnt=true`)
        .then(r => r.json())
        .then(data => {
          if (data?.html) {
            setEmbedHtml(data.html);
            // Dynamically inject Twitter script once
            if (!document.getElementById('twitter-oembed-script')) {
              const script = document.createElement('script');
              script.id = 'twitter-oembed-script';
              script.async = true;
              script.src = 'https://platform.twitter.com/widgets.js';
              document.body.appendChild(script);
            }
          }
        })
        .catch(() => setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener">View on X ↗</a>`));
      return;
    }

    // Instagram oEmbed
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      fetch(`https://api.instagram.com/oembed?url=${url}`)
        .then(r => r.json())
        .then(data => setEmbedHtml(data?.html || ''))
        .catch(() => setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener">View on Instagram ↗</a>`));
      return;
    }

    // YouTube iframe (already perfect)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        setEmbedHtml(
          `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}?rel=0" frameborder="0" allowfullscreen class="rounded-lg my-8"></iframe>`
        );
      }
      return;
    }

    // Fallback link
    setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
  }, [url]);

  // This is the magic line that fixes the "hard refresh needed" problem
  useEffect(() => {
    if (embedHtml && (window as any).twttr?.widgets?.load) {
      (window as any).twttr.widgets.load();
    }
  }, [embedHtml]);

  if (!embedHtml) return <p className="text-gray-500 my-8">Loading embed...</p>;

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: embedHtml }} 
      className="my-8 [&_.twitter-tweet]:mx-auto"
    />
  );
}