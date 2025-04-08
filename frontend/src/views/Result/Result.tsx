import { useEffect, useState } from "react";
import styles from "./Result.module.scss";
import Table from "@/components/Table/Table";
import { Button } from "antd";
import { useNavigate } from "react-router";
import { render } from "react-dom";
import dayjs from "dayjs";
export default function Result() {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState([]);
  useEffect(() => {
    const data = localStorage.getItem("cmsVersionData");
    try {
      if (data) {
        const cmsData = JSON.parse(data); // 解析content字段为JSON对象
        cmsData.forEach((item: any) => {
          const content = JSON.parse(item.content);
          item.id = item.id || Math.random().toString(36).substr(2, 9); // 生成随机i
          Object.assign(item, content);
        });
        setDataSource(cmsData);
      }
    } catch (error) {
      console.error("JSON解析错误:", error);
    }
  }, []);
  const columns = [
    {
      title: "名称",
      dataIndex: "Name",
      key: "Name",
      render: () => {
        return "CMS";
      },
    },
    {
      title: "文件路径",
      dataIndex: "parentPath",
      key: "parentPath",
      width: 300,
      render: (text: string, record: any) => {
        return record.parentPath || "-";
      },
    },
    {
      title: "版本",
      dataIndex: "ProductVersion",
      key: "ProductVersion",
    },
    {
      title: "编译日期",
      dataIndex: "BuildDate",
      key: "BuildDate",
      render: (text: string) => {
        return dayjs(text).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      width: 150,
      render: (text: string, record: any) => {
        return (
          <Button
            onClick={() =>
              navigate(
                `/upload?path=${record.parentPath}&version=${record.ProductVersion}`
              )
            }
            type="primary"
          >
            打补丁
          </Button>
        );
      },
    },
  ];

  return (
    <div className={styles.box}>
      <header className={styles.header}>
        <Button
          style={{ marginLeft: 10 }}
          size="small"
          onClick={() => navigate("/")}
        >
          返回
        </Button>
        <h3>扫描结果</h3>
        <span></span>
      </header>
      <div style={{ height: "calc(100% - 30px)", width: "calc(100% - 35px)" }}>
        <Table
          isHidePage={true}
          data={dataSource}
          columns={columns}
          rowKey="BuildDate"
        />
      </div>
    </div>
  );
}
