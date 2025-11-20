import { useEffect, useState } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const [embedHtml, setEmbedHtml] = useState('<p>Loading embed...</p>');

  useEffect(() => {
    if (!url) return;

    // Twitter / X
    if (url.includes('x.com') || url.includes('twitter.com')) {
      const tweetId = url.split('/status/')[1]?.split('?')[0];
      if (!tweetId) {
        setEmbedHtml(`<a href="${url}" target="_blank">${url}</a>`);
        return;
      }

      // Official Twitter oEmbed endpoint (no API key needed)
      fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&dnt=true`)
        .then(res => res.json())
        .then(data => {
          setEmbedHtml(data.html || '<p>Could not load tweet</p>');
          // Twitter sometimes needs the script loaded for styling
          if (!document.getElementById('twitter-oembed-script')) {
            const script = document.createElement('script');
            script.id = 'twitter-oembed-script';
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            document.body.appendChild(script);
          }
        })
        .catch(() => {
          setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener">View on X</a>`);
        });
      return;
    }

    // Instagram – official oEmbed
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => setEmbedHtml(data.html || '<p>Could not load Instagram post</p>'))
        .catch(() => setEmbedHtml(`<a href="${url}" target="_blank">View on Instagram</a>`));
      return;
    }

    // YouTube – simple iframe (already perfect)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        setEmbedHtml(`
          <div class="aspect-w-16 aspect-h-9 my-8">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              allowFullScreen 
              class="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
          </div>
        `);
      }
      return;
    }

    // Fallback for anything else
    setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
  }, [url]);

  return <div dangerouslySetInnerHTML={{ __html: embedHtml }} className="my-8" />;
}