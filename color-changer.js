const colorThief = new ColorThief();

function getDominantColor(img) {
  return new Promise((resolve, reject) => {
    const processImage = () => {
      try {
        const color = colorThief.getColor(img);
        resolve(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
      } catch (error) {
        resolve('rgb(0, 0, 0)'); // Default color in case of error
      }
    };

    if (img.complete) {
      processImage();
    } else {
      img.onload = processImage;
      img.onerror = (error) => {
        resolve('rgb(0, 0, 0)'); // Default color in case of error
      };
    }
  });
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom > 0
  );
}

async function changeBackgroundColor() {
  const drawings = document.querySelectorAll('.drawing-container');
  const visibleDrawings = Array.from(drawings).filter(isElementInViewport);

  let r = 0;
  let g = 0;
  let b = 0;

  if (visibleDrawings.length === 0) {
    return;
  }

  const colorPromises = visibleDrawings.map(async (drawing) => {
    const img = drawing.querySelector('img');
    const color = await getDominantColor(img);
    const rgb = color.match(/\d+/g).map(Number);

    r += rgb[0];
    g += rgb[1];
    b += rgb[2];
  });

  await Promise.all(colorPromises);

  r = Math.floor(r / visibleDrawings.length);
  g = Math.floor(g / visibleDrawings.length);
  b = Math.floor(b / visibleDrawings.length);

  document.body.style.transition = 'background-color 1s';
  document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function waitForImagesToLoad() {
  const images = document.querySelectorAll('.drawing-container img');
  const promises = Array.from(images).map(img =>
    new Promise(resolve => {
      if (img.complete) {
        resolve();
      } else {
        img.addEventListener('load', resolve);
      }
    })
  );
  return Promise.all(promises);
}

let isScrolling = false;

function handleScroll() {
  if (!isScrolling) {
    requestAnimationFrame(() => {
      changeBackgroundColor();
      isScrolling = false;
    });
  }
  isScrolling = true;
}

waitForImagesToLoad().then(() => {
  window.addEventListener('scroll', handleScroll);
});