const grid = document.getElementById('grid');
const filterInput = document.getElementById('filter');
const categorySelect = document.getElementById('category');
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
let categories = new Set();
let repImageMap = {};

function isImage(name) {
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getCategory(path) {
  const parts = path.split('/');
  if (parts.includes('Categorised') && parts.length > parts.indexOf('Categorised') + 1) {
    return parts[parts.indexOf('Categorised') + 1];
  }
  if (parts.includes('New') && parts.length > parts.indexOf('New') + 1) {
    const next = parts[parts.indexOf('New') + 1];
    if (next !== 'Categorised') return next;
  }
  const fileName = parts[parts.length - 1];
  const baseDir = parts.length > 1 ? parts[parts.length - 2] : 'Other';
  return baseDir !== '.' ? baseDir : 'Other';
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
  const cat = categorySelect.value;
  let result = items;
  if (q) {
    result = result.filter(i => i.path.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
  }
  if (cat) {
    result = result.filter(i => (i.category || '') === cat);
  }
  return result;
}

function populateCategories() {
  const sorted = Array.from(categories).sort();
  categorySelect.innerHTML = '<option value="">All Images</option>';
  for (const cat of sorted) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  }
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
categorySelect.addEventListener('change', refresh);
sortSelect.addEventListener('change', refresh);

fetch('../assets.json')
  .then(r => r.json())
  .then(items => {
    allImages = items.filter(it => isImage(it.name));
    allImages.forEach(img => {
      img.category = getCategory(img.path);
      categories.add(img.category);
      if (!repImageMap[img.category]) repImageMap[img.category] = img.path;
    });
    populateCategories();
    statusP.textContent = `Loaded ${allImages.length} images`;
    // If user has a saved default category, apply it
    const savedDefault = localStorage.getItem('gd_gallery_default_category');
    const seenSetup = localStorage.getItem('gd_gallery_seen_setup');
    if (savedDefault) {
      categorySelect.value = savedDefault;
    }
    // Show setup modal if not seen before
    if (!seenSetup) {
      showSetupModal();
    } else {
      refresh();
    }
  })
  .catch(err => {
    statusP.textContent = 'Error: Could not load assets.json';
    console.error(err);
  });

// Setup modal behavior
function showSetupModal() {
  const modal = document.getElementById('setup-modal');
  const gridEl = document.getElementById('setup-category-grid');
  modal.style.display = 'flex';
  gridEl.innerHTML = '';
  const cats = Array.from(categories).sort();
  cats.forEach(cat => {
    const t = document.createElement('div');
    t.className = 'category-tile';
    t.dataset.cat = cat;
    // thumbnail
    const thumb = document.createElement('img');
    thumb.className = 'cat-thumb';
    const rep = repImageMap[cat];
    if (rep) thumb.src = '../' + rep;
    else thumb.style.background = '#f1f5f9';
    t.appendChild(thumb);
    const name = document.createElement('div');
    name.className = 'cat-name';
    name.textContent = cat;
    t.appendChild(name);
    t.addEventListener('click', () => {
      document.querySelectorAll('.category-tile').forEach(el => el.classList.remove('selected'));
      t.classList.add('selected');
    });
    gridEl.appendChild(t);
  });

  document.getElementById('setup-start').onclick = () => {
    const sel = document.querySelector('.category-tile.selected');
    const chosen = sel ? sel.dataset.cat : '';
    if (chosen) {
      localStorage.setItem('gd_gallery_default_category', chosen);
      categorySelect.value = chosen;
    } else {
      localStorage.removeItem('gd_gallery_default_category');
      categorySelect.value = '';
    }
    localStorage.setItem('gd_gallery_seen_setup', 'true');
    hideSetupModal();
    refresh();
  };

  document.getElementById('setup-all').onclick = () => {
    localStorage.setItem('gd_gallery_seen_setup', 'true');
    localStorage.removeItem('gd_gallery_default_category');
    categorySelect.value = '';
    hideSetupModal();
    refresh();
  };

  document.getElementById('setup-skip').onclick = () => {
    localStorage.setItem('gd_gallery_seen_setup', 'true');
    hideSetupModal();
    refresh();
  };
}

function hideSetupModal() {
  const modal = document.getElementById('setup-modal');
  if (modal) modal.style.display = 'none';
}
