/* Optional: to show an ONLINE folder that everyone (including your teacher) can see,
   paste your Google Drive folder ID between the quotes. Leave "" to hide it.
   Example: if the folder link is  drive.google.com/drive/folders/1AbCdEf  the ID is  1AbCdEf */
const DRIVE_FOLDER_ID = "";

/* ------------------ Activity container ------------------ */
(() => {
  'use strict';
  const zone = document.getElementById('dropzone');
  if (!zone) return;
  const input = document.getElementById('act-files');
  const grid = document.getElementById('activity-grid');
  const count = document.getElementById('act-count');
  const msg = document.getElementById('act-msg');
  const DB_NAME = 'portfolio-activities', STORE = 'files';
  let db = null, items = [], urls = [];

  const say = (t) => { msg.textContent = t || ''; };
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const ext = (n) => (n.indexOf('.') > -1 ? n.split('.').pop() : 'file').slice(0, 4).toUpperCase();
  const fmtSize = (b) => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB';
  const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  /* ----- storage (IndexedDB keeps the files inside this browser) ----- */
  const openDb = () => new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB not available')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const run = (mode, fn) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = t.onabort = () => reject(t.error);
  });

  /* ----- actions ----- */
  const addFiles = async (fileList) => {
    const files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    say('');
    for (const f of files) {
      const item = { title: f.name.replace(/\.[^.]+$/, ''), name: f.name, type: f.type || '', size: f.size, added: Date.now(), blob: f };
      try {
        item.id = db ? await run('readwrite', (s) => s.add(item)) : Date.now() + Math.random();
        items.push(item);
      } catch (e) {
        say('Could not save "' + f.name + '". The browser storage may be full.');
      }
    }
    render();
  };
  const rename = async (item) => {
    const t = window.prompt('New title for this activity:', item.title);
    if (t === null || !t.trim()) return;
    item.title = t.trim();
    if (db) await run('readwrite', (s) => s.put(item));
    render();
  };
  const remove = async (item) => {
    if (!window.confirm('Remove "' + item.title + '" from the container?')) return;
    if (db) await run('readwrite', (s) => s.delete(item.id));
    items = items.filter((x) => x.id !== item.id);
    render();
  };

  /* ----- draw the cards ----- */
  function render() {
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls = [];
    grid.textContent = '';
    items.slice().sort((a, b) => b.added - a.added).forEach((item, i) => {
      const url = URL.createObjectURL(item.blob);
      urls.push(url);
      const isImg = item.type.indexOf('image/') === 0;
      const card = el('div', 'card feature' + (i % 2 ? ' alt' : ''));
      if (isImg) {
        const img = el('img', 'act-img');
        img.src = url; img.alt = item.title;
        card.appendChild(img);
      } else {
        card.appendChild(el('div', 'file-badge', ext(item.name)));
      }
      card.appendChild(el('h3', '', item.title));
      card.appendChild(el('p', 'act-meta', fmtSize(item.size) + ' \u00B7 Added ' + fmtDate(item.added)));

      const row = el('div', 'act-actions');
      const open = el('a', 'btn small', 'Open');
      open.href = url; open.target = '_blank'; open.rel = 'noopener';
      const dl = el('a', 'btn ghost small', 'Download');
      dl.href = url; dl.download = item.name;
      const ren = el('button', 'btn ghost small', 'Rename');
      ren.type = 'button'; ren.addEventListener('click', () => rename(item));
      const del = el('button', 'btn ghost small', 'Remove');
      del.type = 'button'; del.addEventListener('click', () => remove(item));
      [open, dl, ren, del].forEach((b) => row.appendChild(b));
      card.appendChild(row);
      grid.appendChild(card);
    });
    count.textContent = items.length
      ? items.length + (items.length === 1 ? ' activity' : ' activities') + ' in my container'
      : 'Nothing here yet. Drop my first finished activity in the box above.';
  }

  /* ----- drop box events ----- */
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((n) => zone.addEventListener(n, (e) => {
    e.preventDefault(); zone.classList.add('drag');
  }));
  ['dragleave', 'drop'].forEach((n) => zone.addEventListener(n, (e) => {
    e.preventDefault(); zone.classList.remove('drag');
  }));
  zone.addEventListener('drop', (e) => addFiles(e.dataTransfer && e.dataTransfer.files));

  /* ----- start ----- */
  openDb()
    .then((d) => { db = d; return run('readonly', (s) => s.getAll()); })
    .then((list) => { items = list || []; })
    .catch(() => { say('This browser cannot keep files after the page is closed. They stay only while this page is open.'); })
    .then(render);

  /* ----- optional online folder ----- */
  const drive = document.getElementById('drive-section');
  const frame = document.getElementById('drive-frame');
  if (drive && frame && DRIVE_FOLDER_ID.trim()) {
    frame.src = 'https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(DRIVE_FOLDER_ID.trim()) + '#grid';
    drive.hidden = false;
  }
})();