import './style.css';
import liff from '@line/liff';

const foods = [
  { id: 1, name: '牛乳', quantity: '1本', place: '冷蔵', date: '2026-11-14', category: '乳製品' },
  { id: 2, name: '卵', quantity: '6個', place: '冷蔵', date: '2026-11-18', category: '卵' },
  { id: 3, name: 'にんじん', quantity: '3本', place: '冷蔵', date: '2026-11-20', category: '野菜' },
  { id: 4, name: '鶏むね肉', quantity: '300g', place: '冷凍', date: '2026-12-10', category: '肉・魚' },
  { id: 5, name: '食パン', quantity: '4枚', place: '常温', date: '2026-11-13', category: 'その他' }
];

let currentFilter = 'すべて';

function daysLeft(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + 'T00:00:00');
  return Math.ceil((target - today) / 86400000);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function render() {
  document.querySelector('#app').innerHTML = `
    <p>LIFF init succeeded.</p>

    <div class="app-shell">
      <header class="header">
        <div>
          <p class="eyebrow">MY KITCHEN</p>
          <h1>食材メモ <span>🥬</span></h1>
          <p class="subheading">食材を管理して、毎日のごはんをもっと楽しく。</p>
        </div>
        <div class="header-icon">⌂</div>
      </header>

      <section class="summary">
        <div class="summary-label">現在の食品ストック</div>
        <div class="summary-number">
          ${foods.length}<span> 品</span>
        </div>
        <div class="summary-note">おうちにある食材をチェックしましょう</div>
      </section>

      <section class="expiry-section">
        <div class="expiry-icon">⏰</div>
        <div>
          <strong>期限が近い食品</strong>
          <p>${foods.filter(f => daysLeft(f.date) <= 3).length} 品の期限が3日以内です</p>
        </div>
      </section>

      <div class="section-heading">
        <h2>食品リスト</h2>
        <span>${foods.length} ITEMS</span>
      </div>

       <input id="search" class="search" placeholder="⌕  食品を検索..." />

      <div class="filters">
        ${['すべて', '冷蔵', '冷凍', '常温'].map(filter => `
          <button class="filter ${currentFilter === filter ? 'active' : ''}"
            data-filter="${filter}">${filter}</button>
        `).join('')}
      </div>

      <div id="food-list" class="food-list"></div>

      <button id="add-button" class="add-button">＋ 食品を追加する</button>

      <nav class="bottom-nav">
        <div class="nav-item selected"><span>▦</span>食品リスト</div>
        <div class="nav-item"><span>♡</span>お気に入り</div>
        <div class="nav-item"><span>☑</span>買い物リスト</div>
      </nav>

      <div id="modal" class="modal hidden">
        <div class="modal-card">
          <div class="modal-header">
            <h2>食品を追加</h2>
            <button id="close-modal" class="close-button">×</button>
          </div>

          <form id="food-form">
            <label>食品名</label>
            <input name="name" placeholder="例：トマト" required />

            <label>数量</label>
            <input name="quantity" placeholder="例：3個" required />

            <label>保存場所</label>
            <select name="place">
              <option>冷蔵</option>
              <option>冷凍</option>
              <option>常温</option>
            </select>

            <label>賞味・消費期限</label>
            <input name="date" type="date" required />

            <button class="submit-button" type="submit">登録する</button>
          </form>
        </div>
      </div>
    </div>
  `
  renderFoods();
  bindEvents();
}

function renderFoods(keyword = '') {
  const list = document.querySelector('#food-list');

  const filtered = foods.filter(food => {
    const matchesFilter =
      currentFilter === 'すべて' || food.place === currentFilter;
    const matchesKeyword = food.name.includes(keyword);
    return matchesFilter && matchesKeyword;
  });

  list.innerHTML = filtered.length
    ? filtered.map(food => {
        const days = daysLeft(food.date);
        let status = days < 0 ? '期限切れ' :
          days === 0 ? '今日まで' : `あと${days}日`;

        const warning = days <= 3 ? 'warning' : '';

        return `
          <article class="food-card">
            <div class="food-symbol">${food.place === '冷凍' ? '❄️' : food.place === '常温' ? '🥫' : '🥬'}</div>
            <div class="food-info">
              <div class="food-name">${escapeHTML(food.name)}</div>
              <div class="food-detail">${escapeHTML(food.quantity)} ・ ${escapeHTML(food.place)}</div>
              <div class="food-date">${escapeHTML(food.date.replaceAll('-', '/'))}</div>
            </div>
            <div class="food-status ${warning}">${status}</div>
          </article>
        `;
      }).join('')
    : '<p class="empty">食品が見つかりませんでした。</p>';
}

function bindEvents() {
  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });

  document.querySelector('#search').addEventListener('input', event => {
    renderFoods(event.target.value);
  });

  document.querySelector('#add-button').addEventListener('click', () => {
    document.querySelector('#modal').classList.remove('hidden');
  });

  document.querySelector('#close-modal').addEventListener('click', () => {
    document.querySelector('#modal').classList.add('hidden');
  });

  document.querySelector('#food-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.target);

    foods.unshift({
      id: Date.now(),
      name: form.get('name'),
      quantity: form.get('quantity'),
      place: form.get('place'),
      date: form.get('date'),
      category: 'その他'
    });

    render();
  });
}

liff
  .init({
    liffId: import.meta.env.VITE_LIFF_ID
  })
  .then(() => {
    render();
  //   document.querySelector('#app').innerHTML = `
  //   <h1>create-liff-app</h1>
  //   <p>LIFF init succeeded.</p>
  //   <a href="https://developers.line.biz/ja/docs/liff/" target="_blank" rel="noreferrer">
  //     LIFF Documentation
  //   </a>
  // `;
  })
  .catch((error) => {
    document.querySelector('#app').innerHTML = `
    <h1>create-liff-app</h1>
    <p>LIFF init failed.</p>
    <p><code>${error}</code></p>
    <a href="https://developers.line.biz/ja/docs/liff/" target="_blank" rel="noreferrer">
      LIFF Documentation
    </a>
  `;
  });
