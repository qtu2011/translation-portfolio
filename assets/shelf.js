/* 書架：中文版與日文版共用。頁面先設定 window.SHELF_LANG = "zh" 或 "ja"。 */
(function () {
  var LABELS = {
    zh: {
      all: '全部',
      count: function (n) { return n + ' 本'; },
      cat: function (c) { return c; },
      author: function (a) { return [a, ' 著']; },
      month: function (y, m) { return y + ' 年 ' + m + ' 月'; },
      latestNote: function (y, m) { return '最近一本出版於 ' + y + ' 年 ' + m + ' 月'; },
      alt: function (t) { return '《' + t + '》書封'; }
    },
    ja: {
      all: 'すべて',
      count: function (n) { return n + ' 冊'; },
      cat: function (c) {
        return {
          '小說': '小説', '推理懸疑': 'ミステリー', '心理勵志': '心理・自己啓発', '健康養生': '健康',
          '飲食料理': '料理・食', '商業職場': 'ビジネス', '旅遊生活': '旅・暮らし',
          '藝術設計': 'アート・デザイン', '人文語言': '人文・語学'
        }[c] || c;
      },
      author: function (a) { return ['著：', a]; },
      month: function (y, m) { return y + '年' + m + '月'; },
      latestNote: function (y, m) { return '最新刊：' + y + '年' + m + '月'; },
      alt: function (t) { return '『' + t + '』表紙'; }
    }
  };
  var L = LABELS[window.SHELF_LANG] || LABELS.zh;
  var data = window.BOOK_DATA;
  var books = data.books.map(function (b) {
    return { title: b[0], author: b[1], publisher: b[2], date: b[3], isbn: b[4], cat: b[5], id: b[6], cover: b[7] };
  }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  function ym(d) { return [d.slice(0, 4), +d.slice(5, 7)]; }

  var years = books.map(function (b) { return +b.date.slice(0, 4); });
  document.getElementById('total').textContent = books.length;
  document.getElementById('since').textContent = Math.min.apply(null, years);
  document.getElementById('updated').textContent = data.updated.replace(/-/g, '.');

  // 封面：先試博客來縮圖，再試原圖、誠品圖，都失敗就改成印著書名的色塊
  function coverSources(book) {
    var list = [];
    if (book.id) {
      var img = 'https://www.books.com.tw/img/' + book.id.slice(0, 3) + '/' + book.id.slice(3, 6) + '/' + book.id.slice(6, 8) + '/' + book.id + '.jpg';
      list.push('https://im1.book.com.tw/image/getImage?i=' + img + '&w=300&h=450', img);
    }
    if (book.cover) list.push('https://s2.eslite.com/unsafe/fit-in/x450/s.eslite.com' + book.cover, 'https://s.eslite.com' + book.cover);
    return list;
  }
  function makeCover(book) {
    var box = document.createElement('div');
    box.className = 'cover';
    var srcs = coverSources(book);
    function blank() { box.className = 'cover blank'; box.textContent = book.title; }
    if (!srcs.length) { blank(); return box; }
    var img = document.createElement('img');
    img.alt = L.alt(book.title);
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    var i = 0;
    img.onerror = function () { i += 1; if (i < srcs.length) { img.src = srcs[i]; } else { blank(); } };
    img.src = srcs[0];
    box.appendChild(img);
    return box;
  }
  function makeBook(book, showMonth) {
    var li = document.createElement('li');
    li.className = 'book';
    var a = document.createElement('a');
    a.href = book.id ? 'https://www.books.com.tw/products/' + book.id : 'https://search.books.com.tw/search/query/key/' + encodeURIComponent(book.isbn || book.title) + '/cat/all';
    a.target = '_blank'; a.rel = 'noopener';
    a.appendChild(makeCover(book));
    if (showMonth) {
      var w = document.createElement('span'); w.className = 'when';
      w.textContent = L.month.apply(null, ym(book.date)); a.appendChild(w);
    }
    var h = document.createElement('h3'); h.lang = 'zh-Hant'; h.textContent = book.title; a.appendChild(h);
    li.appendChild(a);
    var m = document.createElement('p'); m.className = 'meta';
    L.author(book.author).forEach(function (part) {
      if (part === book.author) { var b = document.createElement('b'); b.textContent = part; m.appendChild(b); }
      else m.appendChild(document.createTextNode(part));
    });
    m.appendChild(document.createElement('br'));
    m.appendChild(document.createTextNode(book.publisher + '・' + book.date.slice(0, 4)));
    li.appendChild(m);
    return li;
  }

  // 最新譯作：自動取出版日期最新的 6 本
  var latest = document.getElementById('latest');
  books.slice(0, 6).forEach(function (b) { latest.appendChild(makeBook(b, true)); });
  document.getElementById('latest-note').textContent = L.latestNote.apply(null, ym(books[0].date));

  var shelf = document.getElementById('shelf');
  var chips = document.getElementById('chips');
  var current = 'ALL';

  function render() {
    shelf.textContent = '';
    data.categories.forEach(function (cat) {
      if (current !== 'ALL' && current !== cat) return;
      var list = books.filter(function (b) { return b.cat === cat; });
      if (!list.length) return;
      var sec = document.createElement('section'); sec.className = 'section';
      var h2 = document.createElement('h2'); h2.textContent = L.cat(cat);
      var n = document.createElement('small'); n.textContent = L.count(list.length); h2.appendChild(n);
      var ul = document.createElement('ul'); ul.className = 'grid';
      list.forEach(function (b) { ul.appendChild(makeBook(b)); });
      sec.appendChild(h2); sec.appendChild(ul); shelf.appendChild(sec);
    });
    Array.prototype.forEach.call(chips.children, function (c) {
      c.setAttribute('aria-pressed', c.dataset.cat === current ? 'true' : 'false');
    });
  }
  function addChip(key, label, count) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.cat = key; b.textContent = label;
    var s = document.createElement('small'); s.textContent = count; b.appendChild(s);
    b.addEventListener('click', function () { current = key; render(); window.scrollTo({ top: chips.parentNode.offsetTop, behavior: 'auto' }); });
    chips.appendChild(b);
  }
  addChip('ALL', L.all, books.length);
  data.categories.forEach(function (cat) {
    var n = books.filter(function (b) { return b.cat === cat; }).length;
    if (n) addChip(cat, L.cat(cat), n);
  });
  render();
})();
