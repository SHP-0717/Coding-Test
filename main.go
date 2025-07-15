package main

import (
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"runtime"
)

func main() {
	// 1. 建立網站伺服器，內容來自 ./ 資料夾
	fs := http.FileServer(http.Dir(""))
	http.Handle("/", fs)

	// 2. 網址設定
	port := "8080"
	url := "http://localhost:" + port

	// 3. 自動開啟瀏覽器
	go openBrowser(url)

	// 4. 啟動伺服器
	fmt.Println("🚀 已啟動伺服器，請在瀏覽器打開：", url)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// 根據系統自動打開瀏覽器
func openBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler", url}
	case "darwin": // macOS
		cmd = "open"
		args = []string{url}
	case "linux":
		cmd = "xdg-open"
		args = []string{url}
	default:
		fmt.Println("⚠️ 無法辨識作業系統，請手動打開網址：", url)
		return
	}

	exec.Command(cmd, args...).Start()
}