import { useEffect, useState } from "react";
import logo from "@/assets/images/logo-universal.png";
import styles from "./Home.module.scss";
import { Button, Input, message, Select, Upload } from "antd";
import { ScanOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Hide,
  EventsEmit,
  EventsOn,

  // OpenDirectoryDialog,
} from "../../../wailsjs/runtime/runtime";
import {
  Greet,
  ScanCmsPath,
  OpenDirectory,
} from "../../../wailsjs/go/main/App";
import { Navigate, Route, useNavigate } from "react-router";
import { throttle } from "lodash";

function App() {
  const [cmsPath, setCmsPath] = useState("C:");
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState("");
  const navigate = useNavigate();

  useEffect(throttle(() => {
    const path = localStorage.getItem("cmsPath");
    if (path) {
      setCmsPath(path);
    }
  }, 100), []);

  useEffect(() => {
    EventsOn("SCAN_PATH", (path) => {
      setPath(path)
    })

  })

  const handleSelect = async () => {
    // 处理扫描逻辑
    const dir = await OpenDirectory("测试");
    localStorage.setItem("cmsPath", dir);
    setCmsPath(dir);
  };

  const onScan = async () => {
    if (loading) {
      return message.warning("正在扫描中，请稍后");
    }
    if (cmsPath === "" || cmsPath === undefined) {
      message.error("请选择CMS所在文件夹");
      return;
    }
    setLoading(true);
    const json = await ScanCmsPath(cmsPath);
    setLoading(false);
    message.success("扫描完成");
    try {
      const jsonObj = JSON.parse(json);
      localStorage.setItem("cmsVersionData", JSON.stringify(jsonObj)); // 存储JSON对象
      navigate("/result");
    } catch (error) {
      console.error("JSON解析错误:", error);
      message.error("JSON解析错误");
    }
  };

  return (
    <div className={styles.home}>
      <div onClick={onScan} className={styles.actionButtons}>
        {loading ? "正在扫描中..." : "开始扫描"}
      </div>
      <div style={{ color: "#555", height: 30, fontSize: 13, marginTop: 20 }}>
        {path}
      </div>

      <div className={styles.path}>
        <Input
          value={cmsPath}
          className="input"
          placeholder="请输入CMS所在盘符"
          style={{ width: 300 }}
        />
        <Button className={styles.btn} onClick={handleSelect}>
          选择
        </Button>
      </div>
    </div>
  );
}

export default App;
