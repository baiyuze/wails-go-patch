package utils

import (
	"encoding/base64"
	"fmt"
	dto "lmes-patch/handler"
	"os"
	"path/filepath"
)

// ToSlashByPath 处理不同平台的路径问题
func ToSlashByPath(path string) (string, error) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return path, err
	}
	slashPath := filepath.ToSlash(absPath)
	return slashPath, err
}

func FolderExists(folderPath string) bool {
	// 使用 os.Stat 获取文件/文件夹的元信息
	info, err := os.Stat(folderPath)
	// 如果错误为 "文件不存在"，返回 false
	if os.IsNotExist(err) {
		return false
	}
	// 如果路径是目录，返回 true
	return info.IsDir()
}

func ReceiveFileBlob(file dto.FileData) (string, error) {
	// 解码 Base64 数据
	data, err := base64.StdEncoding.DecodeString(file.Data)
	var zipPath string = ""
	if err != nil {
		return zipPath, fmt.Errorf("无法解码 Base64 数据: %v", err)
	}
	// 存储文件
	savePath := filepath.Join("uploads", file.Filename)
	toSlashSavePath, toErr := ToSlashByPath(savePath)

	if toErr != nil {
		return zipPath, fmt.Errorf("无法slash目录: %v", toErr)
	}
	err = os.MkdirAll("uploads", os.ModePerm) // 确保 uploads 目录存在
	if err != nil {
		return zipPath, fmt.Errorf("无法创建目录: %v", err)
	}
	// 写入文件
	err = os.WriteFile(toSlashSavePath, data, 0644)
	if err != nil {
		return zipPath, fmt.Errorf("无法写入文件: %v", err)
	}
	return toSlashSavePath, err

	// 触发前端事件，通知文件上传成功
	// runtime.EventsEmit(a.ctx, "FileUploaded", savePath)
	// fmt.Println("文件已保存:", savePath)

}
