import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

import { db } from "./firebase";

// 家を作成する
export async function createHousehold(userId, householdName) {

  // Firestoreに新しい家のIDを発行
  const householdRef = doc(collection(db, "households"));
  const householdId = householdRef.id;

  // メンバー情報の保存先
  const memberRef = doc(
    db,
    "households",
    householdId,
    "members",
    userId
  );

  // ユーザー情報の保存先
  const userRef = doc(db, "users", userId);

  // 複数のデータをまとめて保存
  const batch = writeBatch(db);

  // 家の情報
  batch.set(householdRef, {
    name: householdName,
    createdBy: userId,
    createdAt: serverTimestamp()
  });

  // 作成者を管理者として登録
  batch.set(memberRef, {
    role: "owner",
    joinedAt: serverTimestamp()
  });

  // ユーザーに所属する家のIDを登録
  batch.set(userRef, {
    householdId: householdId
  }, { merge: true });

  // Firestoreに保存
  await batch.commit();

  return householdId;
}

// ユーザーが所属している家のIDを取得
export async function getUserHousehold(userId) {
  const userRef = doc(db, "users", userId);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.data().householdId || null;
}

// 家の名前を取得する
export async function getHouseholdName(householdId) {
  const householdRef = doc(db, "households", householdId);
  const householdSnapshot = await getDoc(householdRef);

  if (!householdSnapshot.exists()) {
    return "";
  }

  return householdSnapshot.data().name || "";
}