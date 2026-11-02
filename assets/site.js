/* 黎凡特文化圈・旅人指南：進度、彈窗、謎題、變形效果 */
(function () {
  'use strict';

  /* ========== 設定（授權內容與謎題參數集中在此） ========== */
  var KEY = 'levant_solved';
  var CORRUPT_AT = 3;       // 解到第幾階時整站變形、檔案室出現
  var RARE = '鬱麤龘靐飍馫贔矗淼焱羴猋驫毳犇鑫譶轟蟲垚爨饕';
  var RARE_RATIO = 18;      // 文字被換成生僻字的比例（百分比）
  var MASK_RATIO = 86;      // 未解鎖檔案被遮罩的比例（百分比）
  var MASK_CHARS = '▅▊▉▌▇█▆';

  var REVEAL = {
    l1: '確切成因是某種來自更高維度的無形存在，以宇宙塵埃的形式散落地球，核能與軍火失控只是被引爆的後果',
    l2: '雅各系統為紀元前遺物，拉結體內植入的是一種擬態米姆，須與行星意識網路保持共振，效期四年，逾期失效，唯有返回尼莫點「磐約」才能重新校準',
    l3: '由行星意識網路主動選定',
    l4: '名義上隸屬錫安軍團，實際上已高度遭伊甸滲透，常被視為伊甸的私兵，專責情報封鎖與特殊回收'
  };
  var LOCK_TIER = { l1: 1, l2: 2, l3: 2, l4: 4 };

  /* ========== 進度儲存 ========== */
  function load() {
    try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return mem; }
  }
  var mem = [];
  function save(a) { mem = a; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function solved(n) { return load().indexOf(n) >= 0; }
  function maxSolved() { var a = load(); return a.length ? Math.max.apply(null, a) : 0; }
  function highest() { // 連續解到的最高階
    var n = 0; while (solved(n + 1)) n++; return n;
  }

  /* ========== 小工具 ========== */
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n += n << 3; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return n >>> 0; }
  function strHash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h >>> 0; }

  /* ========== 生僻字替換 ========== */
  var CJK = /[一-鿿]/;
  function corruptText(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || /^(SCRIPT|STYLE|INPUT|TEXTAREA|BUTTON)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('.keep,#modal')) return NodeFilter.FILTER_REJECT;
        return CJK.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n; while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      if (t._orig == null) t._orig = t.nodeValue;
      var s = t._orig, out = '', base = strHash(s);
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (CJK.test(c) && hash(base + i * 7919) % 100 < RARE_RATIO) out += RARE.charAt(hash(base + i) % RARE.length);
        else out += c;
      }
      t.nodeValue = out;
    });
  }

  /* ========== 遮罩 ========== */
  function maskText(s, seed) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (/\s/.test(c)) { out += c; continue; }
      if (hash(seed + i * 31) % 100 < MASK_RATIO) out += MASK_CHARS.charAt(hash(seed + i) % MASK_CHARS.length);
      else out += c;
    }
    return out;
  }
  function applyArchive() {
    var secs = document.querySelectorAll('.tier');
    if (!secs.length) return;
    var gate = document.getElementById('denied');
    var open = highest() >= CORRUPT_AT;
    if (gate) gate.style.display = open ? 'none' : '';
    var h = highest();
    secs.forEach(function (sec) {
      sec.style.display = open ? '' : 'none';
      var tier = +sec.getAttribute('data-tier');
      sec.querySelectorAll('p[data-text]').forEach(function (p) {
        var raw = p.getAttribute('data-text');
        if (tier <= h) { p.textContent = raw; p.classList.remove('masked'); }
        else { p.textContent = maskText(raw, strHash(raw)); p.classList.add('masked'); }
      });
      var tag = sec.querySelector('.state');
      if (tag) tag.textContent = tier <= h ? '已解鎖' : '權限不足';
    });
    var fin = document.getElementById('final-slot');
    if (fin) fin.style.display = (open && h >= 4 && h < 5) ? '' : 'none';
    var end = document.getElementById('ending');
    if (end) end.style.display = h >= 5 ? '' : 'none';
  }

  /* ========== 頁面套用 ========== */
  function applyState(animate) {
    var h = highest();
    var corrupt = h >= CORRUPT_AT;
    document.body.classList.toggle('corrupt', corrupt);
    document.querySelectorAll('.needs-archive').forEach(function (a) { a.style.display = corrupt ? '' : 'none'; });
    // 鎖頭文字
    document.querySelectorAll('a.lock').forEach(function (a) {
      var id = a.getAttribute('data-lock');
      if (h >= LOCK_TIER[id]) {
        var s = el('span', { 'class': 'revealed keep' },'〔' + REVEAL[id] + '〕');
        a.parentNode.replaceChild(s, a);
      }
    });
    // 路線核對終端
    var term = document.getElementById('route-terminal');
    if (term) term.textContent = solved(3) ? '路線核對已完成' : '開啟路線核對終端';
    if (corrupt) corruptText(document.querySelector('main')), corruptText(document.querySelector('footer.site'));
    applyArchive();
    if (animate) { document.body.classList.add('glitching'); setTimeout(function () { document.body.classList.remove('glitching'); }, 950); }
  }

  /* ========== 彈窗骨架 ========== */
  var modal, box;
  function openModal(title) {
    if (!modal) {
      modal = el('div', { id: 'modal' });
      box = el('div', { 'class': 'box' });
      modal.appendChild(box);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
      document.body.appendChild(modal);
    }
    box.innerHTML = '<h3>' + title + '</h3>';
    modal.classList.add('open');
    return box;
  }
  function closeModal() { if (modal) modal.classList.remove('open'); }
  function msg(text, cls) {
    var m = box.querySelector('.msg'); if (!m) { m = el('div', { 'class': 'msg' }); box.appendChild(m); }
    m.className = 'msg ' + (cls || ''); m.innerHTML = text;
  }
  function denied(text) {
    openModal('⚠ 存取權限不足');
    box.appendChild(el('p', null, text || '您嘗試存取的內容，已超出當前授權等級。'));
    var b = el('button', { 'class': 'ghost' }, '關閉'); b.onclick = closeModal; box.appendChild(b);
  }
  function success(n, line, code) {
    var a = load(); if (a.indexOf(n) < 0) a.push(n); save(a);
    box.innerHTML = '<h3>✔ 授權通過（第 ' + n + ' 階）</h3><p>' + line + '</p>' +
      '<p>授權碼：<strong>' + code + '</strong></p>';
    var b = el('button', null, n === CORRUPT_AT ? '繼續' : '關閉');
    b.onclick = function () { closeModal(); applyState(n === CORRUPT_AT); };
    box.appendChild(b);
    applyState(false);
    if (n === CORRUPT_AT) { document.body.classList.add('glitching'); setTimeout(function () { document.body.classList.remove('glitching'); }, 950); }
  }

  /* ========== 謎題 1：污染真相（調反相波長） ========== */
  function puzzle1() {
    openModal('Ⅰ・污染中和校準');
    box.appendChild(el('p', null, '污染的波長無法被移除，只能以反相波長抵消。請調整下方三項參數，使合成波形歸零。'));
    var cv = el('canvas', { width: 560, height: 180 }); box.appendChild(cv);
    var P = { f: 1, ph: 140, a: 0.7 };          // 污染波形（隱藏參數）
    var S = { f: 3, ph: 0, a: 0.5 };            // 玩家參數
    var row = el('div', null,
      '頻率：<select id="p1f"><option value="1">低頻</option><option value="3" selected>中頻</option><option value="6">高頻</option></select> ' +
      '相位：<input type="range" id="p1p" min="0" max="355" step="5" value="0"> <span id="p1pv">0°</span> ' +
      '振幅：<input type="range" id="p1a" min="0.1" max="1" step="0.05" value="0.5"> <span id="p1av">0.50</span>');
    box.appendChild(row);
    var btn = el('button', null, '送出校準'); box.appendChild(btn);
    var close = el('button', { 'class': 'ghost' }, '關閉'); close.onclick = closeModal; box.appendChild(close);
    function y(p, t) { return p.a * Math.sin(2 * Math.PI * p.f * t + p.ph * Math.PI / 180); }
    function draw() {
      var c = cv.getContext('2d'), W = cv.width, H = cv.height;
      c.clearRect(0, 0, W, H); c.lineWidth = 2;
      function line(fn, col) { c.strokeStyle = col; c.beginPath(); for (var x = 0; x <= W; x++) { var t = x / W * 2, v = fn(t); var yy = H / 2 - v * (H / 2 - 12); if (x) c.lineTo(x, yy); else c.moveTo(x, yy); } c.stroke(); }
      line(function (t) { return y(P, t); }, '#7a2a2a');
      line(function (t) { return y(S, t); }, '#3d6d8a');
      line(function (t) { return y(P, t) + y(S, t); }, '#e8c98f');
    }
    function read() { S.f = +box.querySelector('#p1f').value; S.ph = +box.querySelector('#p1p').value; S.a = +box.querySelector('#p1a').value;
      box.querySelector('#p1pv').textContent = S.ph + '°'; box.querySelector('#p1av').textContent = S.a.toFixed(2); draw(); }
    box.querySelectorAll('select,input').forEach(function (i) { i.oninput = read; });
    read();
    msg('紅：污染波形　藍：您發射的波形　金：合成結果');
    btn.onclick = function () {
      var phOk = Math.abs(((S.ph - (P.ph + 180)) % 360 + 540) % 360 - 180) <= 10;
      if (S.f === P.f && phOk && Math.abs(S.a - P.a) <= 0.1) success(1, '污染波形已被中和。', '中和・01');
      else msg('合成波形尚未歸零。頻率、相位、振幅都必須吻合。', 'bad');
    };
  }

  /* ========== 謎題 2：雅各系統（四年磐約） ========== */
  function puzzle2() {
    openModal('Ⅱ・磐約效期核查');
    box.appendChild(el('p', null, '拉結的共振介質以四年為極限，逾期者將被判定為利亞。請勾選所有已逾期的人員。'));
    var rows = [['R-031', 770, 774], ['R-118', 768, 773], ['R-204', 776, 778], ['R-077', 765, 772], ['R-362', 774, 778], ['R-045', 771, 777]];
    var html = '<table><tr><th>編號</th><th>上次返回尼莫點（圖曆）</th><th>本次查核（圖曆）</th><th>判定為利亞</th></tr>';
    rows.forEach(function (r, i) { html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td><input type="checkbox" data-i="' + i + '"></td></tr>'; });
    box.appendChild(el('div', null, html + '</table>'));
    var btn = el('button', null, '送出核查'); box.appendChild(btn);
    var close = el('button', { 'class': 'ghost' }, '關閉'); close.onclick = closeModal; box.appendChild(close);
    btn.onclick = function () {
      var ok = true;
      rows.forEach(function (r, i) { var chk = box.querySelector('input[data-i="' + i + '"]').checked; if (chk !== (r[2] - r[1] > 4)) ok = false; });
      if (ok) success(2, '核查完成，雅各系統的效期規則已確認。', '磐約・02');
      else msg('判定有誤。再確認「四年」的界線。', 'bad');
    };
  }

  /* ========== 謎題 3：路線規劃（日間時區） ========== */
  function puzzle3() {
    openModal('Ⅲ・跨區路線核對');
    box.appendChild(el('p', null, '目標：從伊甸文化圈前往松希爾遺跡。依規定，前往遺跡須由犍陀羅或授權嚮導規劃，全程須為 7 個日間時區以上，且請選出符合規定的最短路線。夜間移動不計入距離。'));
    var legs = [['伊甸', '梅耶', 2], ['伊甸', '犍陀羅', 2], ['梅耶', '犍陀羅', 1], ['犍陀羅', '松希爾遺跡', 5], ['梅耶', '松希爾遺跡', 6], ['伊甸', '松希爾遺跡', 7]];
    var chosen = [];
    var list = el('div'); box.appendChild(list);
    var status = el('p'); box.appendChild(status);
    function cur() { return chosen.length ? legs[chosen[chosen.length - 1]][1] : '伊甸'; }
    function render() {
      list.innerHTML = '';
      legs.forEach(function (l, i) {
        var d = el('div', { 'class': 'edge' }, '<span>' + l[0] + ' → ' + l[1] + '（' + l[2] + ' 個日間時區）</span>');
        var b = el('button', null, '加入'); b.disabled = l[0] !== cur();
        b.onclick = function () { chosen.push(i); render(); };
        d.appendChild(b); list.appendChild(d);
      });
      var total = chosen.reduce(function (s, i) { return s + legs[i][2]; }, 0);
      status.innerHTML = '目前路線：伊甸' + chosen.map(function (i) { return ' → ' + legs[i][1]; }).join('') + '　合計 ' + total + ' 個日間時區';
    }
    render();
    var undo = el('button', { 'class': 'ghost' }, '撤回'); undo.onclick = function () { chosen.pop(); render(); }; box.appendChild(undo);
    var btn = el('button', null, '送出路線'); box.appendChild(btn);
    var close = el('button', { 'class': 'ghost' }, '關閉'); close.onclick = closeModal; box.appendChild(close);
    btn.onclick = function () {
      var names = ['伊甸'].concat(chosen.map(function (i) { return legs[i][1]; }));
      var total = chosen.reduce(function (s, i) { return s + legs[i][2]; }, 0);
      if (cur() !== '松希爾遺跡') return msg('路線尚未抵達松希爾遺跡。', 'bad');
      if (names.indexOf('犍陀羅') < 0) return msg('未經犍陀羅規劃的路線不被允許。', 'bad');
      if (total < 7) return msg('距離不符合遺跡行程的下限。', 'bad');
      if (total > 7) return msg('路線合規，但不是最短。請再找更有效率的路線。', 'bad');
      success(3, '路線核對完成。但在您送出的同時，某些東西也一併改變了。', '時區・07');
    };
  }

  /* ========== 謎題 4：組織歸屬 ========== */
  function puzzle4() {
    openModal('Ⅳ・組織歸屬確認');
    box.appendChild(el('p', null, '請依百科所載，指出下列機構的「名義隸屬」。'));
    var items = [['拉普拉斯', 'H'], ['塔爾塔羅斯', 'H'], ['塔納赫', 'H'], ['塔木德', 'H'],
      ['二十四天軍團', 'G'], ['錫安軍團', 'G'], ['萬軍', 'G'], ['戈蒂亞', 'G'],
      ['伊希切爾', 'M'], ['伊古德拉希爾', 'M'], ['拉瑪蘇', 'M'], ['人理公司', 'E']];
    var html = '<table>';
    items.forEach(function (it, i) {
      html += '<tr><td>' + it[0] + '</td><td><select data-i="' + i + '"><option value="">請選擇</option><option value="H">希伯來</option><option value="G">犍陀羅</option><option value="M">梅耶</option><option value="E">伊甸（企業）</option></select></td></tr>';
    });
    box.appendChild(el('div', null, html + '</table>'));
    var btn = el('button', null, '送出'); box.appendChild(btn);
    var close = el('button', { 'class': 'ghost' }, '關閉'); close.onclick = closeModal; box.appendChild(close);
    btn.onclick = function () {
      var ok = true;
      items.forEach(function (it, i) { if (box.querySelector('select[data-i="' + i + '"]').value !== it[1]) ok = false; });
      if (ok) success(4, '歸屬確認無誤。但名義，並不總是實質。', '歸屬・04');
      else msg('仍有項目與公開記載不符，請回百科核對。', 'bad');
    };
  }

  /* ========== 謎題 5：事件排序 ========== */
  function puzzle5() {
    openModal('Ⅴ・終端檔案時序還原');
    box.appendChild(el('p', null, '請將下列事件依發生時間由早到晚排列。'));
    var cards = [
      ['圖曆 811 年', '莉莉絲於 JHVH 房間發現一具別身體個體'],
      ['圖曆 772 年', '亞當以伊甸繼承人身分進入希伯來受訓'],
      ['圖曆 803 年', '巴比倫陷落，亞當本體因污染過重死亡'],
      ['圖曆 780 至 800 年', '亞當主導建造超長波通訊設備']];
    var order = [0, 1, 2, 3];
    var wrap = el('div'); box.appendChild(wrap);
    function render() {
      wrap.innerHTML = '';
      order.forEach(function (ci, pos) {
        var d = el('div', { 'class': 'card' }, '<span>' + (pos + 1) + '. ' + cards[ci][1] + '</span>');
        var up = el('button', { 'class': 'ghost' }, '↑'), dn = el('button', { 'class': 'ghost' }, '↓');
        up.onclick = function () { if (pos > 0) { var t = order[pos - 1]; order[pos - 1] = order[pos]; order[pos] = t; render(); } };
        dn.onclick = function () { if (pos < 3) { var t = order[pos + 1]; order[pos + 1] = order[pos]; order[pos] = t; render(); } };
        d.appendChild(up); d.appendChild(dn); wrap.appendChild(d);
      });
    }
    render();
    var btn = el('button', null, '送出'); box.appendChild(btn);
    var close = el('button', { 'class': 'ghost' }, '關閉'); close.onclick = closeModal; box.appendChild(close);
    btn.onclick = function () {
      // 正確順序：772、780–800、803、811 對應 cards 索引 1,3,2,0
      if (order.join() === '1,3,2,0') success(5, '時序還原完成。803 年死去的，不是 811 年被發現的那一個。', '終端・08');
      else msg('時序有誤。', 'bad');
    };
  }

  var PUZZLES = { 1: puzzle1, 2: puzzle2, 3: puzzle3, 4: puzzle4, 5: puzzle5 };
  function tryPuzzle(n) {
    if (n > 1 && !solved(n - 1)) return denied('您尚未取得前一階的授權，無法進行此階驗證。');
    if (solved(n)) return;
    PUZZLES[n]();
  }

  /* ========== 啟動 ========== */
  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
      var lk = e.target.closest && e.target.closest('a.lock');
      if (lk) { e.preventDefault(); var n = LOCK_TIER[lk.getAttribute('data-lock')];
        var map = { 1: 1, 2: 2, 4: 4 }; tryPuzzle(map[n]); return; }
      var pz = e.target.closest && e.target.closest('[data-puzzle]');
      if (pz) { e.preventDefault(); tryPuzzle(+pz.getAttribute('data-puzzle')); return; }
      var rs = e.target.closest && e.target.closest('#reset');
      if (rs) { e.preventDefault(); save([]); try { localStorage.removeItem(KEY); } catch (er) {} location.reload(); }
    });
    applyState(false);
  });
})();
