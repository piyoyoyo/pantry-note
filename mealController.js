import { fetchMeals } from './dataController';

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
