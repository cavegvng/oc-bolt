import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

const loadedScripts = new Set<string>();

export default function UniversalEmbed({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const loadScript = (src: string, scriptId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (loadedScripts.has(scriptId)) {
          resolve();
          return;
        }

        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
          loadedScripts.add(scriptId);
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = src;
        script.async = true;

        script.onload = () => {
          loadedScripts.add(scriptId);
          resolve();
        };

        script.onerror = () => {
          reject(new Error(`Failed to load script: ${src}`));
        };

        document.body.appendChild(script);
      });
    };

    const initializeEmbed = async () => {
      try {
        if (url.includes('x.com') || url.includes('twitter.com')) {
          await loadScript('https://platform.twitter.com/widgets.js', 'twitter-wjs');

          if (mounted && window.twttr?.widgets) {
            setTimeout(() => {
              if (containerRef.current && mounted) {
                window.twttr?.widgets.load(containerRef.current);
                setIsLoading(false);
              }
            }, 100);
          }
        } else if (url.includes('instagram.com')) {
          await loadScript('https://www.instagram.com/embed.js', 'instagram-embed');

          if (mounted && window.instgrm?.Embeds) {
            setTimeout(() => {
              if (mounted) {
                window.instgrm?.Embeds.process();
                setIsLoading(false);
              }
            }, 100);
          }
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading embed script:', err);
        if (mounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    initializeEmbed();

    return () => {
      mounted = false;
    };
  }, [url]);

  const isTwitter = url.includes('x.com') || url.includes('twitter.com');
  const isInstagram = url.includes('instagram.com');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  if (error) {
    return (
      <div className="my-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-400 text-sm">
          Failed to load embed. <a href={url} target="_blank" rel="noopener noreferrer" className="underline">View on {isTwitter ? 'Twitter/X' : isInstagram ? 'Instagram' : 'platform'}</a>
        </p>
      </div>
    );
  }

  return (
    <div className="my-8" ref={containerRef}>
      {isLoading && (isTwitter || isInstagram) && (
        <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading embed...</span>
        </div>
      )}

      {isTwitter && (
        <blockquote className="twitter-tweet">
          <a href={url}></a>
        </blockquote>
      )}

      {isInstagram && (
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{
            background: '#FFF',
            border: 0,
            borderRadius: '3px',
            boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
            margin: '1px',
            maxWidth: '540px',
            minWidth: '326px',
            padding: 0,
            width: 'calc(100% - 2px)'
          }}
        >
          <a href={url}></a>
        </blockquote>
      )}

      {isYouTube && (
        <iframe
          src={`https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0] || url.split('/').pop()}`}
          allowFullScreen
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      )}
    </div>
  );
}
