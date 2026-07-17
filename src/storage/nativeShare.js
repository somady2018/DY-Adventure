// 안드로이드 앱에서의 백업 파일 내보내기.
//
// WebView는 <a download> 를 지원하지 않으므로, 네이티브 앱에서는 백업 JSON을
// 앱 캐시 폴더에 파일로 쓴 뒤 안드로이드 공유 시트를 띄웁니다.
// 사용자는 구글 드라이브, 카카오톡 등 원하는 곳으로 백업을 보낼 수 있습니다.

import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function shareBackupFile(fileName, json) {
  const written = await Filesystem.writeFile({
    path: fileName,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: fileName,
    dialogTitle: "백업 파일 저장하기",
    files: [written.uri],
  });
}

// 공유 시트를 사용자가 그냥 닫은 경우는 오류로 취급하지 않기 위한 판별.
export function isShareCanceled(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return msg.includes("cancel") || msg.includes("dismiss");
}
