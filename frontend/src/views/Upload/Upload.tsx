import { useEffect, useState } from "react";
import styles from "./Upload.module.scss";
import Table from "@/components/Table/Table";
import { Button, Spin } from "antd";
import { useNavigate } from "react-router";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";
import {
  Greet,
  ScanCmsPath,
  OpenDirectory,
  UnzipFile,
} from "../../../wailsjs/go/main/App";
import { useSearchParams } from "react-router-dom";

const { Dragger } = Upload;
export default function Result() {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [searchParams] = useSearchParams();
  const targetPath = searchParams.get("path");
  const version = searchParams.get("version");
  const fileToDataURL = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          // @ts-ignore
          const str = reader.result.split(",")[1];
          resolve(str);
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const props: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".zip",
    showUploadList: false,
    async beforeUpload(file) {
      const fileStr = await fileToDataURL(file);
      setSpinning(true);

      try {
        const err = await UnzipFile({
          filename: file.name,
          data: fileStr,
          targetPath: targetPath || "",
        });
      } catch (error) {
        console.log(error)
      }
      setSpinning(false);
      message.success("更新成功");
      return false;
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };
  useEffect(() => { });
  return (
    <div className={styles.upload}>
      <Spin spinning={spinning} fullscreen />
      <header className={styles.header}>
        <Button onClick={() => navigate("/result")}>返回</Button>
        <h3>版本：CMS {version}</h3>
        <span></span>
      </header>
      <div className={styles.content}>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽上传文件</p>
          <p className="ant-upload-hint">仅支持单个zip补丁进行上传</p>
        </Dragger>
      </div>
    </div>
  );
}
