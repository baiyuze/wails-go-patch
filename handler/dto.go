package dto

type FileData struct {
	Filename   string `json:"filename"`
	Data       string `json:"data"`
	TargetPath string `json:"targetPath"`
}
