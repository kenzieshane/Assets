const grid = document.getElementById('grid');
const filterInput = document.getElementById('filter');
const sortSelect = document.getElementById('sort');
const countSpan = document.getElementById('count');
const statusP = document.getElementById('status');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxName = document.getElementById('lightbox-name');
const lightboxSize = document.getElementById('lightbox-size');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

let allImages = [];
let currentImages = [];
let lightboxIndex = 0;

function isImage(name) {
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function sort(items, method) {
  const arr = [...items];
  switch (method) {
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'size-desc':
      return arr.sort((a, b) => b.size - a.size);
    case 'size-asc':
      return arr.sort((a, b) => a.size - b.size);
    case 'date-new':
      return arr.sort((a, b) => b.mtime - a.mtime);
    case 'date-old':
      return arr.sort((a, b) => a.mtime - b.mtime);
    default:
      return arr;
  }
}

function openLightbox(index) {
  if (index < 0 || index >= currentImages.length) return;
  lightboxIndex = index;
  const img = currentImages[index];
  lightboxImg.src = '../' + img.path;
  lightboxName.textContent = img.path;
  lightboxSize.textContent = formatSize(img.size);
  lightbox.style.display = 'flex';
}

function render(items) {
  grid.innerHTML = '';
  currentImages = items;
  countSpan.textContent = items.length + ' image' + (items.length !== 1 ? 's' : '');
  
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    
    const img = document.createElement('img');
    img.src = '../' + it.path;
    img.alt = it.name;
    card.appendChild(img);
    
    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = it.path;
    card.appendChild(caption);
    
    card.addEventListener('click', () => openLightbox(i));
    grid.appendChild(card);
  }
}

function applyFilter(items) {
  const q = (filterInput.value || '').toLowerCase().trim();
  if (!q) return items;
  return items.filter(i => i.path.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
}

function refresh() {
  let filtered = applyFilter(allImages);
  filtered = sort(filtered, sortSelect.value);
  render(filtered);
}

lightboxClose.addEventListener('click', () => { lightbox.style.display = 'none'; });
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.style.display = 'none';
});
lightboxPrev.addEventListener('click', () => openLightbox(lightboxIndex - 1));
lightboxNext.addEventListener('click', () => openLightbox(lightboxIndex + 1));

document.addEventListener('keydown', (e) => {
  if (lightbox.style.display === 'none') return;
  if (e.key === 'Escape') lightbox.style.display = 'none';
  if (e.key === 'ArrowLeft') openLightbox(lightboxIndex - 1);
  if (e.key === 'ArrowRight') openLightbox(lightboxIndex + 1);
});

filterInput.addEventListener('input', refresh);
sortSelect.addEventListener('change', refresh);

fetch('../assets.json')
  .then(r => r.json())
  .then(items => {
    allImages = items.filter(it => isImage(it.name));
    statusP.textContent = `Loaded ${allImages.length} images`;
    refresh();
  })
  .catch(err => {
    statusP.textContent = 'Error: Could not load assets.json';
    console.error(err);
  });
