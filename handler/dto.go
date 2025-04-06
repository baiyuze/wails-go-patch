package dto

import "context"

type FileData struct {
	Filename   string `json:"filename"`
	Data       string `json:"data"`
	TargetPath string `json:"targetPath"`
}

type App struct {
	ctx context.Context
}
