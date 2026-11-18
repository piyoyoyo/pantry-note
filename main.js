import {
  renderApp,
  createMealDateInfo
} from './render';
import { formatMealDate } from './utils';
import { createHousehold } from './households';
import {
  loadFoods as loadFoodsController,
  handleAddFood as handleAddFoodController,
  handleDeleteFood as handleDeleteFoodController,
  handleUpdateFood as handleUpdateFoodController
} from './foodController';
import {
  loadMeals as loadMealsController,
  loadUpcomingMeals as loadUpcomingMealsController,
  handleSaveMeal as handleSaveMealController,
  handleDeleteMeal as handleDeleteMealController,
  changeMealDate as changeMealDateController,
  openMealModal as openMealModalController
} from './mealController';
import { renderFoods } from './foodView';
import {
  renderIngredientTags
} from './mealView';
import {
  // 食品関連の状態変数
  foods,
  currentFilter,
  editingFoodId,
  setFoods,
  setCurrentFilter,
  setEditingFoodId,
  // 献立関連の状態変数
  meals,
  upcomingMeals,
  setMeals,
  setUpcomingMeals,
  currentMealType,
  editingMealId,
  selectedIngredientIds,
  ingredientFilter,
  isMealModalOpen,
  mealNameInput,
  mealRecipeUrlInput,
  setCurrentMealType,
  setEditingMealId,
  setSelectedIngredientIds,
  setIngredientFilter,
  setIsMealModalOpen,
  setMealNameInput,
  setMealRecipeUrlInput,
  // アプリ全体の状態変数
  currentUser,
  currentTab,
  currentHouseholdId,
  currentHouseholdName,
  setCurrentUser,
  setCurrentTab,
  setCurrentHouseholdId,
  setCurrentHouseholdName,
  // 表示中の日付の状態変数
  selectedMealDate,
  setSelectedMealDate,
  // 状態をまとめたstateオブジェクト
  state
} from './state';
import {
  bindEvents,
  bindHouseholdEvents
} from './events';
import { functions } from './firebase';
import { initializeAppServices } from './appInitializer';
import { httpsCallable } from 'firebase/functions';
import './style.css';

// 家の作成
async function handleCreateHousehold(householdName) {

  if (!state.currentUser) {
    alert('ログインが完了していません');
    return;
  }

  try {
    const householdId = await createHousehold(
      state.currentUser.uid,
      householdName
    );

    // 作成した家のIDを保存
    state.currentHouseholdId = householdId;
    console.log('家を作成しました:', householdId);
    state.currentHouseholdName = householdName;

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
    if (!state.currentHouseholdId) {
      alert('家の情報が取得できていません。');
      return;
    }

    const createInvite = httpsCallable(functions, 'createInvite');

    const result = await createInvite({
      householdId: state.currentHouseholdId
    });

    const token = result.data.token;

    const inviteUrl =
      `https://liff.line.me/${import.meta.env.VITE_LIFF_ID}?invite=${encodeURIComponent(token)}&householdId=${encodeURIComponent(state.currentHouseholdId)}`;

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
    currentUser: state.currentUser,
    currentHouseholdId: state.currentHouseholdId,

    setFoods,

    render
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

    setEditingMealId,
    setCurrentMealType,
    setSelectedIngredientIds,
    setMealNameInput,
    setMealRecipeUrlInput,
    setIngredientFilter,
    setIsMealModalOpen,

    render
  });
}

// 献立を保存（新規登録・編集）
async function handleSaveMeal(mealName, recipeUrl = '') {
  await handleSaveMealController({
    currentHouseholdId: state.currentHouseholdId,
    selectedMealDate: state.selectedMealDate,
    selectedIngredientIds: state.selectedIngredientIds,
    editingMealId: state.editingMealId,
    currentMealType: state.currentMealType,
    mealName,
    recipeUrl,

    setEditingMealId,
    setCurrentMealType,
    setSelectedIngredientIds,
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
  renderFoods(
    state.foods,
    state.currentFilter,
    state.upcomingMeals
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

    setCurrentUser(appData.currentUser);
    setCurrentHouseholdId(appData.currentHouseholdId);
    setCurrentHouseholdName(appData.currentHouseholdName);

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