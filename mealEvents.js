export function bindMealEvents({ state, actions }) {
  const {
    render,
    changeMealDate,
    loadMeals,
    openMealModal,
    handleSaveMeal,
    handleDeleteMeal
  } = actions;

  // 前日ボタン
  const previousMealDateButton = document.querySelector('#previous-meal-date');
  if (previousMealDateButton) {
    previousMealDateButton.addEventListener('click', () => {
      changeMealDate(-1);
    });
  }

  // 今日ボタン
  const todayMealDateButton = document.querySelector('#today-meal-date');
  if (todayMealDateButton) {
    todayMealDateButton.addEventListener('click', async () => {
      state.selectedMealDate = new Date();
      state.selectedMealDate.setHours(0, 0, 0, 0);
      state.currentMealType = null;
      await loadMeals();
    });
  }

  // 翌日ボタン
  const nextMealDateButton = document.querySelector('#next-meal-date');
  if (nextMealDateButton) {
    nextMealDateButton.addEventListener('click', () => {
      changeMealDate(1);
    });
  }

  // 献立の新規登録ボタン
  document.querySelectorAll('.meal-add-button').forEach(button => {
    button.addEventListener('click', () => {
      openMealModal(button.dataset.type);
    });
  });

    // 日付の入力
  const mealDateInput = document.querySelector('#meal-date');
  if (mealDateInput) {
    mealDateInput.addEventListener('change', event => {
      state.mealDateInput = event.target.value;
    });
  }

  // 食事区分の選択
  const mealTypeSelect = document.querySelector('#meal-type');
  if (mealTypeSelect) {
    mealTypeSelect.addEventListener('change', event => {
      state.currentMealType = event.target.value;
    });
  }

  // 献立名をクリックして編集
  document.querySelectorAll('.meal-name-button').forEach(button => {
    button.addEventListener('click', () => {
      const meal = state.meals.find(
        item => item.id === button.dataset.id
      );

      if (!meal) return;

      openMealModal(meal.type, meal);
    });
  });

  // 献立名の入力
  const mealNameInput = document.querySelector('#meal-name');
  if (mealNameInput) {
    mealNameInput.addEventListener('input', event => {
      state.mealNameInput = event.target.value;
    });
  }

  // レシピURLの入力
  const mealRecipeUrlInput = document.querySelector('#meal-recipe-url');
  if (mealRecipeUrlInput) {
    mealRecipeUrlInput.addEventListener('input', event => {
      state.mealRecipeUrlInput = event.target.value;
    });
  }

  // レシピ検索ボタン
  const recipeSearchButton = document.querySelector('#recipe-search-button');
  if (recipeSearchButton) {
    recipeSearchButton.addEventListener('click', () => {
      const mealName = state.mealNameInput.trim();

      if (!mealName) {
        alert('料理名を入力してください');
        mealNameInput?.focus();
        return;
      }

      const query = encodeURIComponent(`${mealName} レシピ`);
      window.open(
        `https://www.google.com/search?q=${query}`,
        '_blank',
        'noopener,noreferrer'
      );
    });
  }

  // 材料フィルターの切り替え
  document.querySelectorAll('.ingredient-filter').forEach(button => {
    button.addEventListener('click', () => {
      state.ingredientFilter = button.dataset.filter;
      render();
    });
  });

  // 材料の選択・解除
  document.querySelectorAll('.ingredient-tag').forEach(button => {
    button.addEventListener('click', () => {
      const foodId = button.dataset.id;

      if (state.selectedIngredientIds.includes(foodId)) {
        state.selectedIngredientIds =
          state.selectedIngredientIds.filter(id => id !== foodId);
      } else {
        state.selectedIngredientIds = [
          ...state.selectedIngredientIds,
          foodId
        ];
      }

      render();
    });
  });

  // 献立の保存
  const mealForm = document.querySelector('#meal-form');
  if (mealForm) {
    mealForm.addEventListener('submit', async event => {
      event.preventDefault();

      const mealName = state.mealNameInput.trim();

      if (!mealName) {
        alert('料理名を入力してください');
        return;
      }

      await handleSaveMeal(
        state.mealDateInput,
        mealName,
        state.mealRecipeUrlInput
      );
    });
  }

  // 献立モーダルを閉じる
  function closeMealModal() {
    state.editingMealId = null;
    state.currentMealType = null;
    state.selectedIngredientIds = [];
    state.mealDateInput = '';
    state.mealNameInput = '';
    state.mealRecipeUrlInput = '';
    state.isMealModalOpen = false;

    render();
  }

  // 閉じるボタン
  const closeMealModalButton = document.querySelector('#close-meal-modal');
  if (closeMealModalButton) {
    closeMealModalButton.addEventListener('click', closeMealModal);
  }

  // キャンセルボタン
  const cancelMealButton = document.querySelector('#cancel-meal-modal');
  if (cancelMealButton) {
    cancelMealButton.addEventListener('click', closeMealModal);
  }

  // 献立の削除
  const mealDeleteButton = document.querySelector('#meal-delete-button');
  if (mealDeleteButton) {
    mealDeleteButton.addEventListener('click', () => {
      if (state.editingMealId) {
        handleDeleteMeal(state.editingMealId);
      }
    });
  }
}
