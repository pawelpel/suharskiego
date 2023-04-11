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

    container.innerHTML = `
        <div class="carousel">
            <img src="${drawing.image_1}" alt="${drawing.image_1_alt}" class="active">
            ${drawing.image_2 ? `<img src="${drawing.image_2}" alt="${drawing.image_2_alt}">` : ''}
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

    return container;
}

async function init() {
    const drawingsContainer = document.getElementById('drawings-container');
    const drawings = await fetchDrawings();

    for (const drawing of drawings) {
        const drawingContainer = createDrawingContainer(drawing);
        drawingsContainer.appendChild(drawingContainer);
    }

    // Call the function to initialize carousels after the drawings are added to the page
    initCarousels();
    changeBackgroundColor();
}

init();