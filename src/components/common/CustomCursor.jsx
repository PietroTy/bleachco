import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer:fine)');
    setEnabled(mediaQuery.matches);

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => setHovered(false);

    if (mediaQuery.matches) {
      window.addEventListener('mousemove', onMouseMove);

      const setupListeners = () => {
        const elements = document.querySelectorAll('a, button, .size-btn, .thumb, .product-tile, input, select, textarea');
        elements.forEach(el => {
          el.addEventListener('mouseenter', handleMouseEnter);
          el.addEventListener('mouseleave', handleMouseLeave);
        });
      };

      setupListeners();

      const observer = new MutationObserver(() => {
        setupListeners();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        observer.disconnect();
        const elements = document.querySelectorAll('a, button, .size-btn, .thumb, .product-tile, input, select, textarea');
        elements.forEach(el => {
          el.removeEventListener('mouseenter', handleMouseEnter);
          el.removeEventListener('mouseleave', handleMouseLeave);
        });
      };
    }
  }, []);

  if (!enabled) return null;

  return (
    <div
      id="cursor"
      className={hovered ? 'hovered' : ''}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
