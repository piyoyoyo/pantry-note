import {
  renderApp,
  createMealDateInfo
} from './render';
import {
  handleCreateHousehold as handleCreateHouseholdController,
  handleCreateInvite as handleCreateInviteController
} from './householdController';
import { formatMealDate } from './utils';
import {
  loadMeals as loadMealsController,
  loadUpcomingMeals as loadUpcomingMealsController,
  handleSaveMeal as handleSaveMealController,
  handleDeleteMeal as handleDeleteMealController,
  changeMealDate as changeMealDateController,
  openMealModal as openMealModalController
} from './mealController';
import {
  loadFoods as loadFoodsController,
  handleAddFood as handleAddFoodController,
  handleDeleteFood as handleDeleteFoodController,
  handleUpdateFood as handleUpdateFoodController
} from './foodController';
import {
  loadShoppingItems as loadShoppingItemsController,
  handleAddShoppingItem as handleAddShoppingItemController,
  handleUpdateShoppingStatus as handleUpdateShoppingStatusController
} from './shoppingController';
import { renderIngredientTags } from './mealView';
import { renderFoods } from './foodView';
import { renderShoppingList } from './shoppingView';
import { fetchShoppingItems } from './dataController';
import {
  // 食品関連の状態変数
  setFoods,
  setEditingFoodId,
  // 買い物リストの状態変数
  setShoppingItems,
  // 献立関連の状態変数
  setMeals,
  setMealDateInput,
  setUpcomingMeals,
  setCurrentMealType,
  setEditingMealId,
  setSelectedIngredientIds,
  setIngredientFilter,
  setIsMealModalOpen,
  setMealNameInput,
  setMealRecipeUrlInput,
  // 表示中の日付の状態変数
  setSelectedMealDate,
  // 家の状態変数
  setCurrentHouseholdId,
  setCurrentHouseholdName,
  // 状態をまとめたstateオブジェクト
  state
} from './state';
import {
  bindEvents,
  bindHouseholdEvents
} from './events';
import { initializeAppServices } from './appInitializer';
import './style.css';

// 家の作成
async function handleCreateHousehold(householdName) {
  await handleCreateHouseholdController({
    currentUser: state.currentUser,
    householdName,

    setCurrentHouseholdId,
    setCurrentHouseholdName,

    loadFoods
  });
}

// 家への招待URLを発行する
async function handleCreateInvite() {
  await handleCreateInviteController({
    currentHouseholdId: state.currentHouseholdId
  });
}

// Firestoreから食品一覧を取得して画面を更新
async function loadFoods() {
  await loadFoodsController({
    currentUser: state.currentUser,
    currentHouseholdId: state.currentHouseholdId,

    setFoods,

    render
  });
}

// Firestoreから買い物リストを取得
async function loadShoppingItems() {
  const items = await fetchShoppingItems(state.currentHouseholdId);

  setShoppingItems(items);

  renderShoppingList(items);
}

async function handleUpdateShoppingStatus({ itemId, isPurchased }) {
  await handleUpdateShoppingStatusController({
    currentUser: state.currentUser,
    currentHouseholdId: state.currentHouseholdId,
    itemId,
    isPurchased,
    loadShoppingItems
  });
}

// 指定した日付の献立を取得
async function loadMeals() {
  await loadMealsController({
    currentHouseholdId: state.currentHouseholdId,
    selectedMealDate: state.selectedMealDate,

    setMeals,

    render
  });
}

// 今日以降の献立を取得（upcomingMealsに保存）する
async function loadUpcomingMeals() {
  await loadUpcomingMealsController({
    currentHouseholdId: state.currentHouseholdId,

    setUpcomingMeals,

    renderFoodList
  });
}

// 献立モーダルを開く
function openMealModal(mealType, meal = null) {
  openMealModalController({
    mealType,
    meal,
    selectedMealDate: state.selectedMealDate,

    setEditingMealId,
    setCurrentMealType,
    setSelectedIngredientIds,
    setSelectedMealDate,
    setMealNameInput,
    setMealRecipeUrlInput,
    setMealDateInput,
    setIngredientFilter, // ← ここを追加
    setIsMealModalOpen,

    render
  });
}

// 献立を保存（新規登録・編集）
async function handleSaveMeal(mealDate = '', mealName, recipeUrl = '') {
  await handleSaveMealController({
    currentHouseholdId: state.currentHouseholdId,
    selectedMealDate: state.selectedMealDate,
    selectedIngredientIds: state.selectedIngredientIds,
    editingMealId: state.editingMealId,
    currentMealType: state.currentMealType,
    mealDateInput: mealDate,
    mealName,
    recipeUrl,

    setEditingMealId,
    setCurrentMealType,
    setSelectedIngredientIds,
    setSelectedMealDate,
    setMealDateInput,
    setMealNameInput,
    setMealRecipeUrlInput,
    setIsMealModalOpen,

    loadMeals
  });
}

// 献立を削除
async function handleDeleteMeal(mealId) {
  await handleDeleteMealController({
    currentHouseholdId: state.currentHouseholdId,
    mealId,
    loadMeals
  });
}

// 食品の追加
async function handleAddFood(newFood) {
  await handleAddFoodController({
    currentUser: state.currentUser,
    currentHouseholdId: state.currentHouseholdId,
    newFood,
    loadFoods
  });
}

// 食品の削除
async function handleDeleteFood(foodId) {
  await handleDeleteFoodController({
    currentUser: state.currentUser,
    currentHouseholdId: state.currentHouseholdId,
    foodId,
    loadFoods
  });
}

// 食品情報の更新
async function handleUpdateFood(foodId, updatedFood) {
  await handleUpdateFoodController({
    currentUser: state.currentUser,
    currentHouseholdId: state.currentHouseholdId,
    foodId,
    updatedFood,

    setEditingFoodId,

    loadFoods
  });
}

// 献立の日付を変更する
async function changeMealDate(amount) {
  await changeMealDateController({
    amount,
    selectedMealDate: state.selectedMealDate,

    setSelectedMealDate,
    setCurrentMealType,

    loadMeals
  });
}

// 買い物リストに商品を追加
async function handleAddShoppingItem(newItem) {
  await handleAddShoppingItemController({
    currentUser: state.currentUser,
    currentHouseholdId: state.currentHouseholdId,
    newItem,
    loadShoppingItems
  });
}

function render() {
  // 献立画面に表示する日付情報
  const {
    todayLabel,
    previousMealDate,
    nextMealDate
  } = createMealDateInfo(state.selectedMealDate, formatMealDate);

  // 画面を描画
  renderApp({
    currentHouseholdId: state.currentHouseholdId,
    currentHouseholdName: state.currentHouseholdName,
    currentTab: state.currentTab,
    currentFilter: state.currentFilter,
    foods: state.foods,
    meals: state.meals,
    upcomingMeals: state.upcomingMeals,
    selectedMealDate: state.selectedMealDate,
    previousMealDate,
    nextMealDate,
    todayLabel,
    isMealModalOpen: state.isMealModalOpen,
    editingMealId: state.editingMealId,
    mealDateInput: state.mealDateInput,
    currentMealType: state.currentMealType,
    mealNameInput: state.mealNameInput,
    mealRecipeUrlInput: state.mealRecipeUrlInput,
    ingredientFilter: state.ingredientFilter,
    selectedIngredientIds: state.selectedIngredientIds,
    ingredientTagsHtml: renderIngredientTags({
      foods: state.foods,
      ingredientFilter: state.ingredientFilter,
      selectedIngredientIds: state.selectedIngredientIds
    })
  });

  // 買い物リストを描画
  renderShoppingList(state.shoppingItems);

  // 家の作成画面の場合
  if (!state.currentHouseholdId) {
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
    state,
    actions: {
      render,
      handleCreateInvite,
      loadMeals,
      openMealModal,
      handleSaveMeal,
      handleDeleteMeal,
      handleAddFood,
      handleUpdateFood,
      handleDeleteFood,
      changeMealDate,
      handleAddShoppingItem,
      handleUpdateShoppingStatus: handleUpdateShoppingStatus,
    }
  });
}

// 食品一覧を描画
function renderFoodList() {
  renderFoods(
    state.foods,
    state.currentFilter,
    state.upcomingMeals,
    document.querySelector('#search')?.value || '',
    state.hideNoStock
  );
}

// アプリを起動
async function startApp() {
  document.querySelector('#app').innerHTML = `
    <p>読み込み中...</p>
  `;

  try {
    // アプリの初期化
    const appData = await initializeAppServices();

    state.currentUser = appData.currentUser;
    state.currentHouseholdId = appData.currentHouseholdId;
    state.currentHouseholdName = appData.currentHouseholdName;

    // 画面を表示
    if (state.currentHouseholdId) {
      await loadFoods();
      await loadMeals();
      await loadUpcomingMeals();
      await loadShoppingItems();
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
    if (state.currentHouseholdId) {
      await loadFoods();
    } else {
      render();
    }
  }
}

// DOMの読み込み完了後にアプリを起動
document.addEventListener('DOMContentLoaded', startApp);