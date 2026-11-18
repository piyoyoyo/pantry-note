import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

import { db } from './firebase';

// 家ごとの食品コレクションを取得
function getFoodsCollection(householdId) {
  return collection(db, 'households', householdId, 'foods');
}

// 食品一覧を取得
export async function getFoods(householdId) {
  const foodsRef = getFoodsCollection(householdId);
  const q = query(foodsRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 食品を追加
export async function addFood(householdId, food) {
  const foodsRef = getFoodsCollection(householdId);

  const docRef = await addDoc(foodsRef, {
    name: food.name,
    stockStatus: food.stockStatus || '在庫あり',
    place: food.place,
    expiryDate: food.expiryDate || '',
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

// 食品を削除
export async function deleteFood(householdId, foodId) {
  const foodRef = doc(
    db,
    'households',
    householdId,
    'foods',
    foodId
  );

  await deleteDoc(foodRef);
}

// 食品情報を更新
export async function updateFood(householdId, foodId, food) {
  const foodRef = doc(
    db,
    'households',
    householdId,
    'foods',
    foodId
  );

  await updateDoc(foodRef, {
    name: food.name,
    stockStatus: food.stockStatus || '在庫あり',
    place: food.place,
    expiryDate: food.expiryDate || ''
  });
}