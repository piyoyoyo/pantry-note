import {
  getFoods,
  addFood,
  deleteFood,
  updateFood
} from './foods';
import { initializeAuth } from './firebase';
import './style.css';
import liff from '@line/liff';

let foods = [];
let currentUser = null;
let currentFilter = 'すべて';
let editingFoodId = null;

// Firestoreから食品一覧を取得して画面を更新
async function loadFoods() {
   if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    foods = await getFoods(currentUser.uid);
    render();
    console.log('食品データの取得に成功しました:', foods);
  } catch (error) {
    console.error('食品データの取得に失敗しました:', error);
  }
}

// 食品の追加
async function handleAddFood(newFood) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    await addFood(currentUser.uid, newFood);

    console.log('食品を保存しました');

    // フォームをリセット
    document.querySelector('#food-form').reset();

    // Firestoreから最新データを取得して画面更新
    await loadFoods();

  } catch (error) {
    console.error('食品の保存に失敗しました:', error);
    alert('食品を保存できませんでした');
  }
}

// 食品の削除
async function handleDeleteFood(foodId) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  // 削除前に確認
  const confirmed = confirm('この食品を削除しますか？');

  if (!confirmed) {
    return;
  }

  try {
    await deleteFood(currentUser.uid, foodId);

    console.log('食品を削除しました');

    // 最新の食品一覧を取得
    await loadFoods();

  } catch (error) {
    console.error('食品の削除に失敗しました:', error);
    alert('食品を削除できませんでした');
  }
}

// 食品情報の更新
async function handleUpdateFood(foodId, updatedFood) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    await updateFood(currentUser.uid, foodId, updatedFood);
    console.log('食品情報を更新しました');

    // 編集モードを解除
    editingFoodId = null;

    // フォームをリセット
    document.querySelector('#food-form').reset();

    // 一覧を再取得
    await loadFoods();

  } catch (error) {
    console.error('食品情報の更新に失敗しました:', error);
    alert('食品情報を更新できませんでした');
  }
}


function daysLeft(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiryDate + 'T00:00:00');
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
          <p>${foods.filter(f => daysLeft(f.expiryDate) <= 3).length} 品の期限が3日以内です</p>
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
            <input name="food-name" placeholder="例：トマト" required />

            <label>数量</label>
            <input name="quantity" placeholder="例：3個" required />

            <label>保存場所</label>
            <select name="place">
              <option>冷蔵</option>
              <option>冷凍</option>
              <option>常温</option>
            </select>

            <label>賞味・消費期限</label>
            <input name="expiry-date" type="date" required />

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
        const days = daysLeft(food.expiryDate);
        let status = days < 0 ? '期限切れ' :
          days === 0 ? '今日まで' : `あと${days}日`;

        const warning = days <= 3 ? 'warning' : '';

        return `
          <article class="food-card">
            <div class="food-symbol">${food.place === '冷凍' ? '❄️' : food.place === '常温' ? '🥫' : '🥬'}</div>
            <div class="food-info">
              <div class="food-name">${escapeHTML(food.name)}</div>
              <div class="food-detail">${escapeHTML(food.quantity)} ・ ${escapeHTML(food.place)}</div>
              <div class="food-date">${escapeHTML(food.expiryDate.replaceAll('-', '/'))}</div>
            </div>
            <div class="food-status ${warning}">${status}</div>
            <div class="food-actions">
              <button
                class="edit-button"
                data-id="${escapeHTML(food.id)}"
                type="button"
              >
                編集
              </button>

              <button
                class="delete-button"
                data-id="${escapeHTML(food.id)}"
                type="button"
                aria-label="${escapeHTML(food.name)}を削除"
              >
                ×
              </button>
            </div>
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

  // モーダルを開く
  document.querySelector('#add-button').addEventListener('click', async () => {
    document.querySelector('#modal').classList.remove('hidden');
  });

  document.querySelector('#close-modal').addEventListener('click', () => {
    editingFoodId = null;

    document.querySelector('#food-form').reset();
    document.querySelector('.modal-header h2').textContent = '食品を追加';
    document.querySelector('.submit-button').textContent = '登録する';

    document.querySelector('#modal').classList.add('hidden');
  });

  // 「食材を追加」モーダルで登録ボタンを押したときと、食品一覧で編集ボタンを押した時の処理
  document.querySelector('#food-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.target);

    // フォームから入力値を取得
    const foodData = {
      name: form.get('food-name'),
      quantity: form.get('quantity'),
      place: form.get('place'),
      expiryDate: form.get('expiry-date')
    };

    if (editingFoodId) {
      // 編集モード：既存食品を更新
      await handleUpdateFood(editingFoodId, foodData);
    } else {
      // 新規登録モード：食品を追加
      await handleAddFood(foodData);
    }

    // モーダルの表示を初期状態に戻す
    editingFoodId = null;
    document.querySelector('.modal-header h2').textContent = '食品を追加';
    document.querySelector('.submit-button').textContent = '登録する';

  });

  // 食品削除ボタン
  document.querySelector('#food-list').addEventListener('click', event => {
    const button = event.target.closest('.delete-button');

    if (!button) {
      return;
    }

    const foodId = button.dataset.id;

    handleDeleteFood(foodId);
  });

  // 食品編集ボタン
  document.querySelector('#food-list').addEventListener('click', event => {
    const button = event.target.closest('.edit-button');

    if (!button) {
      return;
    }

    const foodId = button.dataset.id;

    // 編集対象の食品を取得
    const food = foods.find(item => item.id === foodId);

    if (!food) {
      return;
    }

    // 編集モードにする
    editingFoodId = foodId;

    // フォームに既存の値をセット
    const form = document.querySelector('#food-form');

    form.elements.namedItem('food-name').value = food.name;
    form.elements.namedItem('quantity').value = food.quantity;
    form.elements.namedItem('place').value = food.place;
    form.elements.namedItem('expiry-date').value = food.expiryDate;

    // モーダルのタイトルとボタンを変更
    document.querySelector('.modal-header h2').textContent = '食品を編集';
    document.querySelector('.submit-button').textContent = '更新する';

    // モーダルを表示
    document.querySelector('#modal').classList.remove('hidden');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // 画面を初期表示
  render();

  try {
    // ① Firebase認証を先に実行
    currentUser = await initializeAuth();

    console.log('Firebase authentication success!');
    console.log('User ID:', currentUser.uid);

    const savedFoods = await getFoods(currentUser.uid);
    console.log('savedFoods: ', savedFoods);

    // ② 認証成功後に食品一覧を取得
    await loadFoods();

  } catch (error) {
    console.error('Firebase authentication error:', error);
  }

  liff
    .init({ 
      liffId: import.meta.env.VITE_LIFF_ID
    })
    .then(() => {
      console.log('LIFF initialized');
    })
    .catch((error) => {
      console.error('LIFF error:', error);
      document.querySelector('#app').innerHTML = `
        <h1>create-liff-app</h1>
        <p>LIFF init failed.</p>
        <p><code>${error}</code></p>
        <a href="https://developers.line.biz/ja/docs/liff/" target="_blank" rel="noreferrer">
          LIFF Documentation
        </a>
      `;
    });
});