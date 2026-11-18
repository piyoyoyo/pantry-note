import {
  renderApp,
  createMealDateInfo
} from './render';
import {
  getMealDateString,
  formatMealDate,
} from './utils';
import {
  // 献立関連
  fetchMeals,
  fetchUpcomingMeals,
  saveMealData,
  removeMealData,
} from './dataController';
import { createHousehold } from './households';
import {
  loadFoods as loadFoodsController,
  handleAddFood as handleAddFoodController,
  handleDeleteFood as handleDeleteFoodController,
  handleUpdateFood as handleUpdateFoodController
} from './foodController';
import {
  loadMeals as loadMealsController
} from './mealController';
import { renderFoods } from './foodView';
import {
  renderIngredientTags
} from './mealView';
import {
  bindEvents,
  bindHouseholdEvents
} from './events';
import { functions } from './firebase';
import { initializeAppServices } from './appInitializer';
import { httpsCallable } from 'firebase/functions';
import './style.css';

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
  await loadFoodsController({
    currentUser,
    currentHouseholdId,

    setFoods(value) {
      foods = value;
    },

    render
  });
}

// 指定した日付の献立を取得
async function loadMeals() {
  await loadMealsController({
    currentHouseholdId,
    selectedMealDate,

    setMeals(value) {
      meals = value;
    },

    render
  });
}

// 今日以降の献立をupcomingMealsに保存する
async function loadUpcomingMeals() {
  if (!currentHouseholdId) return;

  try {
    upcomingMeals = await fetchUpcomingMeals(currentHouseholdId);

    if (document.querySelector('#food-list')) {
      renderFoodList();
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
    await saveMealData({
      householdId: currentHouseholdId,
      editingMealId,
      mealData,
      date,
      mealType: currentMealType
    });

    if (editingMealId) {
      console.log('献立を更新しました');
    } else {
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
    await removeMealData(currentHouseholdId, mealId);
    await loadMeals();
  } catch (error) {
    console.error('献立の削除に失敗しました:', error);
    alert('献立を削除できませんでした。');
  }
}

// 食品の追加
async function handleAddFood(newFood) {
  await handleAddFoodController({
    currentUser,
    currentHouseholdId,
    newFood,
    loadFoods
  });
}

// 食品の削除
async function handleDeleteFood(foodId) {
  await handleDeleteFoodController({
    currentUser,
    currentHouseholdId,
    foodId,
    loadFoods
  });
}

// 食品情報の更新
async function handleUpdateFood(foodId, updatedFood) {
  await handleUpdateFoodController({
    currentUser,
    currentHouseholdId,
    foodId,
    updatedFood,

    setEditingFoodId(value) {
      editingFoodId = value;
    },

    loadFoods
  });
}

// 献立の日付を変更する
async function changeMealDate(amount) {
  const newDate = new Date(selectedMealDate);
  newDate.setDate(newDate.getDate() + amount);

  selectedMealDate = newDate;
  currentMealType = null;

  await loadMeals();
}

function render() {
  // 献立画面に表示する日付情報
  const {
    todayLabel,
    previousMealDate,
    nextMealDate
  } = createMealDateInfo(selectedMealDate, formatMealDate);

  // 画面を描画
  renderApp({
    currentHouseholdId,
    currentHouseholdName,
    currentTab,
    currentFilter,
    foods,
    meals,
    upcomingMeals,
    selectedMealDate,
    previousMealDate,
    nextMealDate,
    todayLabel,
    isMealModalOpen,
    editingMealId,
    mealNameInput,
    mealRecipeUrlInput,
    ingredientFilter,
    selectedIngredientIds,
    ingredientTagsHtml: renderIngredientTags({
      foods,
      ingredientFilter,
      selectedIngredientIds
    })
  });

  // 家の作成画面の場合
  if (!currentHouseholdId) {
    bindHouseholdEvents({
      handleCreateHousehold
    });
    return;
  }

  // 食品一覧を描画
  renderFoodList();

  // イベントを登録
  bindAppEvents();
}

// アプリのイベントを登録
function bindAppEvents() {
  bindEvents({
    state: {
      get currentTab() { return currentTab; },
      set currentTab(value) { currentTab = value; },

      get currentFilter() { return currentFilter; },
      set currentFilter(value) { currentFilter = value; },

      get editingFoodId() { return editingFoodId; },
      set editingFoodId(value) { editingFoodId = value; },

      get foods() { return foods; },
      get upcomingMeals() { return upcomingMeals; },

      get selectedMealDate() { return selectedMealDate; },
      set selectedMealDate(value) { selectedMealDate = value; },

      get currentMealType() { return currentMealType; },
      set currentMealType(value) { currentMealType = value; },

      get meals() { return meals; },

      get mealNameInput() { return mealNameInput; },
      set mealNameInput(value) { mealNameInput = value; },

      get mealRecipeUrlInput() { return mealRecipeUrlInput; },
      set mealRecipeUrlInput(value) { mealRecipeUrlInput = value; },

      get ingredientFilter() { return ingredientFilter; },
      set ingredientFilter(value) { ingredientFilter = value; },

      get selectedIngredientIds() { return selectedIngredientIds; },
      set selectedIngredientIds(value) { selectedIngredientIds = value; },

      get editingMealId() { return editingMealId; },
      set editingMealId(value) { editingMealId = value; },

      get isMealModalOpen() { return isMealModalOpen; },
      set isMealModalOpen(value) { isMealModalOpen = value; }
    },

    actions: {
      render,
      handleCreateInvite,
      handleAddFood,
      handleUpdateFood,
      handleDeleteFood,
      changeMealDate,
      loadMeals,
      openMealModal,
      handleSaveMeal,
      handleDeleteMeal
    }
  });
}

// 食品一覧を描画
function renderFoodList() {
  renderFoods(foods, currentFilter, upcomingMeals);
}

// アプリを起動
async function startApp() {
  document.querySelector('#app').innerHTML = `
    <p>読み込み中...</p>
  `;

  try {
    // アプリの初期化
    const appData = await initializeAppServices();

    currentUser = appData.currentUser;
    currentHouseholdId = appData.currentHouseholdId;
    currentHouseholdName = appData.currentHouseholdName;

    // 画面を表示
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
}

// DOMの読み込み完了後にアプリを起動
document.addEventListener('DOMContentLoaded', startApp);