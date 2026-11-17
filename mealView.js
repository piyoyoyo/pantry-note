import {
  escapeHTML,
  getMealDateString,
  formatMonthDay
} from './utils';

// 献立に登録されている材料名を取得
function getMealIngredientNames(meal, foods) {
  const ingredientIds = meal.ingredientIds || [];

  return ingredientIds
    .map(id => {
      const food = foods.find(item => item.id === id);
      return food ? food.name : null;
    })
    .filter(name => name !== null);
}

// 献立画面を描画
export function renderMealView({
  meals,
  foods,
  selectedMealDate,
  previousMealDate,
  nextMealDate,
  todayLabel
}) {
  return `
    <section class="meal-section">
      <div class="meal-date-navigation">
        <button id="previous-meal-date" type="button">
          ‹ ${formatMonthDay(previousMealDate)}
        </button>

        <button id="today-meal-date" type="button">
          今日に戻る
        </button>

        <button id="next-meal-date" type="button">
          ${formatMonthDay(nextMealDate)} ›
        </button>
      </div>

      <div class="section-heading">
        <h2>${getMealDateString(selectedMealDate) === getMealDateString(new Date())
          ? '今日の献立'
          : `${todayLabel}の献立`}</h2>
        <span>${getMealDateString(selectedMealDate) === getMealDateString(new Date())
          ? `${todayLabel}`
          : ''}</span>
      </div>

      ${[
        { type: 'breakfast', label: '朝食', icon: '🌅' },
        { type: 'lunch', label: '昼食', icon: '☀️' },
        { type: 'dinner', label: '夕食', icon: '🌙' }
      ].map(mealType => {
        const typeMeals = meals.filter(
          meal => meal.type === mealType.type
        );

        return `
          <div class="meal-card">
            <div class="meal-title">
              <span>${mealType.icon}</span>
              <h3>${mealType.label}</h3>
            </div>

            <div class="meal-list">
              ${typeMeals.length
                ? typeMeals.map(meal => {
                    const ingredientNames =
                      getMealIngredientNames(meal, foods);

                    return `
                      <div class="meal-item">
                        <div class="meal-item-info">
                          <button
                            class="meal-name-button"
                            data-id="${escapeHTML(meal.id)}"
                            type="button"
                          >
                            ${escapeHTML(meal.name)}
                          </button>

                          ${meal.recipeUrl
                            ? `
                              <a
                                class="meal-recipe-link"
                                href="${escapeHTML(meal.recipeUrl)}"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                🔗 レシピを見る
                              </a>
                            `
                            : ''}

                          <div class="meal-ingredients">
                            ${ingredientNames.length
                              ? `使用する食材：${ingredientNames.map(name => escapeHTML(name)).join('、')}`
                              : '材料は登録されていません'}
                          </div>
                        </div>

                        <button
                          class="meal-delete-button"
                          data-id="${escapeHTML(meal.id)}"
                          type="button"
                          aria-label="${escapeHTML(meal.name)}を削除"
                        >×</button>
                      </div>
                    `;
                  }).join('')
                : '<p class="meal-empty">献立はまだ登録されていません</p>'
              }
            </div>

            <button
              class="meal-add-button"
              data-type="${mealType.type}"
              type="button"
            >＋ 献立を追加</button>
          </div>
        `;
      }).join('')}
    </section>
  `;
}
