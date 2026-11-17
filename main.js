import {
  escapeHTML,
  getMealDateString,
  formatMealDate,
  formatMonthDay,
  daysLeft
} from './utils';
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
import { renderFoods } from './foodView';
import { renderMealView } from './mealView';
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
// 現在表示しているタブ
let currentTab = 'meals';
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
      renderFoods(foods, currentFilter, upcomingMeals);
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

// 献立の日付を変更する
async function changeMealDate(amount) {
  const newDate = new Date(selectedMealDate);
  newDate.setDate(newDate.getDate() + amount);

  selectedMealDate = newDate;
  currentMealType = null;

  await loadMeals();
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

      ${currentTab === 'meals'
        ? renderMealView({
            meals,
            foods,
            selectedMealDate,
            previousMealDate,
            nextMealDate,
            todayLabel
          })
        : ''}

      ${currentTab === 'foods' ? `
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
      ` : ''}

      ${currentTab === 'shopping' ? `
        <section class="shopping-section">
          <div class="section-heading">
            <h2>買い物リスト</h2>
          </div>
          <p class="empty">買い物リストはまだありません。</p>
        </section>
      ` : ''}

      <nav class="bottom-nav">
        <button
          class="nav-item ${currentTab === 'meals' ? 'selected' : ''}"
          data-tab="meals"
          type="button"
        >
          <span>♡</span>
          献立
        </button>

        <button
          class="nav-item ${currentTab === 'foods' ? 'selected' : ''}"
          data-tab="foods"
          type="button"
        >
          <span>▦</span>
          食材リスト
        </button>

        <button
          class="nav-item ${currentTab === 'shopping' ? 'selected' : ''}"
          data-tab="shopping"
          type="button"
        >
          <span>☑</span>
          買い物リスト
        </button>
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
  renderFoods(foods, currentFilter, upcomingMeals);
  bindEvents();
}

function bindEvents() {
  // 設定メニューの開閉
  const settingsButton = document.querySelector('#settings-button');
  const settingsMenu = document.querySelector('#settings-menu');

  settingsButton.addEventListener('click', () => {
    settingsMenu.classList.toggle('hidden');
  });

  // 下部ナビゲーションのタブ切り替え
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      if (currentTab === tab) return;

      currentTab = tab;
      render();
    });
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

  const searchInput = document.querySelector('#search');

  if (searchInput) {
    searchInput.addEventListener('input', event => {
      renderFoods(
        foods,
        currentFilter,
        upcomingMeals,
        event.target.value
      );
    });
  }

  // 食品追加するボタンを押してモーダルを開く
  const addButton = document.querySelector('#add-button');

  if (addButton) {
    addButton.addEventListener('click', () => {
      const modal = document.querySelector('#modal');

      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  }

  document.querySelector('#close-modal').addEventListener('click', () => {
    editingFoodId = null;

    document.querySelector('#food-form').reset();
    document.querySelector('.modal-header h2').textContent = '食品を追加';
    document.querySelector('.submit-button').textContent = '登録する';

    document.querySelector('#modal').classList.add('hidden');
  });

  // 「食材を追加」モーダルで登録ボタンを押したときと、食品一覧で編集ボタンを押した時の処理
  const foodForm = document.querySelector('#food-form');

  if (foodForm) {
    foodForm.addEventListener('submit', async event => {
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

      const modalTitle = document.querySelector('.modal-header h2');
      const submitButton = document.querySelector('.submit-button');

      if (modalTitle) {
        modalTitle.textContent = '食品を追加';
      }

      if (submitButton) {
        submitButton.textContent = '登録する';
      }
    });
  }

  // 食品一覧のクリックイベント
  const foodList = document.querySelector('#food-list');

  if (foodList) {
    foodList.addEventListener('click', event => {
      const button = event.target.closest('.delete-button');

      if (!button) {
        return;
      }

      const foodId = button.dataset.id;

      handleDeleteFood(foodId);
    });
  }

  // 食品編集ボタン
  const foodListForEdit = document.querySelector('#food-list');

  if (foodListForEdit) {
    foodListForEdit.addEventListener('click', event => {
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

      // フォームを取得
      const form = document.querySelector('#food-form');
      const modal = document.querySelector('#modal');
      const modalTitle = document.querySelector('.modal-header h2');
      const submitButton = document.querySelector('.submit-button');

      if (!form || !modal || !modalTitle || !submitButton) {
        return;
      }

      // フォームに既存の値をセット
      form.elements.namedItem('food-name').value = food.name;
      form.elements.namedItem('quantity').value = food.quantity;
      form.elements.namedItem('place').value = food.place;
      form.elements.namedItem('expiry-date').value = food.expiryDate;

      // モーダルのタイトルとボタンを変更
      modalTitle.textContent = '食品を編集';
      submitButton.textContent = '更新する';

      // モーダルを表示
      modal.classList.remove('hidden');
    });
  }

  // 献立の日付切り替え
  const previousMealDateButton = document.querySelector('#previous-meal-date');

  if (previousMealDateButton) {
    previousMealDateButton.addEventListener('click', () => {
      changeMealDate(-1);
    });
  }

  // 今日へ戻る
  const todayMealDateButton = document.querySelector('#today-meal-date');

  if (todayMealDateButton) {
    todayMealDateButton.addEventListener('click', async () => {
      selectedMealDate = new Date();
      selectedMealDate.setHours(0, 0, 0, 0);

      currentMealType = null;

      await loadMeals();
    });
  }

  // 翌日へ
  const nextMealDateButton = document.querySelector('#next-meal-date');

  if (nextMealDateButton) {
    nextMealDateButton.addEventListener('click', () => {
      changeMealDate(1);
    });
  }

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