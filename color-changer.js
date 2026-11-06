const COLOR_THIEF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.min.js';
const FALLBACK_COLOR = [65, 65, 65];

const colorCache = new WeakMap();
let colorThiefPromise;

function loadColorThief() {
    colorThiefPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = COLOR_THIEF_URL;
        script.onload = () => resolve(new window.ColorThief());
        script.onerror = () => reject(new Error('Failed to load Color Thief'));
        document.head.append(script);
    });
    return colorThiefPromise;
}

function whenLoaded(img) {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
    });
}

function getDominantColor(img, colorThief) {
    if (!colorCache.has(img)) {
        const color = whenLoaded(img)
            .then(() => colorThief.getColor(img))
            .catch(() => FALLBACK_COLOR);
        colorCache.set(img, color);
    }
    return colorCache.get(img);
}

function averageColor(colors) {
    return [0, 1, 2].map((channel) => {
        const sum = colors.reduce((total, color) => total + color[channel], 0);
        return Math.floor(sum / colors.length);
    });
}

export function syncBackgroundWithDrawings(drawings) {
    const visibleDrawings = new Set();
    let latestUpdate = 0;

    async function updateBackground() {
        if (visibleDrawings.size === 0) return;

        const update = ++latestUpdate;
        const colorThief = await loadColorThief();
        const colors = await Promise.all(
            [...visibleDrawings].map((drawing) => getDominantColor(drawing.querySelector('.slide'), colorThief))
        );

        // Images load at different speeds, so a newer update may have finished first.
        if (update !== latestUpdate) return;

        const [r, g, b] = averageColor(colors);
        document.documentElement.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                visibleDrawings.add(entry.target);
            } else {
                visibleDrawings.delete(entry.target);
            }
        }
        updateBackground().catch(console.error);
    });

    drawings.forEach((drawing) => observer.observe(drawing));
}
