import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

import { db, auth } from './firebase';

// 食品を登録
export async function addFood(food) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('ユーザー認証が完了していません');
  }

  const foodsRef = collection(
    db,
    'users',
    user.uid,
    'foods'
  );

  return await addDoc(foodsRef, {
    ...food,
    createdAt: serverTimestamp()
  });
}

// 食品一覧を取得
export async function getFoods() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('ユーザー認証が完了していません');
  }

  const foodsRef = collection(
    db,
    'users',
    user.uid,
    'foods'
  );

  const snapshot = await getDocs(foodsRef);

  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data()
  }));
}

// 食品を削除
export async function removeFood(foodId) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('ユーザー認証が完了していません');
  }

  const foodRef = doc(
    db,
    'users',
    user.uid,
    'foods',
    foodId
  );

  await deleteDoc(foodRef);
}
