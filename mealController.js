import {
  fetchMeals,
  fetchUpcomingMeals
} from './dataController';

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
