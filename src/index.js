export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. 先去 public 撈取靜態備份檔案
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return new Response("Not Found", { status: 404 });
    }

    // 2. 🪄 核心防禦：如果是瀏覽器「導向」直接開啟的（例如：用戶直接點網址、或 <a> 標籤直連）
    // 現代瀏覽器直接開啟時，Sec-Fetch-Mode 會是 "navigate"
    const fetchMode = request.headers.get("Sec-Fetch-Mode");
    if (fetchMode === "navigate") {
      return new Response("🔒 拒絕存取：此資源禁止瀏覽器直接連線檢視。", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // 3. 🛡️ 修改 Response Header，強迫偽裝成二進位串流，並拔除檔案型態
    const securedHeaders = new Headers(response.headers);
    
    // 將 Content-Type 強制改為八位元組流（二進位不明檔案），讓瀏覽器無法直接線上預覽圖片/影片
    securedHeaders.set("Content-Type", "application/octet-stream");
    // 隱藏原本的快取與安全性資訊
    securedHeaders.set("Content-Disposition", "attachment; filename=\"blob_data\"");

    return new Response(response.body, {
      status: response.status,
      headers: securedHeaders
    });
  }
};
