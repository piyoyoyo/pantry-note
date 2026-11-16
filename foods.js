import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

import { db } from './firebase';

// ユーザー専用の食品コレクションを取得
function getFoodsCollection(userId) {
  return collection(db, 'users', userId, 'foods');
}

// 食品一覧を取得
export async function getFoods(userId) {
  const foodsRef = getFoodsCollection(userId);
  const q = query(foodsRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 食品を追加
export async function addFood(userId, food) {
  const foodsRef = getFoodsCollection(userId);

  const docRef = await addDoc(foodsRef, {
    name: food.name,
    quantity: food.quantity,
    place: food.place,
    expiryDate: food.expiryDate || '',
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

// 食品を削除
export async function deleteFood(userId, foodId) {
  const foodRef = doc(db, 'users', userId, 'foods', foodId);

  await deleteDoc(foodRef);
}