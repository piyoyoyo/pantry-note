// 献立データ
export let meals = [];
export let upcomingMeals = [];

// 献立モーダル
export let currentMealType = null;
export let editingMealId = null;
export let selectedIngredientIds = [];
export let ingredientFilter = 'すべて';
export let isMealModalOpen = false;
export let mealNameInput = '';
export let mealRecipeUrlInput = '';
export let mealDateInput = '';

// 食品データ
export let foods = [];
export let currentFilter = 'すべて';
export let editingFoodId = null;

// アプリ全体
export let currentUser = null;
export let currentTab = 'meals';
export let currentHouseholdId = null;
export let currentHouseholdName = '';

// 表示中の日付
export let selectedMealDate = new Date();
selectedMealDate.setHours(0, 0, 0, 0);

// 状態を更新する関数
export function setMeals(value) {
  meals = value;
}

export function setMealDateInput(value) {
  mealDateInput = value;
}

export function setUpcomingMeals(value) {
  upcomingMeals = value;
}

export function setCurrentMealType(value) {
  currentMealType = value;
}

export function setEditingMealId(value) {
  editingMealId = value;
}

export function setSelectedIngredientIds(value) {
  selectedIngredientIds = value;
}

export function setIngredientFilter(value) {
  ingredientFilter = value;
}

export function setIsMealModalOpen(value) {
  isMealModalOpen = value;
}

export function setMealNameInput(value) {
  mealNameInput = value;
}

export function setMealRecipeUrlInput(value) {
  mealRecipeUrlInput = value;
}

export function setFoods(value) {
  foods = value;
}

export function setCurrentFilter(value) {
  currentFilter = value;
}

export function setEditingFoodId(value) {
  editingFoodId = value;
}

export function setCurrentUser(value) {
  currentUser = value;
}

export function setCurrentTab(value) {
  currentTab = value;
}

export function setCurrentHouseholdId(value) {
  currentHouseholdId = value;
}

export function setCurrentHouseholdName(value) {
  currentHouseholdName = value;
}

export function setSelectedMealDate(value) {
  selectedMealDate = value;
}

// 状態をまとめたオブジェクト
export const state = {
  get meals() { return meals; },
  set meals(value) { setMeals(value); },

  get mealDateInput() { return mealDateInput; },
  set mealDateInput(value) { setMealDateInput(value); },

  get upcomingMeals() { return upcomingMeals; },
  set upcomingMeals(value) { setUpcomingMeals(value); },

  get currentMealType() { return currentMealType; },
  set currentMealType(value) { setCurrentMealType(value); },

  get editingMealId() { return editingMealId; },
  set editingMealId(value) { setEditingMealId(value); },

  get selectedIngredientIds() { return selectedIngredientIds; },
  set selectedIngredientIds(value) { setSelectedIngredientIds(value); },

  get ingredientFilter() { return ingredientFilter; },
  set ingredientFilter(value) { setIngredientFilter(value); },

  get isMealModalOpen() { return isMealModalOpen; },
  set isMealModalOpen(value) { setIsMealModalOpen(value); },

  get mealNameInput() { return mealNameInput; },
  set mealNameInput(value) { setMealNameInput(value); },

  get mealRecipeUrlInput() { return mealRecipeUrlInput; },
  set mealRecipeUrlInput(value) { setMealRecipeUrlInput(value); },

  get foods() { return foods; },
  set foods(value) { setFoods(value); },

  get currentFilter() { return currentFilter; },
  set currentFilter(value) { setCurrentFilter(value); },

  get editingFoodId() { return editingFoodId; },
  set editingFoodId(value) { setEditingFoodId(value); },

  get currentUser() { return currentUser; },
  set currentUser(value) { setCurrentUser(value); },

  get currentTab() { return currentTab; },
  set currentTab(value) { setCurrentTab(value); },

  get currentHouseholdId() { return currentHouseholdId; },
  set currentHouseholdId(value) { setCurrentHouseholdId(value); },

  get currentHouseholdName() { return currentHouseholdName; },
  set currentHouseholdName(value) { setCurrentHouseholdName(value); },

  get selectedMealDate() { return selectedMealDate; },
  set selectedMealDate(value) { setSelectedMealDate(value); }
};
