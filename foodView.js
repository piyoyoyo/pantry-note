import {
  escapeHTML,
  getMealDateString,
  daysLeft
} from './utils';

// 食品一覧を描画
export function renderFoods(
  foods,
  currentFilter,
  upcomingMeals,
  keyword = '',
  hideNoStock = false
) {
  const list = document.querySelector('#food-list');

  // 食材リスト画面が表示されていない場合は終了
  if (!list) return;

  const filtered = foods.filter(food => {
    const matchesFilter = currentFilter === 'すべて' || food.place === currentFilter;
    const matchesKeyword = food.name.includes(keyword);
    const matchesStock = !hideNoStock || food.stockStatus !== '在庫なし';
    return matchesFilter && matchesKeyword && matchesStock;
  });

  list.innerHTML = filtered.length
    ? filtered.map(food => {
        let status;
        let warning = '';

        if (!food.expiryDate) {
          status = '期限未登録';
          warning = 'none';
        } else {
          const days = daysLeft(food.expiryDate);

          status = days < 0 ? '期限切れ' :
            days === 0 ? '今日まで' : `期限まであと${days}日`;

          warning = days < 0 ? 'expired' :
            days <= 3 ? 'warning' : 'normal';
        }

        return `
          <article class="food-card">
            <div class="food-info">
              <div class="food-name">${escapeHTML(food.name)}</div>
              <div class="food-badges">
                <div class="food-status stock-${food.stockStatus === '在庫わずか'
                  ? 'low'
                  : food.stockStatus === '在庫なし'
                    ? 'none'
                    : 'available'}">
                  ${escapeHTML(food.stockStatus || '在庫あり')}
                </div>
                <div class="food-status expiry-${warning}">${status}</div>
              </div>
            </div>
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
