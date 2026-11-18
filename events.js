import { bindFoodEvents } from './foodEvents';
import { bindMealEvents } from './mealEvents';

export function bindEvents({ state, actions }) {
  const {
    render,
    handleCreateInvite
  } = actions;

  // 食品関連のイベント登録
  bindFoodEvents({ state, actions });

  // 献立関連のイベント登録
  bindMealEvents({ state, actions });

  // 設定メニューの開閉
  const settingsButton = document.querySelector('#settings-button');
  const settingsMenu = document.querySelector('#settings-menu');

  if (settingsButton && settingsMenu) {
    settingsButton.addEventListener('click', () => {
      settingsMenu.classList.toggle('hidden');
    });
  }

  // 下部ナビゲーションのタブ切り替え
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      if (state.currentTab === tab) return;

      state.currentTab = tab;
      render();
    });
  });

  // 家族招待ボタン
  const inviteButton = document.querySelector('#invite-button');

  if (inviteButton) {
    inviteButton.addEventListener('click', () => {
      if (settingsMenu) {
        settingsMenu.classList.add('hidden');
      }

      handleCreateInvite();
    });
  }
}

// 家の作成フォームのイベント登録
export function bindHouseholdEvents({ handleCreateHousehold }) {
  const householdForm = document.querySelector('#household-form');

  if (!householdForm) return;

  householdForm.addEventListener('submit', async event => {
    event.preventDefault();

    const householdName = new FormData(event.target)
      .get('household-name')
      .trim();

    if (!householdName) {
      alert('家の名前を入力してください');
      return;
    }

    await handleCreateHousehold(householdName);
  });
}
