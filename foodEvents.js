import { renderFoods } from './foodView';

// 食品関連のイベント登録
export function bindFoodEvents({ state, actions }) {
  const {
    handleAddFood,
    handleUpdateFood,
    handleDeleteFood,
    handleAddShoppingItem
  } = actions;

  // 食品フィルターの切り替え
  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      state.currentFilter = button.dataset.filter;
      actions.render();
    });
  });

  // 食品検索
  const searchInput = document.querySelector('#search');

  if (searchInput) {
    searchInput.addEventListener('input', event => {
      renderFoods(
        state.foods,
        state.currentFilter,
        state.upcomingMeals,
        event.target.value,
        state.hideNoStock
      );
    });
  }

  // 在庫なし食品の表示切り替え
  const hideNoStockCheckbox =
    document.querySelector('#hide-no-stock');

  if (hideNoStockCheckbox) {
    hideNoStockCheckbox.checked = state.hideNoStock;

    hideNoStockCheckbox.addEventListener('change', event => {
      state.hideNoStock = event.target.checked;

      renderFoods(
        state.foods,
        state.currentFilter,
        state.upcomingMeals,
        searchInput ? searchInput.value : '',
        state.hideNoStock
      );
    });
  }

  // 食品追加ボタン
  const addButton = document.querySelector('#add-button');

  if (addButton) {
    addButton.addEventListener('click', () => {
      const modal = document.querySelector('#modal');

      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  }

  // 食品モーダルを閉じる
  const closeFoodModalButton = document.querySelector('#close-modal');

  if (closeFoodModalButton) {
    closeFoodModalButton.addEventListener('click', () => {
      state.editingFoodId = null;

      document.querySelector('#food-form').reset();
      document.querySelector('.modal-header h2').textContent = '食品を追加';
      document.querySelector('.submit-button').textContent = '登録する';

      document.querySelector('#modal').classList.add('hidden');
    });
  }

  // 食品の新規登録・編集
  const foodForm = document.querySelector('#food-form');

  if (foodForm) {
    foodForm.addEventListener('submit', async event => {
      event.preventDefault();

      const form = new FormData(event.target);

      const foodData = {
        name: form.get('food-name'),
        stockStatus: form.get('stock-status'),
        place: form.get('place'),
        expiryDate: form.get('expiry-date')
      };

      if (state.editingFoodId) {
        await handleUpdateFood(state.editingFoodId, foodData);
      } else {
        await handleAddFood(foodData);
      }

      state.editingFoodId = null;

      const modalTitle = document.querySelector('.modal-header h2');
      const submitButton = document.querySelector('.submit-button');

      if (modalTitle) {
        modalTitle.textContent = '食品を追加';
      }

      if (submitButton) {
        submitButton.textContent = '登録する';
      }
    });
  }

  // 食品の削除
  const foodList = document.querySelector('#food-list');

  if (foodList) {
    foodList.addEventListener('click', event => {
      const button = event.target.closest('.delete-button');

      if (!button) return;

      handleDeleteFood(button.dataset.id);
    });
  }

  // 食品の編集
  const foodListForEdit = document.querySelector('#food-list');

  if (foodListForEdit) {
    foodListForEdit.addEventListener('click', event => {
      const button = event.target.closest('.edit-button');

      if (!button) return;

      const foodId = button.dataset.id;
      const food = state.foods.find(item => item.id === foodId);

      if (!food) return;

      state.editingFoodId = foodId;

      const form = document.querySelector('#food-form');
      const modal = document.querySelector('#modal');
      const modalTitle = document.querySelector('.modal-header h2');
      const submitButton = document.querySelector('.submit-button');

      if (!form || !modal || !modalTitle || !submitButton) {
        return;
      }

      form.elements.namedItem('food-name').value = food.name;
      form.elements.namedItem('stock-status').value = food.stockStatus || '在庫あり';
      form.elements.namedItem('place').value = food.place;
      form.elements.namedItem('expiry-date').value = food.expiryDate;

      modalTitle.textContent = '食品を編集';
      submitButton.textContent = '更新する';

      modal.classList.remove('hidden');
    });
  }

  // 食品リストから買い物リストに追加
  if (foodList) {
    foodList.addEventListener('click', async event => {
      const button = event.target.closest('.add-to-shopping-button');

      if (!button) return;

      const foodId = button.dataset.id;
      const food = state.foods.find(item => item.id === foodId);

      if (!food) return;

      await handleAddShoppingItem({
        name: food.name,
        quantity: ''
      });

      alert(`${food.name}を買い物リストに追加しました。`);
    });
  }
}
