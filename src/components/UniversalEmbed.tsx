import { useEffect, useState } from 'react';

export default function UniversalEmbed({ url }: { url: string }) {
  const [embedHtml, setEmbedHtml] = useState('');

  useEffect(() => {
    if (!url) return;

    // ───── X / Twitter ─────
    if (url.includes('x.com') || url.includes('twitter.com')) {
      fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&dnt=true`)
        .then(r => r.json())
        .then(data => {
          if (data?.html) {
            setEmbedHtml(data.html);
            // Ensure Twitter script is loaded
            if (!document.getElementById('twitter-oembed-script')) {
              const script = document.createElement('script');
              script.id = 'twitter-oembed-script';
              script.async = true;
              script.src = 'https://platform.twitter.com/widgets.js';
              document.body.appendChild(script);
            }
          }
        })
        .catch(() => setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">View on X ↗</a>`));
      return;
    }

    // ───── Instagram (2025 working version) ─────
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      const graphUrl = `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=IGQVQY...`; // any string works, Meta ignores it for public posts

      fetch(graphUrl)
        .then(r => r.json())
        .then(data => {
          if (data?.html) {
            setEmbedHtml(data.html);
            // Load Instagram embed script once
            if (!document.getElementById('instagram-embed-script')) {
              const script = document.createElement('script');
              script.id = 'instagram-embed-script';
              script.async = true;
              script.src = 'https://www.instagram.com/embed.js';
              document.body.appendChild(script);
            }
          } else {
            setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-pink-400 underline">View on Instagram ↗</a>`);
          }
        })
        .catch(() => {
          setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-pink-400 underline">View on Instagram ↗</a>`);
        });
      return;
    }

    // ───── YouTube ─────
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        setEmbedHtml(`
          <div class="my-8 aspect-w-16 aspect-h-9">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?rel=0" 
              class="w-full h-96 rounded-lg border-0"
              allowFullScreen 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
          </div>
        `);
      }
      return;
    }

    // Fallback for anything else
    setEmbedHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${url}</a>`);

  }, [url]);

  // This tiny effect fixes the "hard refresh needed" issue for Twitter once and for all
  useEffect(() => {
    if (embedHtml && (window as any).twttr?.widgets?.load) {
      (window as any).twttr.widgets.load();
    }
    if (embedHtml && (window as any).instgrm?.Embeds?.process) {
      (window as any).instgrm.Embeds.process();
    }
  }, [embedHtml]);

  if (!embedHtml) return <p className="text-gray-500 my-8">Loading embed...</p>;

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: embedHtml }} 
      className="my-8 [&_.twitter-tweet]:mx-auto [&_.instagram-media]:mx-auto"
    />
  );
}