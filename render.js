import { escapeHTML, daysLeft } from './utils';
import { renderMealView } from './mealView';

// 献立画面に表示する日付情報を生成
export function createMealDateInfo(selectedMealDate, formatMealDate) {
  const todayLabel = formatMealDate(selectedMealDate);

  const previousMealDate = new Date(selectedMealDate);
  previousMealDate.setDate(previousMealDate.getDate() - 1);

  const nextMealDate = new Date(selectedMealDate);
  nextMealDate.setDate(nextMealDate.getDate() + 1);

  return {
    todayLabel,
    previousMealDate,
    nextMealDate
  };
}

// 画面全体を描画
export function renderApp({
  currentHouseholdId,
  currentHouseholdName,
  currentTab,
  currentFilter,
  foods,
  meals,
  upcomingMeals,
  selectedMealDate,
  previousMealDate,
  nextMealDate,
  todayLabel,
  isMealModalOpen,
  editingMealId,
  mealDateInput,
  currentMealType,
  mealNameInput,
  mealRecipeUrlInput,
  ingredientFilter,
  selectedIngredientIds,
  ingredientTagsHtml
}) {
  const app = document.querySelector('#app');

  // 家に所属していない場合
  if (!currentHouseholdId) {
    app.innerHTML = `
      <div class="household-setup">
        <header class="header">
          <div>
            <p class="eyebrow">MEAL HELPER</p>
            <h1>ミールヘルパー 🥬</h1>
          </div>
        </header>

        <section class="household-card">
          <h2>家を作成しましょう</h2>

          <p>
            家を作成すると、家族みんなで
            同じ献立、冷蔵庫・パントリーの食材を共有できるようになります。
          </p>

          <form id="household-form">
            <label for="household-name">家の名前</label>

            <input
              id="household-name"
              name="household-name"
              type="text"
              placeholder="例：Koyama家"
              required
              maxlength="30"
            />

            <button type="submit" class="submit-button">
              家を作成する
            </button>
          </form>
        </section>
      </div>
    `;

    return;
  }

  // メイン画面
  app.innerHTML = `
    <div class="app-shell">
      <header class="header">
        <div>
          <p class="eyebrow">MEAL HELPER</p>
          <h1>ミールヘルパー</h1>
          <p class="subheading">${escapeHTML(currentHouseholdName)}</p>
        </div>

        <div class="header-actions">
          <button
            id="settings-button"
            class="settings-button"
            type="button"
            aria-label="設定メニューを開く"
          >
            ⚙
          </button>

          <div id="settings-menu" class="settings-menu hidden">
            <button
              id="invite-button"
              class="settings-menu-item"
              type="button"
            >
              家族を招待する
            </button>
          </div>
        </div>
      </header>

      ${currentTab === 'meals'
        ? renderMealView({
            meals,
            foods,
            selectedMealDate,
            previousMealDate,
            nextMealDate,
            todayLabel
          })
        : ''}

      ${currentTab === 'foods' ? `
        <section class="expiry-section">
          <div class="expiry-icon">⏰</div>

          <div>
            <strong>期限切れの食品</strong>
            <ul class="expired-list">
              ${
                foods.filter(f =>
                  f.expiryDate &&
                  daysLeft(f.expiryDate) < 0
                ).length === 0
                  ? '<li class="empty">食材はありません</li>'
                  : foods
                      .filter(f =>
                        f.expiryDate &&
                        daysLeft(f.expiryDate) < 0
                      )
                      .sort((a, b) =>
                        daysLeft(a.expiryDate) - daysLeft(b.expiryDate)
                      )
                      .map(f => `
                        <li>
                          <span class="expired-food-name">
                            ${escapeHTML(f.name)}
                          </span>
                          <span class="expired-days">
                            ${Math.abs(daysLeft(f.expiryDate))}日超過
                          </span>
                        </li>
                      `)
                      .join('')
              }
            </ul>
          </div>

          <div>
            <strong>期限が近い食品</strong>
            <ul class="expiry-list">
              ${
                foods.filter(f =>
                  f.expiryDate &&
                  daysLeft(f.expiryDate) >= 0 &&
                  daysLeft(f.expiryDate) <= 3
                ).length === 0
                  ? '<li class="empty">食材はありません</li>'
                  : foods
                      .filter(f =>
                        f.expiryDate &&
                        daysLeft(f.expiryDate) >= 0 &&
                        daysLeft(f.expiryDate) <= 3
                      )
                      .sort((a, b) =>
                        daysLeft(a.expiryDate) - daysLeft(b.expiryDate)
                      )
                      .map(f => `
                        <li>
                          <span class="expiry-food-name">
                            ${escapeHTML(f.name)}
                          </span>
                          <span class="expiry-days">
                            ${daysLeft(f.expiryDate) === 0
                              ? '今日まで'
                              : `${escapeHTML(f.expiryDate)}まで あと${daysLeft(f.expiryDate)}日`}
                          </span>
                        </li>
                      `)
                      .join('')
              }
            </ul>
          </div>

          <div>
            <strong>期限未登録の食品</strong>
            <ul class="expiry-list">
              ${
                foods.filter(f => !f.expiryDate).length === 0
                  ? '<li class="empty">食材はありません</li>'
                  : foods
                      .filter(f => !f.expiryDate)
                      .map(f => `
                        <li>
                          <span class="expiry-food-name">
                            ${escapeHTML(f.name)}
                          </span>
                          <span class="expiry-days">
                            期限未登録
                          </span>
                        </li>
                      `)
                      .join('')
              }
            </ul>
          </div>
        </section>

        <button id="add-button" class="add-button">
          ＋ 食品を追加する
        </button>

        <div class="section-heading">
          <h2>食品リスト</h2>
          <span>${foods.length} ITEMS</span>
        </div>

        <input
          id="search"
          class="search"
          placeholder="⌕  食品を検索..."
        />

        <div class="filters">
          ${['すべて', '冷蔵', '冷凍', '常温'].map(filter => `
            <button
              class="filter ${currentFilter === filter ? 'active' : ''}"
              data-filter="${filter}"
            >${filter}</button>
          `).join('')}
        </div>

        <label class="stock-filter">
          <input
            type="checkbox"
            id="hide-no-stock"
          />
          在庫なしを非表示
        </label>

        <div id="food-list" class="food-list"></div>
      ` : ''}

      ${currentTab === 'shopping' ? `
        <section class="shopping-section">
          <div class="section-heading">
            <h2>買い物リスト</h2>
          </div>

          <!-- 商品追加フロートボタン -->
          <button
            type="button"
            id="open-shopping-add"
            class="shopping-add-float"
            aria-label="商品を追加"
          >
            ＋
          </button>

          <!-- 未購入の商品 -->
          <div class="shopping-heading">
            <h3>買うもの</h3>
            <span id="shopping-count">0 ITEMS</span>
          </div>

          <div id="shopping-list" class="shopping-list">
            <p class="empty">買い物リストはまだありません。</p>
          </div>

          <!-- 購入済みの商品 -->
          <div class="shopping-heading purchased-heading">
            <h3>購入済み</h3>
            <span id="purchased-count">0 ITEMS</span>
          </div>

          <div id="purchased-list" class="shopping-list">
            <p class="empty">購入済みの商品はありません。</p>
          </div>

          <button
            type="button"
            id="clear-purchased-button"
            class="clear-purchased-button"
          >
            購入済みをまとめて削除
          </button>

          <!-- 商品編集モーダル -->
          <div id="shopping-edit-modal" class="shopping-edit-modal" hidden>
            <div class="shopping-edit-content">
              <div class="shopping-edit-header">
                <button
                  type="button"
                  id="close-shopping-edit"
                  class="modal-close"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>

              <form id="shopping-edit-form">
                <label for="shopping-edit-name">商品名</label>
                <input
                  type="text"
                  id="shopping-edit-name"
                  required
                />

                <label for="shopping-edit-quantity">数量（任意）</label>
                <input
                  type="text"
                  id="shopping-edit-quantity"
                  placeholder="例：2個、1袋、200g"
                />

                <div class="shopping-edit-actions">
                  <button
                    type="button"
                    id="cancel-shopping-edit"
                    class="cancel-button"
                  >
                    キャンセル
                  </button>

                  <button
                    type="submit"
                    id="shopping-modal-submit"
                    class="add-button"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ` : ''}

      <nav class="bottom-nav">
        <button
          class="nav-item ${currentTab === 'meals' ? 'selected' : ''}"
          data-tab="meals"
          type="button"
        >
          <span>♡</span>
          献立
        </button>

        <button
          class="nav-item ${currentTab === 'foods' ? 'selected' : ''}"
          data-tab="foods"
          type="button"
        >
          <span>▦</span>
          食材リスト
        </button>

        <button
          class="nav-item ${currentTab === 'shopping' ? 'selected' : ''}"
          data-tab="shopping"
          type="button"
        >
          <span>☑</span>
          買い物リスト
        </button>
      </nav>

      <div id="modal" class="modal hidden">
        <div class="modal-card">
          <div class="modal-header">
            <h2>食品を追加</h2>
            <button
              id="close-modal"
              class="close-button"
              type="button"
            >×</button>
          </div>

          <form id="food-form">
            <label>食品名</label>
            <input name="food-name" placeholder="例：トマト" required />

            <label>在庫</label>
            <select name="stock-status">
              <option value="在庫あり" selected>在庫あり</option>
              <option value="残りわずか">残りわずか</option>
              <option value="在庫なし">在庫なし</option>
            </select>

            <label>保存場所</label>
            <select name="place">
              <option>冷蔵</option>
              <option>冷凍</option>
              <option>常温</option>
            </select>

            <label>賞味・消費期限</label>
            <input name="expiry-date" type="date" />

            <button class="submit-button" type="submit">登録する</button>
          </form>
        </div>
      </div>

      <div id="meal-modal" class="modal ${isMealModalOpen ? '' : 'hidden'}">
        <div class="modal-card meal-modal-card">
          <div class="modal-header">
            <h2>${editingMealId ? '献立を編集' : '献立を登録'}</h2>
            <button
              id="close-meal-modal"
              class="close-button"
              type="button"
            >×</button>
          </div>

          <form id="meal-form">
            <label for="meal-date">日付</label>
              <input
                id="meal-date"
                type="date"
                value="${escapeHTML(mealDateInput)}"
                required
              />
            <label for="meal-type">食事区分</label>
            <select id="meal-type" required>
              <option value="breakfast" ${currentMealType === 'breakfast' ? 'selected' : ''}>朝食</option>
              <option value="lunch" ${currentMealType === 'lunch' ? 'selected' : ''}>昼食</option>
              <option value="dinner" ${currentMealType === 'dinner' ? 'selected' : ''}>夕食</option>
            </select>
            <label for="meal-name">献立名</label>
            <input
              id="meal-name"
              name="meal-name"
              type="text"
              placeholder="例：車麩の唐揚げ"
              maxlength="50"
              value="${escapeHTML(mealNameInput)}"
              required
            />

            <label>材料</label>

            <div class="ingredient-filters">
              ${['すべて', '冷蔵', '冷凍', '常温'].map(filter => `
                <button
                  type="button"
                  class="ingredient-filter ${ingredientFilter === filter ? 'active' : ''}"
                  data-filter="${filter}"
                >${filter}</button>
              `).join('')}
            </div>

            <div class="ingredient-tags">
              ${ingredientTagsHtml}
            </div>

            <p class="ingredient-selected-count">
              ${selectedIngredientIds.length}点の食材を選択中
            </p>

            <div class="recipe-url-section">
              <label for="meal-recipe-url">レシピURL（任意）</label>

              <input
                id="meal-recipe-url"
                name="recipe-url"
                type="url"
                placeholder="https://example.com/recipe"
                value="${escapeHTML(mealRecipeUrlInput)}"
              />

              <button
                id="recipe-search-button"
                type="button"
                class="recipe-search-button"
              >
                🔍 レシピをWebで検索
              </button>
            </div>

            <div class="meal-modal-actions">
              <button
                id="cancel-meal-modal"
                type="button"
                class="meal-cancel-button"
              >キャンセル</button>

              <button type="submit" class="submit-button">
                保存する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}
