(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var state = { categories: [], items: [] };
  var staged = [];          // фото, що чекають публікації: {blobs, w, h, url, title, alt}
  var editing = null;       // {id, photos:[{id?, blobs?, w, h, url, alt}]}

  /* ── допоміжне ── */
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (k === 'class') n.className = props[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), props[k]);
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, isError ? 6000 : 2800);
  }

  function api(method, url, body, raw) {
    var opts = { method: method, headers: { 'X-Requested-With': 'photo-admin' }, credentials: 'same-origin' };
    if (raw) { opts.body = raw; opts.headers['Content-Type'] = 'image/jpeg'; }
    else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; }
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || ('Помилка сервера (' + r.status + ')'));
        return j;
      });
    });
  }

  function catLabel(id) {
    var c = state.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : '—';
  }

  function fillSelect(sel, value) {
    sel.textContent = '';
    state.categories.forEach(function (c) { sel.appendChild(el('option', { value: c.id, text: c.label })); });
    if (value && state.categories.some(function (c) { return c.id === value; })) sel.value = value;
  }

  function niceName(filename) {
    var s = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    return /^(img|dsc|dscn|p|photo|image)?\s*\d+$/i.test(s) ? '' : s;
  }

  /* ── обробка зображення в браузері: зменшення + JPEG, без EXIF/GPS ── */
  function renderBlob(bmp, maxSide, quality) {
    var scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    var w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);   // прозорі PNG → білий фон
    ctx.drawImage(bmp, 0, 0, w, h);
    return new Promise(function (resolve, reject) {
      c.toBlob(function (b) { b ? resolve({ blob: b, w: w, h: h }) : reject(new Error('Не вдалося стиснути фото')); }, 'image/jpeg', quality);
    });
  }

  function processFile(file) {
    var open = typeof createImageBitmap === 'function'
      ? createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(file); })
      : Promise.reject(new Error('Браузер не підтримується'));
    return open.catch(function () {
      throw new Error('Не вдалося прочитати «' + file.name + '». Формат не підтримується браузером (наприклад, HEIC) — збережіть фото як JPG.');
    }).then(function (bmp) {
      return renderBlob(bmp, 2400, 0.88).then(function (full) {
        return renderBlob(bmp, 1000, 0.8).then(function (thumb) {
          if (bmp.close) bmp.close();
          return { full: full.blob, thumb: thumb.blob, w: full.w, h: full.h };
        });
      });
    });
  }

  function processMany(files) {
    var list = Array.prototype.slice.call(files).filter(function (f) {
      return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(f.name);
    });
    if (!list.length) { toast('Оберіть файли зображень', true); return Promise.resolve([]); }
    var out = [];
    return list.reduce(function (p, f, i) {
      return p.then(function () {
        toast('Підготовка фото ' + (i + 1) + ' з ' + list.length + '…');
        return processFile(f).then(function (r) {
          out.push({ blobs: r, w: r.w, h: r.h, url: URL.createObjectURL(r.thumb), title: niceName(f.name), alt: '' });
        }).catch(function (e) { toast(e.message, true); });
      });
    }, Promise.resolve()).then(function () { return out; });
  }

  function uploadPhoto(p) {
    return api('POST', '/api/upload?kind=full', undefined, p.blobs.full).then(function (r) {
      return api('POST', '/api/upload?kind=thumb&id=' + r.id, undefined, p.blobs.thumb).then(function () { return r.id; });
    });
  }

  /* ── список фото в редакторі (спільний для «Додати» та «Редагувати») ── */
  function renderStage(ul, arr, opts) {
    ul.textContent = '';
    arr.forEach(function (p, i) {
      var tools = el('div', { class: 'tools' }, [
        el('span', { class: 'num', text: 'Фото ' + (i + 1) }),
        opts.order ? el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Перемістити фото ' + (i + 1) + ' раніше', text: '←', onclick: function () { move(arr, i, -1); opts.redraw(); } }) : null,
        opts.order ? el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Перемістити фото ' + (i + 1) + ' пізніше', text: '→', onclick: function () { move(arr, i, 1); opts.redraw(); } }) : null,
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Прибрати фото ' + (i + 1), text: '✕', onclick: function () { arr.splice(i, 1); opts.redraw(); } }),
      ]);
      if (opts.order) {
        tools.children[1].disabled = i === 0;
        tools.children[2].disabled = i === arr.length - 1;
      }
      var fields = [tools];
      if (opts.title) {
        fields.push(el('input', { type: 'text', maxlength: '120', placeholder: 'Назва фото', 'aria-label': 'Назва фото ' + (i + 1), value: p.title || '',
          oninput: function (e) { p.title = e.target.value; e.target.classList.remove('invalid'); } }));
      }
      fields.push(el('input', { type: 'text', maxlength: '200', placeholder: 'Опис для незрячих (необов\'язково)', 'aria-label': 'Опис фото ' + (i + 1), value: p.alt || '',
        oninput: function (e) { p.alt = e.target.value; } }));
      ul.appendChild(el('li', {}, [
        el('img', { src: p.url, alt: 'Попередній перегляд фото ' + (i + 1) }),
        el('div', { class: 'fields' }, fields),
      ]));
    });
  }
  function move(arr, i, d) {
    var j = i + d;
    if (j < 0 || j >= arr.length) return;
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }

  /* ── блок «Додати фото» ── */
  var stageForm = $('#stage-form'), stageUl = $('#stage'), mode = function () { return stageForm.elements.mode.value; };

  function redrawStage() {
    stageForm.hidden = staged.length === 0;
    $('#drop').hidden = staged.length > 0;
    $('#carousel-title-wrap').hidden = mode() !== 'carousel';
    renderStage(stageUl, staged, { title: mode() === 'single', order: mode() === 'carousel', redraw: redrawStage });
    var n = staged.length;
    $('#publish').textContent = mode() === 'carousel' && n > 1 ? 'Опублікувати карусель (' + n + ' фото)' : 'Опублікувати на сайті (' + n + ')';
  }

  function addStaged(files) {
    processMany(files).then(function (list) {
      staged = staged.concat(list);
      redrawStage();
      toast('');
    });
  }

  $('#pick').addEventListener('click', function () { $('#file-input').click(); });
  $('#more').addEventListener('click', function () { $('#file-input').click(); });
  $('#file-input').addEventListener('change', function (e) { addStaged(e.target.files); e.target.value = ''; });
  var drop = $('#drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { addStaged(e.dataTransfer.files); });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(stageForm.elements.mode, function (r) { r.addEventListener('change', redrawStage); });
  $('#clear').addEventListener('click', function () { resetStage(); });

  function resetStage() {
    staged.forEach(function (p) { URL.revokeObjectURL(p.url); });
    staged = [];
    $('#carousel-title').value = '';
    redrawStage();
  }

  function setBusy(btnIds, prog, busy, value) {
    btnIds.forEach(function (id) { $(id).disabled = busy; });
    prog.hidden = !busy;
    if (busy) prog.value = value || 0;
  }

  stageForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!staged.length) return;
    var cat = $('#stage-cat').value;
    var groups;  // [{title, photos:[]}]
    if (mode() === 'carousel') {
      var tEl = $('#carousel-title');
      var t = tEl.value.trim();
      if (!t) { tEl.classList.add('invalid'); tEl.focus(); toast('Вкажіть назву каруселі', true); return; }
      tEl.classList.remove('invalid');
      groups = [{ title: t, photos: staged.slice() }];
    } else {
      var bad = Array.prototype.slice.call(stageUl.querySelectorAll('input[type=text]')).filter(function (inp, idx) { return idx % 2 === 0 && !inp.value.trim(); });
      if (bad.length) { bad.forEach(function (b) { b.classList.add('invalid'); }); bad[0].focus(); toast('Вкажіть назву кожного фото', true); return; }
      groups = staged.map(function (p) { return { title: p.title.trim(), photos: [p] }; });
    }

    var total = staged.length, done = 0, prog = $('#progress');
    var ids = ['#publish', '#more', '#clear'];
    setBusy(ids, prog, true, 0);

    groups.reduce(function (chain, g) {
      return chain.then(function () {
        var uploaded = [];
        return g.photos.reduce(function (c, p) {
          return c.then(function () {
            return uploadPhoto(p).then(function (id) {
              uploaded.push({ id: id, w: p.w, h: p.h, alt: p.alt.trim() || (g.photos.length > 1 ? g.title + ' — фото ' + (uploaded.length + 1) : g.title) });
              prog.value = ++done / total;
            });
          });
        }, Promise.resolve()).then(function () {
          return api('POST', '/api/items', { title: g.title, cat: cat, photos: uploaded });
        }).then(function () {
          g.photos.forEach(function (p) { var i = staged.indexOf(p); if (i >= 0) { URL.revokeObjectURL(p.url); staged.splice(i, 1); } });
        });
      });
    }, Promise.resolve()).then(function () {
      toast('Опубліковано! Фото вже на сайті.');
      resetStage();
      return refresh();
    }).catch(function (err) {
      toast(err.message, true);
      redrawStage();
      refresh();
    }).then(function () { setBusy(ids, prog, false); });
  });

  /* ── категорії ── */
  function newCategory() {
    var label = prompt('Назва нової категорії (наприклад, «Подорожі»):');
    if (!label || !label.trim()) return;
    api('POST', '/api/categories', { label: label.trim() }).then(function (c) {
      return refresh().then(function () { $('#stage-cat').value = c.id; toast('Категорію додано'); });
    }).catch(function (e) { toast(e.message, true); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-new-cat]'), function (b) { b.addEventListener('click', newCategory); });

  /* ── список записів ── */
  function renderItems() {
    var ul = $('#items');
    ul.textContent = '';
    var photos = state.items.reduce(function (n, it) { return n + it.photos.length; }, 0);
    $('#list-count').textContent = state.items.length ? state.items.length + ' карток · ' + photos + ' фото' : '';
    $('#empty').hidden = state.items.length > 0;

    state.items.forEach(function (it, i) {
      var many = it.photos.length > 1;
      var move = function (d) {
        var ids = state.items.map(function (x) { return x.id; });
        var j = i + d, t = ids[i]; ids[i] = ids[j]; ids[j] = t;
        api('POST', '/api/order', { ids: ids }).then(refresh).catch(function (e) { toast(e.message, true); });
      };
      var up = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Підняти «' + it.title + '» вище', text: '↑', onclick: function () { move(-1); } });
      var down = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Опустити «' + it.title + '» нижче', text: '↓', onclick: function () { move(1); } });
      up.disabled = i === 0; down.disabled = i === state.items.length - 1;

      ul.appendChild(el('li', { class: 'item' }, [
        el('div', { class: 'thumb' }, [
          el('img', { src: '/' + it.photos[0].thumb, alt: it.photos[0].alt, loading: 'lazy' }),
          many ? el('span', { class: 'badge', text: 'Карусель · ' + it.photos.length }) : null,
        ]),
        el('div', { class: 'meta' }, [el('strong', { text: it.title }), el('span', { text: catLabel(it.cat) })]),
        el('div', { class: 'tools' }, [
          up, down,
          el('button', { type: 'button', class: 'btn btn-outline btn-sm', text: 'Редагувати', onclick: function () { openEdit(it); } }),
          el('button', { type: 'button', class: 'btn btn-danger btn-sm', text: 'Видалити', onclick: function () { remove(it); } }),
        ]),
      ]));
    });

    var cl = $('#cat-list');
    cl.textContent = '';
    state.categories.forEach(function (c) {
      var used = state.items.some(function (it) { return it.cat === c.id; });
      var b = el('button', { type: 'button', class: 'btn btn-danger btn-sm', text: 'Видалити', 'aria-label': 'Видалити категорію ' + c.label,
        onclick: function () {
          if (!confirm('Видалити категорію «' + c.label + '»?')) return;
          api('DELETE', '/api/categories/' + c.id).then(refresh).then(function () { toast('Категорію видалено'); }).catch(function (e) { toast(e.message, true); });
        } });
      if (used || state.categories.length === 1) { b.disabled = true; b.title = used ? 'У категорії є фото' : 'Має лишитися хоча б одна'; }
      cl.appendChild(el('li', {}, [el('span', { text: c.label }), b]));
    });
  }

  function remove(it) {
    var msg = it.photos.length > 1
      ? 'Видалити карусель «' + it.title + '» разом з ' + it.photos.length + ' фото? Файли буде видалено назавжди.'
      : 'Видалити «' + it.title + '»? Файл буде видалено назавжди.';
    if (!confirm(msg)) return;
    api('DELETE', '/api/items/' + it.id).then(refresh).then(function () { toast('Видалено'); }).catch(function (e) { toast(e.message, true); });
  }

  /* ── редагування ── */
  var dlg = $('#edit');
  function redrawEdit() { renderStage($('#edit-stage'), editing.photos, { order: true, redraw: redrawEdit }); }

  function openEdit(it) {
    editing = {
      id: it.id,
      photos: it.photos.map(function (p) { return { id: p.src.replace(/^.*\/([a-f0-9]{16})\.jpg$/, '$1'), w: p.w, h: p.h, url: '/' + p.thumb, alt: p.alt }; }),
    };
    $('#edit-name').value = it.title;
    $('#edit-name').classList.remove('invalid');
    fillSelect($('#edit-cat'), it.cat);
    redrawEdit();
    dlg.showModal();
  }

  $('#edit-add').addEventListener('click', function () { $('#edit-file').click(); });
  $('#edit-file').addEventListener('change', function (e) {
    processMany(e.target.files).then(function (list) { editing.photos = editing.photos.concat(list); redrawEdit(); toast(''); });
    e.target.value = '';
  });
  $('#edit-cancel').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('close', function () {
    if (editing) editing.photos.forEach(function (p) { if (p.blobs) URL.revokeObjectURL(p.url); });
    editing = null;
  });

  $('#edit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var nameEl = $('#edit-name'), title = nameEl.value.trim();
    if (!title) { nameEl.classList.add('invalid'); nameEl.focus(); return; }
    if (!editing.photos.length) { toast('У записі має лишитися хоча б одне фото (або видаліть запис у списку)', true); return; }
    var prog = $('#edit-progress'), ids = ['#edit-save', '#edit-add', '#edit-cancel'];
    var fresh = editing.photos.filter(function (p) { return p.blobs; }), done = 0;
    setBusy(ids, prog, true, 0);

    fresh.reduce(function (c, p) {
      return c.then(function () { return uploadPhoto(p).then(function (id) { p.id = id; prog.value = ++done / fresh.length; }); });
    }, Promise.resolve()).then(function () {
      var n = editing.photos.length;
      return api('PUT', '/api/items/' + editing.id, {
        title: title,
        cat: $('#edit-cat').value,
        photos: editing.photos.map(function (p, i) {
          return { id: p.id, w: p.w, h: p.h, alt: (p.alt || '').trim() || (n > 1 ? title + ' — фото ' + (i + 1) : title) };
        }),
      });
    }).then(function () {
      dlg.close();
      toast('Збережено');
      return refresh();
    }).catch(function (err) { toast(err.message, true); }).then(function () { setBusy(ids, prog, false); });
  });

  /* ── завантаження стану ── */
  function refresh() {
    return api('GET', '/api/state').then(function (s) {
      state = s;
      var cur = $('#stage-cat').value;
      fillSelect($('#stage-cat'), cur);
      renderItems();
    }).catch(function (e) { toast(e.message, true); });
  }

  /* ── публікація на GitHub ── */
  $('#publish-site').addEventListener('click', function () {
    var btn = $('#publish-site');
    if (!confirm('Опублікувати всі зміни на справжній сайт?')) return;
    btn.disabled = true;
    btn.textContent = 'Публікація…';
    api('POST', '/api/publish').then(function (r) {
      toast(r.message);
    }).catch(function (e) { toast(e.message, true); })
      .then(function () { btn.disabled = false; btn.textContent = 'Опублікувати на сайті'; });
  });

  window.addEventListener('beforeunload', function (e) { if (staged.length) { e.preventDefault(); e.returnValue = ''; } });
  redrawStage();
  refresh();
})();
