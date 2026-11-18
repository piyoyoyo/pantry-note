export function bindShoppingEvents({ actions }) {
  const {
    handleAddShoppingItem,
    handleUpdateShoppingStatus
  } = actions;

  // 商品追加フォーム
  const shoppingForm = document.querySelector('#shopping-form');

  if (shoppingForm) {
    shoppingForm.addEventListener('submit', async event => {
      event.preventDefault();

      const name = document.querySelector('#shopping-name').value.trim();
      const quantity = document.querySelector('#shopping-quantity').value.trim();

      if (!name) {
        alert('商品名を入力してください');
        return;
      }

      await handleAddShoppingItem({
        name,
        quantity
      });
    });
  }

  // 購入チェックボックス
  const shoppingLists = [
    document.querySelector('#shopping-list'),
    document.querySelector('#purchased-list')
  ];

  shoppingLists.forEach(list => {
    if (!list) return;

    list.addEventListener('change', async event => {
      if (!event.target.matches('.shopping-check-button')) return;

      const itemId = event.target.dataset.id;
      const isPurchased = event.target.checked;

      await handleUpdateShoppingStatus({
        itemId,
        isPurchased
      });
    });
  });
}
