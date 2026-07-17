// 안드로이드 앱(Capacitor)에서의 데이터 내구성 보강.
//
// WebView의 localStorage는 OS가 저장공간 부족 시 지울 수 있는 저장소라서,
// 네이티브 앱에서는 Capacitor Preferences(안드로이드 SharedPreferences)에
// 같은 데이터를 미러링합니다. 앱 시작 시 localStorage에 데이터가 없으면
// (= OS가 지웠거나 최초 실행) 네이티브 저장소에서 복원합니다.
//
// 웹(브라우저/PWA)에서는 전부 no-op이라 기존 동작이 그대로 유지됩니다.

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const MIRROR_KEYS = ["adventure.appState.v1", "adventure.pinSalt.v1"];

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

// 앱 부팅 시 1회 호출. localStorage에 키가 없을 때만 네이티브 값으로 복원한다.
// (둘 다 있으면 localStorage 쪽이 최신이거나 동일하므로 건드리지 않는다.)
export async function restoreFromNativeStorage() {
  if (!isNativeApp()) return;
  for (const key of MIRROR_KEYS) {
    try {
      if (localStorage.getItem(key) !== null) continue;
      const { value } = await Preferences.get({ key });
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    } catch (err) {
      console.error("네이티브 저장소 복원 실패:", key, err);
    }
  }
}

// 저장 시마다 호출. 실패해도 앱 동작(localStorage 저장)에는 영향이 없다.
export function mirrorSet(key, value) {
  if (!isNativeApp()) return;
  Preferences.set({ key, value }).catch((err) => {
    console.error("네이티브 저장소 기록 실패:", key, err);
  });
}

export function mirrorRemove(key) {
  if (!isNativeApp()) return;
  Preferences.remove({ key }).catch((err) => {
    console.error("네이티브 저장소 삭제 실패:", key, err);
  });
}
