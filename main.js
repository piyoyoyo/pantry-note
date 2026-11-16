import {
  getFoods,
  addFood,
  deleteFood,
  updateFood
} from './foods';
import {
  createHousehold,
  getUserHousehold,
  getHouseholdName
} from './households';
import { initializeAuth, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import './style.css';
import liff from '@line/liff';

let foods = [];
let currentUser = null;
let currentFilter = 'すべて';
let editingFoodId = null;
let currentHouseholdId = null;
let currentHouseholdName = "";

// 家の作成
async function handleCreateHousehold(householdName) {

  if (!currentUser) {
    alert('ログインが完了していません');
    return;
  }

  try {
    const householdId = await createHousehold(
      currentUser.uid,
      householdName
    );

    // 作成した家のIDを保存
    currentHouseholdId = householdId;
    console.log('家を作成しました:', householdId);
    currentHouseholdName = householdName;

    // 食品管理画面へ切り替え
    await loadFoods();

    alert('家を作成しました！');

  } catch (error) {
    console.error('家の作成に失敗しました:', error);
    alert('家を作成できませんでした');
  }
}

// 家への招待URLを発行する
async function handleCreateInvite() {
  try {
    if (!currentHouseholdId) {
      alert('家の情報が取得できていません。');
      return;
    }

    const createInvite = httpsCallable(functions, 'createInvite');

    const result = await createInvite({
      householdId: currentHouseholdId
    });

    const token = result.data.token;

    const inviteUrl =
      `https://liff.line.me/${import.meta.env.VITE_LIFF_ID}?invite=${encodeURIComponent(token)}&householdId=${encodeURIComponent(currentHouseholdId)}`;

    await navigator.clipboard.writeText(inviteUrl);

    alert('招待URLをコピーしました！\n有効期限は発行から7日間です。');

  } catch (error) {
    console.error('招待URLの発行に失敗しました:', error);
    alert('招待URLの発行に失敗しました。');
  }
}

// Firestoreから食品一覧を取得して画面を更新
async function loadFoods() {
   if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    foods = await getFoods(currentHouseholdId);
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
    await addFood(currentHouseholdId, newFood);

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
    await deleteFood(currentHouseholdId, foodId);

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
    await updateFood(currentHouseholdId, foodId, updatedFood);
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
  // 家に所属していない場合は家の作成画面を表示
  if (!currentHouseholdId) {
    document.querySelector('#app').innerHTML = `
      <div class="household-setup">
        <header class="header">
          <div>
            <p class="eyebrow">PANTRY NOTE</p>
            <h1>食材メモ 🥬</h1>
          </div>
        </header>

        <section class="household-card">
          <h2>家を作成しましょう</h2>

          <p>
            家を作成すると、家族みんなで
            同じ冷蔵庫・パントリーを共有できるようになります。
          </p>

          <form id="household-form">
            <label for="household-name">家の名前</label>

            <input
              id="household-name"
              name="household-name"
              type="text"
              placeholder="例：Koyama家"
              required
              maxlength="30"
            />

            <button type="submit" class="submit-button">
              家を作成する
            </button>
          </form>
        </section>
      </div>
    `;

    // 家の作成フォーム
    document.querySelector('#household-form')
      .addEventListener('submit', async event => {
        event.preventDefault();

        const householdName = new FormData(event.target)
          .get('household-name')
          .trim();

        if (!householdName) {
          alert('家の名前を入力してください');
          return;
        }

        await handleCreateHousehold(householdName);
      });

    return;
  }

  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <header class="header">
        <div>
          <p class="eyebrow">MY KITCHEN</p>
          <h1>${currentHouseholdName}の食材</h1>
          <p class="subheading">食材を管理して、毎日のごはんをもっと楽しく。</p>
        </div>

        <div class="header-actions">
          <button id="invite-button" class="invite-button">
            家族を招待する
          </button>
          <div class="header-icon">⌂</div>
        </div>
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
  // 家族招待ボタン
  document.querySelector('#invite-button')
    .addEventListener('click', handleCreateInvite);

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
  document.querySelector('#app').innerHTML = `
    <p>読み込み中...</p>
  `;

  try {
    // ① LIFFの初期化
    try {
      await liff.init({
        liffId: import.meta.env.VITE_LIFF_ID
      });

      console.log('LIFF initialized');

    } catch (error) {
      console.error('LIFF error:', error);
    }

    // ② 招待URLのパラメータを取得
    const params = new URLSearchParams(window.location.search);

    const inviteToken = params.get('invite');
    const inviteHouseholdId = params.get('householdId');

    console.log('Invite token:', inviteToken);
    console.log('Invite household ID:', inviteHouseholdId);

    // ③ Firebase認証
    currentUser = await initializeAuth();

    console.log('Firebase authentication success!');
    console.log('User ID:', currentUser.uid);

    // ④ 招待URLからアクセスした場合
    if (inviteToken || inviteHouseholdId) {

      if (!inviteToken || !inviteHouseholdId) {
        throw new Error('招待URLの情報が不足しています。');
      }

      const acceptInviteCallable =
        httpsCallable(functions, 'acceptInvite');

      await acceptInviteCallable({
        householdId: inviteHouseholdId,
        token: inviteToken
      });

      alert('家への参加が完了しました！');
    }

    // ⑤ 所属している家を取得
    currentHouseholdId = await getUserHousehold(currentUser.uid);

    console.log('Household ID:', currentHouseholdId);

    // ⑥ 家の名前を取得
    if (currentHouseholdId) {
      currentHouseholdName =
        await getHouseholdName(currentHouseholdId);

      console.log('Household Name:', currentHouseholdName);
    }

    // ⑦ 画面を表示
    if (currentHouseholdId) {
      await loadFoods();
    } else {
      render();
    }

  } catch (error) {
    console.error('初期化・招待参加エラー:', error);

    alert(
      '処理に失敗しました。\n' +
      (error.message || 'もう一度お試しください。')
    );

    // すでに家に所属している場合は食品画面を表示
    if (currentHouseholdId) {
      await loadFoods();
    } else {
      render();
    }
  }
});