const grid = document.getElementById('grid');
const filterInput = document.getElementById('filter');

function isImage(name) {
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

function render(items) {
  grid.innerHTML = '';
  for (const it of items) {
    const card = document.createElement('div');
    card.className = 'card';
    if (isImage(it.name)) {
      const img = document.createElement('img');
      img.src = '../' + it.path;
      img.alt = it.name;
      card.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.className = 'file-icon';
      icon.textContent = it.name.split('.').pop().toUpperCase();
      card.appendChild(icon);
    }
    const caption = document.createElement('div');
    caption.className = 'caption';
    const a = document.createElement('a');
    a.href = '../' + it.path;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = it.path;
    caption.appendChild(a);
    card.appendChild(caption);
    grid.appendChild(card);
  }
}

function applyFilter(items) {
  const q = (filterInput.value || '').toLowerCase().trim();
  if (!q) return items;
  return items.filter(i => i.path.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
}

fetch('../assets.json')
  .then(r => r.json())
  .then(items => {
    let shown = items.slice();
    render(shown);
    filterInput.addEventListener('input', () => render(applyFilter(items)));
  })
  .catch(err => {
    grid.innerHTML = '<p class="error">Could not load assets.json — run the generator.</p>';
    console.error(err);
  });
