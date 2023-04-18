function initCarousels() {
    const carousels = document.querySelectorAll('.carousel');

    function handleGesture(startX, endX, carousel) {
        if (startX - endX > 50) {
            nextImage(carousel);
        } else if (startX - endX < -50) {
            previousImage(carousel);
        }
    }

    function updateCarousel(newIndex, carousel) {
        const images = carousel.querySelectorAll('img');
        const dots = carousel.querySelector('.dots').querySelectorAll('.dot');
        const leftArrow = carousel.querySelector('.arrow.left');
        const rightArrow = carousel.querySelector('.arrow.right');

        images[newIndex].classList.add('active');
        images[newIndex === 0 ? 1 : 0].classList.remove('active');
        dots[newIndex].classList.add('active');
        dots[newIndex === 0 ? 1 : 0].classList.remove('active');

        if (newIndex === 0) {
            leftArrow.classList.add('hidden');
            rightArrow.classList.remove('hidden');
        } else {
            leftArrow.classList.remove('hidden');
            rightArrow.classList.add('hidden');
        }
    }

    function nextImage(carousel) {
        updateCarousel(1, carousel);
    }

    function previousImage(carousel) {
        updateCarousel(0, carousel);
    }

    carousels.forEach(carousel => {
        if (carousel.querySelectorAll('img').length < 2) {
            return;
        }

        const leftArrow = carousel.querySelector('.arrow.left');
        const rightArrow = carousel.querySelector('.arrow.right');

        carousel.querySelector('.arrow.left').classList.add('hidden');
        if (carousel.querySelectorAll('img').length <= 1) {
            carousel.querySelector('.arrow.right').classList.add('hidden');
        }

        leftArrow.addEventListener('click', () => previousImage(carousel));
        rightArrow.addEventListener('click', () => nextImage(carousel));

        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', event => {
            touchStartX = event.changedTouches[0].screenX;
        });

        carousel.addEventListener('touchend', event => {
            touchEndX = event.changedTouches[0].screenX;
            handleGesture(touchStartX, touchEndX, carousel);
        });

        const dots = carousel.querySelector('.dots').querySelectorAll('.dot'); // Update this line
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => updateCarousel(index, carousel));
        });
    });
};


async function fetchDrawings() {
    const response = await fetch('drawings.json');
    const drawings = await response.json();
    return drawings;
}

function createDrawingContainer(drawing) {
    const container = document.createElement('div');
    container.classList.add('drawing-container');
    container.setAttribute('id', drawing.id);

    container.innerHTML = `
        <div class="carousel">
            <div class="image-wrapper">
                <img data-src="${drawing.image_1}" alt="${drawing.image_1_alt}" class="active lazy">
                ${drawing.image_2 ? `<img data-src="${drawing.image_2}" alt="${drawing.image_2_alt}" class="lazy">` : ''}
                <a href="${drawing.instagram}" target="_blank" class="icon-link instagram-link">
                    <i class="fab fa-instagram"></i>
                </a>
                <a href="#${drawing.id}" class="icon-link copy-link" data-id="${drawing.id}">
                    <i class="fas fa-link"></i>
                </a>
                <span class="copy-message"></span>
            </div>
            ${drawing.image_2 ? '<span class="arrow left hidden">&lsaquo;</span>' : ''}
            ${drawing.image_2 ? '<span class="arrow right">&rsaquo;</span>' : ''}
            ${drawing.image_2 ? `
            <div class="dots">
                <span class="dot active"></span>
                <span class="dot"></span>
            </div>
            ` : ''}
        </div>
    `;

    container.querySelector('.copy-link').addEventListener('click', (event) => {
        event.preventDefault();
        const url = new URL(window.location);
        url.hash = drawing.id;

        const showMessage = () => {
            const messageElement = container.querySelector('.copy-message');
            messageElement.textContent = 'Skopiowano ✓';
            messageElement.style.opacity = '1';
            setTimeout(() => {
                messageElement.style.opacity = '0';
            }, 10000); // Hide the message after 2 seconds
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url.toString()).then(showMessage).catch((error) => {
                console.error('Error copying URL:', error);
            });
        } else {
            fallbackCopyTextToClipboard(url.toString());
            showMessage();
        }
    });


    return container;
}


function initLazyLoading() {
    const lazyImages = Array.from(document.querySelectorAll('.lazy'));
    let preloadedImages = 0;

    const options = {
        rootMargin: '0px 0px 200px 0px',
        threshold: 0
    };

    const loadImage = (image) => {
        image.src = image.dataset.src;
        image.classList.remove('lazy');
    };

    const onIntersection = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadImage(entry.target);
                observer.unobserve(entry.target);
                lazyImages.splice(lazyImages.indexOf(entry.target), 1);
            }
        });
    };

    const observer = new IntersectionObserver(onIntersection, options);
    lazyImages.forEach(image => observer.observe(image));

    // Preload images that are not in the viewport
    function preloadImages() {
        if (lazyImages.length > 0) {
            loadImage(lazyImages[preloadedImages]);
            lazyImages.splice(preloadedImages, 1);
            setTimeout(preloadImages, 1000); // load the next image after 1 second
        }
    }

    setTimeout(preloadImages, 3000); // start preloading images after 3 seconds
}

async function init() {
    const drawingsContainer = document.getElementById('drawings-container');
    const drawings = await fetchDrawings();

    for (const drawing of drawings) {
        const drawingContainer = createDrawingContainer(drawing);
        drawingsContainer.appendChild(drawingContainer);
    }

    initCarousels();
    initLazyLoading();
    changeBackgroundColor();
}

init();

async function scrollToDrawing() {
    await init();

    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            targetElement.scrollIntoView({behavior: 'smooth'});
        }
    }
}

scrollToDrawing();

document.addEventListener('DOMContentLoaded', () => {
    scrollToDrawing();
});

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Prevent the textarea from being visible on the page
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Error copying text:', err);
    }

    document.body.removeChild(textArea);
}