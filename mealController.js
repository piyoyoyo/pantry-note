import {
  fetchMeals,
  fetchUpcomingMeals,
  saveMealData,
  removeMealData
} from './dataController';

import { getMealDateString } from './utils';

// 指定した日付の献立を取得
export async function loadMeals({
  currentHouseholdId,
  selectedMealDate,
  setMeals,
  render
}) {
  if (!currentHouseholdId) return;

  try {
    const meals = await fetchMeals(
      currentHouseholdId,
      selectedMealDate
    );

    setMeals(meals);

    render();

  } catch (error) {
    console.error('献立の取得に失敗しました:', error);
  }
}

// 今日以降の献立を取得
export async function loadUpcomingMeals({
  currentHouseholdId,
  setUpcomingMeals,
  renderFoodList
}) {
  if (!currentHouseholdId) return;

  try {
    const upcomingMeals = await fetchUpcomingMeals(currentHouseholdId);

    setUpcomingMeals(upcomingMeals);

    renderFoodList();

  } catch (error) {
    console.error('使用予定の献立取得に失敗しました:', error);
  }
}

// 献立を保存（新規登録・編集）
export async function handleSaveMeal({
  currentHouseholdId,
  selectedMealDate,
  selectedIngredientIds,
  editingMealId,
  currentMealType,
  mealName,
  recipeUrl,
  setEditingMealId,
  setCurrentMealType,
  setSelectedIngredientIds,
  setMealNameInput,
  setMealRecipeUrlInput,
  setIsMealModalOpen,
  loadMeals
}) {
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

    // モーダルを閉じて状態をリセット
    setEditingMealId(null);
    setCurrentMealType(null);
    setSelectedIngredientIds([]);
    setMealNameInput('');
    setMealRecipeUrlInput('');
    setIsMealModalOpen(false);

    await loadMeals();

  } catch (error) {
    console.error('献立の保存に失敗しました:', error);
    alert('献立を保存できませんでした。');
  }
}

// 献立を削除
export async function handleDeleteMeal({
  currentHouseholdId,
  mealId,
  loadMeals
}) {
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
