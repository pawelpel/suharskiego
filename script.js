// Keep in sync with JOKE_WIDTHS in optimize_images.py.
const VARIANT_WIDTHS = [720, 1080, 1440];
const IMAGE_SIZES = '(min-width: 768px) calc(50vw - 40px), calc(100vw - 40px)';
const SWIPE_THRESHOLD_PX = 50;
const COPY_MESSAGE_MS = 1000;

function setImageSource(img, src) {
    // A missing variant means optimize_images.py has not been run for this drawing yet.
    img.addEventListener('error', () => {
        img.removeAttribute('srcset');
        img.src = src;
    }, { once: true });

    img.sizes = IMAGE_SIZES;
    img.srcset = VARIANT_WIDTHS
        .map((width) => `${src.replace(/\.jpg$/, `-${width}.webp`)} ${width}w`)
        .join(', ');
    img.src = src;
}

function initCarousel(carousel, loadHiddenSlide) {
    const slides = [...carousel.querySelectorAll('.slide')];
    const dots = [...carousel.querySelectorAll('.dot')];
    const leftArrow = carousel.querySelector('.arrow.left');
    const rightArrow = carousel.querySelector('.arrow.right');
    let current = 0;

    function show(index) {
        if (index < 0 || index >= slides.length) return;

        loadHiddenSlide();
        current = index;

        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
            if (i === index) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });

        const atStart = index === 0;
        const atEnd = index === slides.length - 1;
        // Hiding the focused arrow would otherwise drop keyboard focus back to the page.
        const nextFocus = (atStart && document.activeElement === leftArrow && rightArrow)
            || (atEnd && document.activeElement === rightArrow && leftArrow);

        leftArrow.hidden = atStart;
        rightArrow.hidden = atEnd;
        if (nextFocus) nextFocus.focus();
    }

    leftArrow.addEventListener('click', () => show(current - 1));
    rightArrow.addEventListener('click', () => show(current + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));

    let touchStartX = 0;
    carousel.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });
    carousel.addEventListener('touchend', (event) => {
        const distance = touchStartX - event.changedTouches[0].screenX;
        if (Math.abs(distance) > SWIPE_THRESHOLD_PX) show(current + Math.sign(distance));
    }, { passive: true });

    // Fetch the hidden slide on first sign of interest, so it is ready when revealed.
    carousel.addEventListener('pointerenter', loadHiddenSlide, { once: true });
    carousel.addEventListener('focusin', loadHiddenSlide, { once: true });
}

function legacyCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.append(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    textArea.remove();
    if (!copied) throw new Error('execCommand copy was rejected');
}

async function copyToClipboard(text) {
    // navigator.clipboard only exists in secure contexts, so plain HTTP needs the fallback.
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
    } else {
        legacyCopy(text);
    }
}

function initCopyLink(container, id) {
    const message = container.querySelector('.copy-message');

    container.querySelector('.copy-link').addEventListener('click', async (event) => {
        event.preventDefault();
        const url = new URL(window.location);
        url.hash = id;

        try {
            await copyToClipboard(url.toString());
        } catch (error) {
            console.error('Error copying URL:', error);
            return;
        }

        message.textContent = 'Skopiowano ✓';
        message.classList.add('visible');
        setTimeout(() => message.classList.remove('visible'), COPY_MESSAGE_MS);
    });
}

function createDrawing(template, drawing, isFirst) {
    const fragment = document.importNode(template.content, true);
    const container = fragment.querySelector('.drawing-container');
    const carousel = container.querySelector('.carousel');
    const [firstSlide, secondSlide] = container.querySelectorAll('.slide');

    container.id = drawing.id;

    container.querySelector('.instagram-link').href = drawing.instagram;
    container.querySelector('.copy-link').href = `#${drawing.id}`;
    initCopyLink(container, drawing.id);

    // The first drawing holds the LCP image; everything else waits until it is near the viewport.
    firstSlide.loading = isFirst ? 'eager' : 'lazy';
    if (isFirst) firstSlide.setAttribute('fetchpriority', 'high');
    firstSlide.alt = drawing.image_1_alt;
    setImageSource(firstSlide, drawing.image_1);

    if (drawing.image_2) {
        secondSlide.alt = drawing.image_2_alt;
        let isLoaded = false;
        initCarousel(carousel, () => {
            if (isLoaded) return;
            isLoaded = true;
            setImageSource(secondSlide, drawing.image_2);
        });
    } else {
        secondSlide.remove();
        carousel.querySelectorAll('.arrow, .dots').forEach((element) => element.remove());
    }

    return container;
}

function syncBackgroundOnFirstScroll() {
    window.addEventListener('scroll', async () => {
        try {
            const { syncBackgroundWithDrawings } = await import('./color-changer.js');
            syncBackgroundWithDrawings(document.querySelectorAll('.drawing-container'));
        } catch (error) {
            console.error('Error starting background sync:', error);
        }
    }, { once: true, passive: true });
}

async function fetchDrawings() {
    const response = await fetch('drawings.json');
    if (!response.ok) {
        throw new Error(`Failed to fetch drawings: ${response.status}`);
    }
    return response.json();
}

async function init() {
    const drawingsContainer = document.getElementById('drawings-container');
    const template = document.getElementById('drawing-template');

    let drawings;
    try {
        drawings = await fetchDrawings();
    } catch (error) {
        console.error(error);
        drawingsContainer.textContent = 'Nie udało się załadować rysunków. Spróbuj odświeżyć stronę.';
        return;
    }

    drawingsContainer.append(...drawings.map((drawing, index) => createDrawing(template, drawing, index === 0)));

    syncBackgroundOnFirstScroll();

    // Jump instead of smooth-scrolling: passing every drawing on the way would load them all.
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
}

init();
