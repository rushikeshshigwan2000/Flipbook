/* =========================================================
   FlipBook Reader – Main Logic
   Requires: PDF.js, jQuery, Turn.js
   ========================================================= */

// ── PDF.js worker ─────────────────────────────────────────
// Using CDN for both library and worker to ensure version synchronization
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// ── State ─────────────────────────────────────────────────
let pdfDoc       = null;
let totalPages   = 0;
let soundEnabled = true;
let isFlipbookReady = false;

// ── DOM refs ──────────────────────────────────────────────
const pdfFileInput    = document.getElementById('pdfFile');
const dropZone        = document.getElementById('dropZone');
const uploadSection   = document.getElementById('uploadSection');
const readerSection   = document.getElementById('readerSection');
const loaderOverlay   = document.getElementById('loaderOverlay');
const loaderText      = document.getElementById('loaderText');
const flipbookEl      = document.getElementById('flipbook');
const bookWrapper     = document.getElementById('bookWrapper');
const flipSoundEl     = document.getElementById('flipSound');
const currentPageEl   = document.getElementById('currentPage');
const totalPagesEl    = document.getElementById('totalPages');
const pageInfoEl      = document.getElementById('pageInfo');

// ── Drag-and-drop support ──────────────────────────────────
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') loadPDF(file);
});

pdfFileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadPDF(file);
});

// ── Load PDF ───────────────────────────────────────────────
function loadPDF(file) {
  showLoader('Reading PDF…');
  const reader = new FileReader();
  reader.onload = function () {
    const typedArray = new Uint8Array(this.result);
    pdfjsLib.getDocument(typedArray).promise
      .then(pdf => {
        pdfDoc     = pdf;
        totalPages = pdf.numPages;
        renderAllPages();
      })
      .catch(err => {
        hideLoader();
        alert('Could not load PDF: ' + err.message);
      });
  };
  reader.readAsArrayBuffer(file);
}

// ── Render all pages to canvases ──────────────────────────
async function renderAllPages() {
  loaderText.textContent = 'Rendering pages…';
  flipbookEl.innerHTML = '';

  // Calculate the optimal scale to fit the window height (leaving room for topbar/controls)
  const availableH = window.innerHeight - 180;
  const firstPage = await pdfDoc.getPage(1);
  const baseViewport = firstPage.getViewport({ scale: 1.0 });
  const optimalScale = availableH / baseViewport.height;

  // Ensure it doesn't get ridiculously large on huge monitors or tiny on small ones
  const finalScale = Math.max(0.5, Math.min(optimalScale, 2.5));

  const viewport = firstPage.getViewport({ scale: finalScale });
  const pageW = Math.floor(viewport.width);
  const pageH = Math.floor(viewport.height);

  // Set uniform Turn.js dimensions based on first page
  const bookW = pageW * 2;
  const bookH = pageH;
  bookWrapper.style.width = bookW + 'px';
  bookWrapper.style.height = bookH + 'px';
  bookWrapper.style.transition = 'transform 0.3s ease';
  bookWrapper.style.transformOrigin = 'top center';
  
  // Create placeholder divs for ALL pages so Turn.js knows the total length immediately
  for (let num = 1; num <= totalPages; num++) {
    const div = document.createElement('div');
    div.id = `page-${num}`;
    div.className = 'page';
    flipbookEl.appendChild(div);
  }

  // Render exactly into the divs one by one
  for (let num = 1; num <= totalPages; num++) {
    loaderText.textContent = `Rendering page ${num} of ${totalPages}…`;
    await renderPageIntoDiv(num, pageW, pageH);
  }

  // Once ALL canvases are ready and explicitly attached to the DOM div boxes above...
  // Initialize Turn.js
  initTurnJs(bookW, bookH);
  isFlipbookReady = true;
}

async function renderPageIntoDiv(num, targetW, targetH) {
  const page = await pdfDoc.getPage(num);
  
  // DYNAMIC DPI FIX:
  // Instead of a hardcoded 4.0, we use the actual device pixel ratio.
  // We cap it at 3.0 to prevent massive memory usage while maintaining extreme clarity.
  const dpr = Math.min(window.devicePixelRatio || 1, 3.0);
  
  const originalViewport = page.getViewport({ scale: 1.0 });
  const renderScale = (targetH / originalViewport.height) * dpr; 
  const viewport = page.getViewport({ scale: renderScale });

  const canvas = document.createElement('canvas');
  // Internal resolution
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // CSS Display size
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  
  canvas.style.objectFit = "cover"; 
  canvas.style.display = "block";
  
  // Ensure we use the best rendering quality
  canvas.style.imageRendering = "auto"; 

  const ctx = canvas.getContext('2d', { 
    alpha: false,
    antialias: true 
  });
  
  // Quality hints for the browser
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Set solid white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ 
    canvasContext: ctx, 
    viewport: viewport,
    intent: 'display'
  }).promise;

  const div = document.getElementById(`page-${num}`);
  if (div) {
    div.innerHTML = ''; 
    div.appendChild(canvas);
  }
}

// ── Init Turn.js ───────────────────────────────────────────
function initTurnJs(bookW, bookH) {
  loaderText.textContent = 'Building flipbook…';

  $('#flipbook').turn({
    width:      bookW,
    height:     bookH,
    autoCenter: true,
    gradients:  true,
    acceleration: true,
    duration:   700,
    when: {
      turning: function(e, page) {
        updatePageCounter(page);
        playFlipSound();
      },
      turned: function(e, page) {
        updatePageCounter(page);
      }
    }
  });

  if (totalPagesEl) totalPagesEl.textContent = totalPages;
  if (currentPageEl) currentPageEl.textContent = 1;
  if (pageInfoEl) pageInfoEl.textContent = `1 – 2 of ${totalPages} pages`;

  hideLoader();
  uploadSection.classList.add('hidden');
  readerSection.classList.remove('hidden');

  // Trigger resize to perfectly fit the new window
  window.dispatchEvent(new Event('resize'));
  
  // Force browser focus to the main window so arrow keys work instantly
  window.focus();
}

// ── Fullscreen Toggle ──────────────────────────────────────
const btnFullscreen = document.getElementById('btnFullscreen');
if (btnFullscreen) {
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });
}

// ── Page counter update ────────────────────────────────────
function updatePageCounter(page) {
  if (currentPageEl) currentPageEl.textContent = page;
  
  const page2 = page + 1 <= totalPages ? page + 1 : page;
  if (pageInfoEl) pageInfoEl.textContent = `${page}–${page2} of ${totalPages} pages`;
}

// ── Flip sound ─────────────────────────────────────────────
function playFlipSound() {
  if (!soundEnabled) return;
  flipSoundEl.currentTime = 0;
  flipSoundEl.play().catch(() => {/* autoplay policy */});
}

document.getElementById('btnClose').addEventListener('click', () => {
  // Turn.js's .turn('destroy') method is bugged in some versions and throws errors
  // To reliably close the book, we just hard-reset the DOM and reset state
  isFlipbookReady = false;
  flipbookEl.innerHTML = '';
  readerSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  
  pdfFileInput.value = '';
  pdfDoc = null;
});

// ── Window Resize (Auto-fit book) ──────────────────────────
// When window resizes, adjust CSS scale so Turn.js fits beautifully 
window.addEventListener('resize', () => {
  if (!pdfDoc) return;
  const availW = window.innerWidth - 60;
  const availH = window.innerHeight - 100; // Room for bottom toolbar
  
  // The original rendered size of the book
  const bookW = bookWrapper.offsetWidth;
  const bookH = bookWrapper.offsetHeight;
  if (!bookW || !bookH) return;
  
  const scaleW = availW / bookW;
  const scaleH = availH / bookH;
  const newScale = Math.min(scaleW, scaleH, 1.2); 
  
  bookWrapper.style.transform = `scale(${newScale})`;
});
// ── Controls ───────────────────────────────────────────────
document.getElementById('btnFirst').addEventListener('click', () => $('#flipbook').turn('page', 1));
document.getElementById('btnPrev').addEventListener('click', () => $('#flipbook').turn('previous'));
document.getElementById('btnNext').addEventListener('click', () => $('#flipbook').turn('next'));
document.getElementById('btnLast').addEventListener('click', () => $('#flipbook').turn('page', totalPages));

const btnSound = document.getElementById('btnSound');
if (btnSound) {
  btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    btnSound.classList.toggle('active', !soundEnabled);
  });
}
// ── Keyboard shortcuts ─────────────────────────────────────
document.addEventListener('keydown', e => {
  // If the book isn't initialized yet, ignore key presses
  if (!isFlipbookReady) return;
  
  // Prevent default scrolling for arrow keys while reading
  if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
  }

  switch(e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      $('#flipbook').turn('next');
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      $('#flipbook').turn('previous');
      break;
    case 'Home':
      $('#flipbook').turn('page', 1);
      break;
    case 'End':
      $('#flipbook').turn('page', totalPages);
      break;
  }
});

// ── Loader helpers ─────────────────────────────────────────
function showLoader(msg = 'Loading…') {
  loaderText.textContent = msg;
  loaderOverlay.classList.add('active');
}

function hideLoader() {
  loaderOverlay.classList.remove('active');
}
