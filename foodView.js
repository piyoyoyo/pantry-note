import {
  escapeHTML,
  getMealDateString,
  daysLeft
} from './utils';

// 食品の使用予定を取得
function getFoodUpcomingMeal(foodId, upcomingMeals) {
  // 各食事の予定時刻
  const mealTimes = {
    breakfast: '10:00',
    lunch: '15:00',
    dinner: '21:00'
  };

  const now = new Date();

  // 今日の日付
  const today = getMealDateString(now);

  // 現在時刻
  const currentTime =
    `${String(now.getHours()).padStart(2, '0')}:` +
    `${String(now.getMinutes()).padStart(2, '0')}`;

  const matchingMeals = upcomingMeals
    .filter(meal => {
      // この食品が材料に含まれているか
      if (!(meal.ingredientIds || []).includes(foodId)) {
        return false;
      }

      // 今日より未来の日付なら対象
      if (meal.date > today) {
        return true;
      }

      // 今日より過去の日付なら対象外
      if (meal.date < today) {
        return false;
      }

      // 今日の献立は予定時刻がまだ来ていなければ対象
      const scheduledTime = mealTimes[meal.type];

      return scheduledTime && currentTime < scheduledTime;
    })
    .sort((a, b) => {
      // 日付が早い順
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      // 同じ日なら朝食・昼食・夕食の順
      const mealTypeOrder = {
        breakfast: 1,
        lunch: 2,
        dinner: 3
      };

      return (
        (mealTypeOrder[a.type] || 99) -
        (mealTypeOrder[b.type] || 99)
      );
    });

  return matchingMeals[0] || null;
}

// 食品の使用予定ラベルを取得
function getFoodUpcomingMealLabel(foodId, upcomingMeals) {
  const meal = getFoodUpcomingMeal(foodId, upcomingMeals);

  if (!meal) return '';

  const [year, month, day] = meal.date.split('-');

  const mealTypeLabels = {
    breakfast: '朝食',
    lunch: '昼食',
    dinner: '夕食'
  };

  return `${Number(month)}月${Number(day)}日 ${mealTypeLabels[meal.type] || ''}で使用予定`;
}

// 食品一覧を描画
export function renderFoods(foods, currentFilter, upcomingMeals, keyword = '') {
  const list = document.querySelector('#food-list');

  // 食材リスト画面が表示されていない場合は終了
  if (!list) return;

  const filtered = foods.filter(food => {
    const matchesFilter =
      currentFilter === 'すべて' || food.place === currentFilter;
    const matchesKeyword = food.name.includes(keyword);
    return matchesFilter && matchesKeyword;
  });

  list.innerHTML = filtered.length
    ? filtered.map(food => {
        let status;
        let warning = '';

        if (!food.expiryDate) {
          status = '期限未登録';
        } else {
          const days = daysLeft(food.expiryDate);

          status = days < 0 ? '期限切れ' :
            days === 0 ? '今日まで' : `あと${days}日`;

          warning = days <= 3 ? 'warning' : '';
        }

        const upcomingMealLabel =
          getFoodUpcomingMealLabel(food.id, upcomingMeals);

        return `
          <article class="food-card">
            <div class="food-symbol">${food.place === '冷凍' ? '❄️' : food.place === '常温' ? '🥫' : '🥬'}</div>
            <div class="food-info">
              <div class="food-name">${escapeHTML(food.name)}</div>
            </div>
            <div class="food-status">
              ${escapeHTML(food.stockStatus || '在庫あり')}
            </div>
            <div class="food-status ${warning}">${status}</div>
            <div class="food-actions">
              <button
                class="edit-button"
                data-id="${escapeHTML(food.id)}"
                type="button"
              >
                編集
              </button>

              <button
                class="delete-button"
                data-id="${escapeHTML(food.id)}"
                type="button"
                aria-label="${escapeHTML(food.name)}を削除"
              >
                ×
              </button>
            </div>
          </article>
        `;
      }).join('')
    : '<p class="empty">食品が見つかりませんでした。</p>';
}
