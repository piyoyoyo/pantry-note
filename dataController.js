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

import { getMealDateString } from './utils';

// 食品一覧を取得
export async function fetchFoods(householdId) {
  return await getFoods(householdId);
}

// 指定した日付の献立を取得
export async function fetchMeals(householdId, selectedMealDate) {
  const date = getMealDateString(selectedMealDate);

  return await getMeals(householdId, date);
}

// 今日以降の献立を取得
export async function fetchUpcomingMeals(householdId) {
  const today = getMealDateString(new Date());

  return await getUpcomingMeals(householdId, today);
}

// 献立を新規登録・更新
export async function saveMealData({
  householdId,
  editingMealId,
  mealData,
  date,
  mealType
}) {
  if (editingMealId) {
    await updateMeal(
      householdId,
      editingMealId,
      mealData
    );
  } else {
    await addMeal(householdId, {
      ...mealData,
      date,
      type: mealType
    });
  }
}

// 献立を削除
export async function removeMealData(householdId, mealId) {
  await deleteMeal(householdId, mealId);
}

// 食品を新規登録
export async function createFoodData(householdId, newFood) {
  await addFood(householdId, newFood);
}

// 食品を削除
export async function removeFoodData(householdId, foodId) {
  await deleteFood(householdId, foodId);
}

// 食品情報を更新
export async function saveFoodData(householdId, foodId, updatedFood) {
  await updateFood(householdId, foodId, updatedFood);
}
