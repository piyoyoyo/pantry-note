import {
  getMeals,
  getUpcomingMeals,
  addMeal,
  updateMeal,
  deleteMeal
} from './meals';
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

let meals = [];
// 今日以降の献立
let upcomingMeals = [];
let currentMealType = null;
// 献立モーダル用
let editingMealId = null;
let selectedIngredientIds = [];
let ingredientFilter = 'すべて';
let isMealModalOpen = false;
let mealNameInput = '';
let mealRecipeUrlInput = '';
let foods = [];
let currentUser = null;
let currentFilter = 'すべて';
let editingFoodId = null;
let currentHouseholdId = null;
let currentHouseholdName = "";
let selectedMealDate = new Date();
selectedMealDate.setHours(0, 0, 0, 0);

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

// 日付を YYYY-MM-DD 形式に変換する関数
function getMealDateString(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

// 指定した日付の献立を取得
async function loadMeals() {
  if (!currentHouseholdId) return;

  try {
    const date = getMealDateString(selectedMealDate);

    meals = await getMeals(currentHouseholdId, date);

    render();
  } catch (error) {
    console.error('献立の取得に失敗しました:', error);
  }
}

// 今日以降の献立をupcomingMealsに保存する
async function loadUpcomingMeals() {
  if (!currentHouseholdId) return;

  try {
    const today = getMealDateString(new Date());

    upcomingMeals = await getUpcomingMeals(
      currentHouseholdId,
      today
    );
    if (document.querySelector('#food-list')) {
      renderFoods();
    }
  } catch (error) {
    console.error('使用予定の献立取得に失敗しました:', error);
  }
}

// 献立モーダルを開く
function openMealModal(mealType, meal = null) {
  editingMealId = meal ? meal.id : null;

  currentMealType = meal ? meal.type : mealType;

  selectedIngredientIds = meal
    ? [...(meal.ingredientIds || [])]
    : [];

  mealNameInput = meal ? meal.name : '';
  mealRecipeUrlInput = meal ? (meal.recipeUrl || '') : '';

  ingredientFilter = 'すべて';
  isMealModalOpen = true;

  render();
}

// 献立を保存（新規登録・編集）
async function handleSaveMeal(mealName, recipeUrl = '') {
  if (!currentHouseholdId) return;

  const date = getMealDateString(selectedMealDate);

  const mealData = {
    name: mealName,
    ingredientIds: selectedIngredientIds,
    recipeUrl
  };

  try {
    if (editingMealId) {
      // 既存献立を更新
      await updateMeal(
        currentHouseholdId,
        editingMealId,
        mealData
      );

      console.log('献立を更新しました');
    } else {
      // 新しい献立を登録
      await addMeal(currentHouseholdId, {
        ...mealData,
        date,
        type: currentMealType
      });

      console.log('献立を登録しました');
    }

    // モーダルを閉じる
    editingMealId = null;
    currentMealType = null;
    selectedIngredientIds = [];
    mealNameInput = '';
    mealRecipeUrlInput = '';
    isMealModalOpen = false;

    await loadMeals();

  } catch (error) {
    console.error('献立の保存に失敗しました:', error);
    alert('献立を保存できませんでした。');
  }
}

// 献立を削除
async function handleDeleteMeal(mealId) {
  if (!currentHouseholdId) return;

  if (!confirm('この献立を削除しますか？')) return;

  try {
    await deleteMeal(currentHouseholdId, mealId);
    await loadMeals();
  } catch (error) {
    console.error('献立の削除に失敗しました:', error);
    alert('献立を削除できませんでした。');
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

// 献立の日付を表示する
function formatMealDate(date) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

// 月日だけを表示する
function formatMonthDay(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 献立の日付を変更する
async function changeMealDate(amount) {
  const newDate = new Date(selectedMealDate);
  newDate.setDate(newDate.getDate() + amount);

  selectedMealDate = newDate;
  currentMealType = null;

  await loadMeals();
}

// 献立に登録されている材料名を取得
function getMealIngredientNames(meal) {
  const ingredientIds = meal.ingredientIds || [];

  return ingredientIds
    .map(id => {
      const food = foods.find(item => item.id === id);
      return food ? food.name : null;
    })
    .filter(name => name !== null);
}

// 食品の最も近い使用予定を取得
function getFoodUpcomingMeal(foodId) {
  // 各食事の予定時刻
  const mealTimes = {
    breakfast: '10:00',
    lunch: '15:00',
    dinner: '21:00'
  };

  const now = new Date();

  // 今日の日付
  const today = getMealDateString(now);

  // 現在時刻
  const currentTime =
    `${String(now.getHours()).padStart(2, '0')}:` +
    `${String(now.getMinutes()).padStart(2, '0')}`;

  const matchingMeals = upcomingMeals
    .filter(meal => {
      // この食品が材料に含まれているか
      if (!(meal.ingredientIds || []).includes(foodId)) {
        return false;
      }

      // 今日より未来の日付なら対象
      if (meal.date > today) {
        return true;
      }

      // 今日より過去の日付なら対象外
      if (meal.date < today) {
        return false;
      }

      // 今日の献立は予定時刻がまだ来ていなければ対象
      const scheduledTime = mealTimes[meal.type];

      return scheduledTime && currentTime < scheduledTime;
    })
    .sort((a, b) => {
      // 日付が早い順
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      // 同じ日なら朝食・昼食・夕食の順
      const mealTypeOrder = {
        breakfast: 1,
        lunch: 2,
        dinner: 3
      };

      return (
        (mealTypeOrder[a.type] || 99) -
        (mealTypeOrder[b.type] || 99)
      );
    });

  return matchingMeals[0] || null;
}

// 使用予定の表示文字列を作成
function getFoodUpcomingMealLabel(foodId) {
  const meal = getFoodUpcomingMeal(foodId);

  if (!meal) return '';

  const [year, month, day] = meal.date.split('-');

  const mealTypeLabels = {
    breakfast: '朝食',
    lunch: '昼食',
    dinner: '夕食'
  };

  return `${Number(month)}月${Number(day)}日 ${mealTypeLabels[meal.type] || ''}で使用予定`;
}

// 材料選択用のタグを生成
function renderIngredientTags() {
  const filteredFoods = foods.filter(food => {
    return ingredientFilter === 'すべて'
      || food.place === ingredientFilter;
  });

  if (filteredFoods.length === 0) {
    return '<p class="ingredient-empty">該当する食品がありません。</p>';
  }

  return filteredFoods.map(food => {
    const selected = selectedIngredientIds.includes(food.id);

    return `
      <button
        type="button"
        class="ingredient-tag ${selected ? 'selected' : ''}"
        data-id="${escapeHTML(food.id)}"
      >
        ${escapeHTML(food.name)}
        ${selected ? ' ✓' : ''}
      </button>
    `;
  }).join('');
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
            <p class="eyebrow">MEAL HELPER</p>
            <h1>ミールヘルパー 🥬</h1>
          </div>
        </header>

        <section class="household-card">
          <h2>家を作成しましょう</h2>

          <p>
            家を作成すると、家族みんなで
            同じ献立、冷蔵庫・パントリーの食材を共有できるようになります。
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

  // 献立を表示する日付
  const todayLabel = formatMealDate(selectedMealDate);

  // 前日の日付
  const previousMealDate = new Date(selectedMealDate);
  previousMealDate.setDate(previousMealDate.getDate() - 1);

  // 翌日の日付
  const nextMealDate = new Date(selectedMealDate);
  nextMealDate.setDate(nextMealDate.getDate() + 1);

  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <header class="header">
        <div>
          <p class="eyebrow">MEAL HELPER</p>
          <h1>ミールヘルパー</h1>
          <p class="subheading">${escapeHTML(currentHouseholdName)}</p>
        </div>

        <div class="header-actions">
          <button
            id="settings-button"
            class="settings-button"
            type="button"
            aria-label="設定メニューを開く"
          >
            ⚙
          </button>

          <div id="settings-menu" class="settings-menu hidden">
            <button
              id="invite-button"
              class="settings-menu-item"
              type="button"
            >
              家族を招待する
            </button>
          </div>
        </div>
      </header>

      <section class="meal-section">
        <div class="meal-date-navigation">
          <button id="previous-meal-date" type="button">
            ‹ ${formatMonthDay(previousMealDate)}
          </button>

          <button id="today-meal-date" type="button">
            今日に戻る
          </button>

          <button id="next-meal-date" type="button">
            ${formatMonthDay(nextMealDate)} ›
          </button>
        </div>

        <div class="section-heading">
          <h2>${getMealDateString(selectedMealDate) === getMealDateString(new Date())
            ? '今日の献立'
            : `${todayLabel}の献立`}</h2>
        </div>

        ${[
            { type: 'breakfast', label: '朝食', icon: '🌅' },
            { type: 'lunch', label: '昼食', icon: '☀️' },
            { type: 'dinner', label: '夕食', icon: '🌙' }
          ].map(mealType => {
            const typeMeals = meals.filter(
              meal => meal.type === mealType.type
            );

            return `
              <div class="meal-card">
                <div class="meal-title">
                  <span>${mealType.icon}</span>
                  <h3>${mealType.label}</h3>
                </div>

                <div class="meal-list">
                  ${typeMeals.length
                    ? typeMeals.map(meal => `
                        <div class="meal-item">
                          <div class="meal-item-info">
                            <button
                              class="meal-name-button"
                              data-id="${escapeHTML(meal.id)}"
                              type="button"
                            >
                              ${escapeHTML(meal.name)}
                            </button>
                            ${meal.recipeUrl
                              ? `
                                <a
                                  class="meal-recipe-link"
                                  href="${escapeHTML(meal.recipeUrl)}"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  🔗 レシピを見る
                                </a>
                              `
                              : ''}

                            <div class="meal-ingredients">
                              ${(() => {
                                const ingredientNames = getMealIngredientNames(meal);

                                return ingredientNames.length
                                  ? `使用する食材：${ingredientNames.map(name => escapeHTML(name)).join('、')}`
                                  : '材料は登録されていません';
                              })()}
                            </div>
                          </div>

                          <button
                            class="meal-delete-button"
                            data-id="${escapeHTML(meal.id)}"
                            type="button"
                            aria-label="${escapeHTML(meal.name)}を削除"
                          >×</button>
                        </div>
                      `).join('')
                    : '<p class="meal-empty">献立はまだ登録されていません</p>'
                  }
                </div>

                <button
                  class="meal-add-button"
                  data-type="${mealType.type}"
                  type="button"
                >＋ 献立を追加</button>
              </div>
            `;
          }).join('')}
      </section>

      <section class="expiry-section">
        <div class="expiry-icon">⏰</div>
        <div>
          <strong>期限切れの食品</strong>
          <ul class="expired-list">
            ${
              foods
                .filter(f =>
                  f.expiryDate &&
                  daysLeft(f.expiryDate) < 0
                )
                .sort((a, b) =>
                  daysLeft(a.expiryDate) - daysLeft(b.expiryDate)
                )
                .map(f => `
                  <li>
                    <span class="expired-food-name">${f.name}</span>
                    <span class="expired-days">
                      ${Math.abs(daysLeft(f.expiryDate))}日超過
                    </span>
                  </li>
                `)
                .join('')
            }
          </ul>
        </div>
        <div>
          <strong>期限が近い食品</strong>
          <ul class="expiry-list">
            ${
              foods
                .filter(f =>
                  f.expiryDate && 
                  daysLeft(f.expiryDate) >= 0 &&
                  daysLeft(f.expiryDate) <= 3
                )
                .sort((a, b) =>
                  daysLeft(a.expiryDate) - daysLeft(b.expiryDate)
                )
                .map(f => `
                  <li>
                    <span class="expiry-food-name">${f.name}</span>
                    <span class="expiry-days">
                      ${daysLeft(f.expiryDate) === 0
                        ? '今日まで'
                        : `${f.expiryDate}まで あと${daysLeft(f.expiryDate)}日`}
                    </span>
                  </li>
                `)
                .join('')
            }
          </ul>
        </div>
      </section>

      <button id="add-button" class="add-button">＋ 食品を追加する</button>

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

      <nav class="bottom-nav">
        <div class="nav-item selected"><span>▦</span>献立</div>
        <div class="nav-item"><span>♡</span>食材リスト</div>
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

      <div id="meal-modal" class="modal ${isMealModalOpen ? '' : 'hidden'}">
        <div class="modal-card meal-modal-card">
          <div class="modal-header">
            <h2>${editingMealId ? '献立を編集' : '献立を登録'}</h2>
            <button
              id="close-meal-modal"
              class="close-button"
              type="button"
            >×</button>
          </div>

          <form id="meal-form">
            <label for="meal-name">献立名</label>
            <input
              id="meal-name"
              name="meal-name"
              type="text"
              placeholder="例：車麩の唐揚げ"
              maxlength="50"
              value="${escapeHTML(mealNameInput)}"
              required
            />

            <label>材料</label>

            <div class="ingredient-filters">
              ${['すべて', '冷蔵', '冷凍', '常温'].map(filter => `
                <button
                  type="button"
                  class="ingredient-filter ${ingredientFilter === filter ? 'active' : ''}"
                  data-filter="${filter}"
                >${filter}</button>
              `).join('')}
            </div>

            <div class="ingredient-tags">
              ${renderIngredientTags()}
            </div>

            <p class="ingredient-selected-count">
              ${selectedIngredientIds.length}点の食材を選択中
            </p>

            <div class="recipe-url-section">
              <label for="meal-recipe-url">レシピURL（任意）</label>

              <input
                id="meal-recipe-url"
                name="recipe-url"
                type="url"
                placeholder="https://example.com/recipe"
                value="${escapeHTML(mealRecipeUrlInput)}"
              />

              <button
                id="recipe-search-button"
                type="button"
                class="recipe-search-button"
              >
                🔍 レシピをWebで検索
              </button>
            </div>

            <div class="meal-modal-actions">
              <button
                id="cancel-meal-modal"
                type="button"
                class="meal-cancel-button"
              >キャンセル</button>

              <button
                type="submit"
                class="submit-button"
              >保存する</button>
            </div>
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
              ${getFoodUpcomingMealLabel(food.id)
                ? `<div class="food-upcoming-meal">📅 ${escapeHTML(getFoodUpcomingMealLabel(food.id))}</div>`
                : ''}
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
  // 設定メニューの開閉
  const settingsButton = document.querySelector('#settings-button');
  const settingsMenu = document.querySelector('#settings-menu');

  settingsButton.addEventListener('click', () => {
    settingsMenu.classList.toggle('hidden');
  });

  // 家族招待ボタン
  document.querySelector('#invite-button')
    .addEventListener('click', () => {
      settingsMenu.classList.add('hidden');
      handleCreateInvite();
    });

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

  // 献立の日付切り替え
  document.querySelector('#previous-meal-date')
    .addEventListener('click', () => {
      changeMealDate(-1);
    });

  document.querySelector('#today-meal-date')
    .addEventListener('click', async () => {
      selectedMealDate = new Date();
      selectedMealDate.setHours(0, 0, 0, 0);

      currentMealType = null;

      await loadMeals();
    });

  document.querySelector('#next-meal-date')
    .addEventListener('click', () => {
      changeMealDate(1);
    });

  // 献立の追加ボタン
  document.querySelectorAll('.meal-add-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        openMealModal(button.dataset.type);
      });
    }); 

  // 献立の登録フォーム
  document.querySelectorAll('.meal-form')
    .forEach(form => {
      form.addEventListener('submit', async event => {
        event.preventDefault();

        const mealName = new FormData(form)
          .get('meal-name')
          .trim();

        if (!mealName) return;

        await handleAddMeal(form.dataset.type, mealName);
      });
    });

    // 登録済み献立をクリックして編集モーダルを開く
    document.querySelectorAll('.meal-name-button')
      .forEach(button => {
        button.addEventListener('click', () => {
          const mealId = button.dataset.id;

          // クリックされた献立を取得
          const meal = meals.find(item => item.id === mealId);

          if (!meal) {
            return;
          }

          // 編集モーダルを開く
          openMealModal(meal.type, meal);
        });
      });

  // 献立名の入力値を保持
  document.querySelector('#meal-name')
    .addEventListener('input', event => {
      mealNameInput = event.target.value;
    });

  // レシピURLの入力値を保持
  document.querySelector('#meal-recipe-url')
    .addEventListener('input', event => {
      mealRecipeUrlInput = event.target.value;
    });

  // レシピをWebで検索
  document.querySelector('#recipe-search-button')
    .addEventListener('click', () => {
      const mealName = mealNameInput.trim();

      if (!mealName) {
        alert('先に献立名を入力してください。');
        document.querySelector('#meal-name').focus();
        return;
      }

      const searchUrl =
        `https://www.google.com/search?q=${encodeURIComponent(mealName + ' レシピ')}`;

      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    });

  // 材料タブの切り替え
  document.querySelectorAll('.ingredient-filter')
    .forEach(button => {
      button.addEventListener('click', () => {
        ingredientFilter = button.dataset.filter;
        render();
      });
    });

  // 材料タグの選択・解除
  document.querySelectorAll('.ingredient-tag')
    .forEach(button => {
      button.addEventListener('click', () => {
        const foodId = button.dataset.id;

        if (selectedIngredientIds.includes(foodId)) {
          selectedIngredientIds =
            selectedIngredientIds.filter(id => id !== foodId);
        } else {
          selectedIngredientIds.push(foodId);
        }

        render();
      });
    });

  // 献立の保存
  document.querySelector('#meal-form')
    .addEventListener('submit', async event => {
      event.preventDefault();

      const mealName = mealNameInput.trim();

      if (!mealName) {
        alert('献立名を入力してください。');
        return;
      }

      await handleSaveMeal(mealName, mealRecipeUrlInput);
    });

  // モーダルを閉じる共通処理
  function closeMealModal() {
    editingMealId = null;
    currentMealType = null;
    selectedIngredientIds = [];
    mealNameInput = '';
    mealRecipeUrlInput = '';
    isMealModalOpen = false;

    render();
  }

  // 閉じるボタン
  document.querySelector('#close-meal-modal')
    .addEventListener('click', closeMealModal);

  // キャンセルボタン
  document.querySelector('#cancel-meal-modal')
    .addEventListener('click', closeMealModal);

  // 献立の削除
  document.querySelectorAll('.meal-delete-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        handleDeleteMeal(button.dataset.id);
      });
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
      await loadMeals();
      await loadUpcomingMeals();
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