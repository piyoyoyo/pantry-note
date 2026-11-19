import { escapeHTML } from './utils';

// 買い物リストを描画
export function renderShoppingList(shoppingItems) {
  const shoppingList = document.querySelector('#shopping-list');
  const purchasedList = document.querySelector('#purchased-list');
  const shoppingCount = document.querySelector('#shopping-count');
  const purchasedCount = document.querySelector('#purchased-count');

  // 買い物リスト画面が表示されていない場合は終了
  if (!shoppingList || !purchasedList) return;

  // 未購入・購入済みに分ける
  const unpurchasedItems = shoppingItems.filter(
    item => !item.isPurchased
  );

  const purchasedItems = shoppingItems.filter(
    item => item.isPurchased
  );

  // 商品数を表示
  if (shoppingCount) {
    shoppingCount.textContent = `${unpurchasedItems.length} ITEMS`;
  }

  if (purchasedCount) {
    purchasedCount.textContent = `${purchasedItems.length} ITEMS`;
  }

  // 未購入商品を表示
  shoppingList.innerHTML = unpurchasedItems.length
    ? unpurchasedItems.map(item => `
        <article
          class="shopping-card"
          data-id="${escapeHTML(item.id)}"
        >
          <input
            type="checkbox"
            class="shopping-check-button"
            data-id="${escapeHTML(item.id)}"
            aria-label="${escapeHTML(item.name)}を購入済みにする"
          />

          <div class="shopping-card-info">
            <div class="shopping-item-name">
              ${escapeHTML(item.name)}
            </div>
            <div class="shopping-item-quantity">
              ${escapeHTML(item.quantity || '')}
            </div>
          </div>
        </article>
      `).join('')
    : '<p class="empty">買い物リストはまだありません。</p>';

  // 購入済み商品を表示
  purchasedList.innerHTML = purchasedItems.length
    ? purchasedItems.map(item => `
        <article
          class="shopping-card purchased"
          data-id="${escapeHTML(item.id)}"
        >
          <input
            type="checkbox"
            class="shopping-check-button"
            data-id="${escapeHTML(item.id)}"
            checked
            aria-label="${escapeHTML(item.name)}を未購入に戻す"
          />

          <div class="shopping-card-info">
            <div class="shopping-item-name">
              ${escapeHTML(item.name)}
            </div>
            <div class="shopping-item-quantity">
              ${escapeHTML(item.quantity || '')}
            </div>
          </div>
        </article>
      `).join('')
    : '<p class="empty">購入済みの商品はありません。</p>';
}
