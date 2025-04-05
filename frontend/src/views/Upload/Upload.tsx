import { useEffect, useState } from "react";
import styles from "./Upload.module.scss";
import Table from "@/components/Table/Table";
import { Alert, Button, Modal, notification, Spin } from "antd";
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
        await UnzipFile({
          filename: file.name,
          data: fileStr,
          targetPath: targetPath || "",
        });
        const t = setTimeout(() => {
          setSpinning(false);
          Modal.success({
            title: <div style={{ textAlign: "left" }}>提示</div>,
            content: <div style={{ textAlign: "left", fontSize: 16 }}>安装成功</div>,
            okText: "知道了"
          });
          clearTimeout(t)
        }, 300);
      } catch (error) {
        message.error(error as string)
        setSpinning(false);
      }

      return false;
    },

  };
  return (
    <div className={styles.upload}>
      <Spin spinning={spinning} fullscreen />
      <header className={styles.header}>
        <Button style={{ marginLeft: 10 }} size="small" onClick={() => navigate("/result")}>返回</Button>
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
