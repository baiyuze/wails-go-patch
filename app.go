package main

import (
	"context"
	"encoding/json"
	"fmt"
	dto "lmes-patch/handler"
	"lmes-patch/handler/utils"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/evilsocket/islazy/zip"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct

type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// 打开文件夹
func (a *App) OpenDirectory() string {
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{})
	if err != nil {
		return err.Error()
	}
	return path
}

// 扫描cms路径

func (a *App) ScanCmsPath(cmsPath string) string {
	cmsPath, err := utils.ToSlashByPath(cmsPath)
	if err != nil {
		return err.Error()
	}
	var wg sync.WaitGroup
	cmsPaths := []string{}
	cmsFilterPaths := []string{}
	cmsContents := []map[string]string{}
	resultCh := make(chan string)
	cmsFilePaths := []string{}

	matchs, err := filepath.Glob(filepath.Join(cmsPath, "/*"))
	if err != nil {
		return err.Error()
	}
	for _, match := range matchs {
		info, err := os.Stat(match)
		if err != nil {
			return err.Error()
		}
		if info.IsDir() && (info.Name() != ".git" || info.Name() != "node_modules") {
			wg.Add(1)
			go a.walkDirConcurrent(match, resultCh, &wg)
		} else {
			cmsFilePaths = append(cmsFilePaths, match)
		}
	}
	go func() {
		wg.Wait()
		close(resultCh) // 所有任务完成后关闭通道
	}()

	for path := range resultCh {
		cmsPaths = append(cmsPaths, path)
	}

	for _, filePath := range cmsFilePaths {
		if strings.Contains(filePath, "version.json") {
			cmsPaths = append(cmsPaths, filePath)
		}
	}

	// 读取文件，校验文件是否是cms的文件
	for _, path := range cmsPaths {
		parentPath := filepath.Dir(path)
		// 判断是否是host/wwwroot目录下的文件
		subDir := filepath.ToSlash("host/wwwroot")
		widgetDir := filepath.Join(parentPath, subDir)
		if utils.FolderExists(widgetDir) {
			cmsFilterPaths = append(cmsFilterPaths, path)
		}
	}

	for _, path := range cmsFilterPaths {
		content, redErr := os.ReadFile(path)
		if redErr != nil {
			return redErr.Error()
		}
		cmsContents = append(cmsContents, map[string]string{
			"path":       path,
			"parentPath": filepath.Dir(path),
			"filename":   filepath.Base(path),
			"ext":        filepath.Ext(path), // ".json
			"content":    string(content),
		})
	}

	data, err := json.Marshal(cmsContents)
	if err != nil {
		return err.Error()
	}
	return string(data)
}

var sem = make(chan struct{}, 20)

func (a *App) walkDirConcurrent(path string, resultCh chan<- string, wg *sync.WaitGroup) {
	defer wg.Done()

	// 控制最大并发
	sem <- struct{}{}
	defer func() { <-sem }()

	entries, err := os.ReadDir(path)
	if err != nil {
		if os.IsPermission(err) {
			fmt.Printf("跳过无权限目录: %s\n", path)
			return
		}
		fmt.Printf("读取目录出错: %s, 错误: %v\n", path, err)
		return
	}

	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())

		// 处理目录
		if entry.IsDir() {
			// 可选：跳过 node_modules、.git 等
			if entry.Name() == "node_modules" || entry.Name() == ".git" {
				runtime.EventsEmit(a.ctx, "SCAN_PATH", path)
				continue
			}
			wg.Add(1)
			go a.walkDirConcurrent(fullPath, resultCh, wg)
			continue
		}

		// 处理文件
		slashPath, err := utils.ToSlashByPath(fullPath)
		if err != nil {
			fmt.Printf("路径转换失败: %s, 错误: %v\n", fullPath, err)
			continue
		}
		if strings.Contains(slashPath, "version.json") {
			resultCh <- slashPath
		}
	}
}

func (a *App) walkDir(childPath string, resultCh chan<- string, wg *sync.WaitGroup) error {
	defer wg.Done()
	start := time.Now()

	error := filepath.WalkDir(childPath, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			if os.IsPermission(err) {
				fmt.Printf("跳过无权限目录:%s\n", path)
				return nil
			}
			return err
		}
		elapsed := time.Since(start)
		if elapsed > 300*time.Millisecond {
			start = time.Now()
			runtime.EventsEmit(a.ctx, "SCAN_PATH", path)
		}
		slashPath, err := utils.ToSlashByPath(path)
		if err != nil {
			return err
		}
		if strings.Contains(slashPath, "version.json") {
			resultCh <- slashPath
		}
		return nil
	})

	return error

}

// 解压补丁文件
func (a *App) UnzipFile(fileObj dto.FileData) error {
	zipPath, err := utils.ReceiveFileBlob(fileObj)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return err
	}
	targetPath, err := utils.ToSlashByPath(fileObj.TargetPath)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return err
	}
	_, err = zip.Unzip(zipPath, targetPath)

	if err != nil {
		runtime.LogError(a.ctx, err.Error())

		return err
	}
	unzipPath := filepath.Join(targetPath, fileObj.Filename)
	unzipDir := strings.Split(unzipPath, ".zip")[0]
	slashUnzipDir, err := utils.ToSlashByPath(unzipDir)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return err
	}
	if utils.FolderExists(slashUnzipDir) {
		reErr := os.RemoveAll(slashUnzipDir)
		if reErr != nil {
			runtime.LogError(a.ctx, reErr.Error())
			return reErr
		}
		return fmt.Errorf("安装包格式不正确，请检查")
	}

	// 暂时不处理
	// if rt.GOOS != "windows" {
	// 	cpErr := cp.Copy(slashUnzipDir, targetPath)

	// 	if cpErr != nil {
	// 		runtime.LogError(a.ctx, cpErr.Error())
	// 		return cpErr
	// 	}
	// 	// 删除之前removeUnzipDir
	// 	reErr := os.RemoveAll(slashUnzipDir)

	// 	if reErr != nil {
	// 		runtime.LogError(a.ctx, reErr.Error())
	// 		return reErr
	// 	}
	// }

	return nil
}
