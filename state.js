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
