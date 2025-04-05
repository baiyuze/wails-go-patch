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
	"time"

	"github.com/evilsocket/islazy/zip"
	cp "github.com/otiai10/copy"
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
func (a *App) OpenDirectory(name string) string {
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{})
	if err != nil {
		return err.Error()
	}
	return path
}

// 扫描cms路径

func (a *App) ScanCmsPath(cmsPath string) string {
	// absPath, err := filepath.Abs(cmsPath)
	// if err != nil {
	// 	return err.Error()
	// }
	// absPath = filepath.ToSlash(absPath)
	cmsPath, err := utils.ToSlashByPath(cmsPath)
	if err != nil {
		return err.Error()
	}
	cmsPaths := []string{}
	cmsFilterPaths := []string{}
	cmsContents := []map[string]string{}
	start := time.Now()
	error := filepath.WalkDir(cmsPath, func(path string, d os.DirEntry, err error) error {
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
			cmsPaths = append(cmsPaths, slashPath)
		}
		return nil
	})
	if error != nil {
		return error.Error()
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
		// cmsFilterPaths = append(cmsFilterPaths, parentPath)
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
		fmt.Printf("%+v", cmsContents)
	}

	data, err := json.Marshal(cmsContents)
	if err != nil {
		return err.Error()
	}
	return string(data)
}

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
	// window直接解压打动对应文件夹，mac会新建一个文件夹，把内容放进去
	_, err = zip.Unzip(zipPath, targetPath)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())

		return err
	}
	// 以下window可以不执行
	unzipPath := filepath.Join(targetPath, fileObj.Filename)
	unzipDir := strings.Split(unzipPath, ".zip")[0]
	slashUnzipDir, err := utils.ToSlashByPath(unzipDir)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return err
	}

	cpErr := cp.Copy(slashUnzipDir, targetPath)

	if cpErr != nil {
		runtime.LogError(a.ctx, cpErr.Error())
		return cpErr
	}
	// 删除之前removeUnzipDir
	reErr := os.RemoveAll(slashUnzipDir)

	if reErr != nil {
		runtime.LogError(a.ctx, reErr.Error())
		return reErr
	}
	return nil
}
