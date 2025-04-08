import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  Ref,
  Fragment,
} from "react";
import { Table, Card, Pagination, Empty } from "antd";
import type { TablePaginationConfig, TableProps } from "antd";
import { getList } from "./api";
import styles from "./Table.module.scss";

interface PropType {
  url?: string;
  columns: TableProps<any>["columns"];
  data?: any[];
  pageNum?: number;
  pageSize?: number;
  rowKey?: string | number;
  pagination?: false | TablePaginationConfig;
  isHidePage?: boolean;
  total?: number;
  type?: "table" | "card";
  params?: any;
}

const BaseTable = (props: PropType, ref: Ref<any>) => {
  const [data, setData] = useState<any[]>([]);
  const tableRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [total, setTotal] = useState(0);
  const pageNum = useRef(props.pageNum || 1);
  const pageSize = props.pageSize || 20;
  const [column, setColumn] = useState<any>({});

  const getTableList = async () => {
    if (!props.url) return;
    const res = await getList({
      pageNum: pageNum.current,
      pageSize,
      url: props.url,
      ...(props.params || {}),
    });
    if (res) {
      setTotal(res.total);
      setData(res.list || res.items);
      getTableHeight();
      return res.list || res.items;
    }
  };
  const getTableHeight = () => {
    const dom = tableRef.current as unknown as Element;
    if (dom) {
      const parent = dom.parentNode as Element;
      if (parent) {
        const styles = window.getComputedStyle(parent);
        const height = parseInt(styles.height);
        setHeight(height);
      }
    }
  };
  useEffect(() => {
    if (props.data) {
      setData(props.data);
      getTableHeight();
    }
  }, [props.data]);
  useEffect(() => {
    // 获取操作配置
    if (props.type == "card") {
      const column = props.columns?.find((item: any) => {
        return item.dataIndex == "action";
      });
      if (column) setColumn(column);
    }
    if (props.url) {
      getTableList();
    }
  }, []);
  const onChange = (n: number) => {
    pageNum.current = n;
    getTableList();
  };
  const pagination = !props.isHidePage
    ? {
        pageSize,
        current: pageNum.current,
        total: props.total || total,
        onChange,
        showSizeChanger: false,
      }
    : false;
  useImperativeHandle(ref, () => {
    return {
      getTableList,
    };
  });
  return (
    <Fragment>
      {props.type == "card" ? (
        <div className={styles.card}>
          {data.length ? (
            data?.map((item: any) => {
              return (
                <Card
                  title={item.name}
                  extra={column?.render?.(item["action"], item)}
                  style={{ width: 300 }}
                  key={item.id}
                  className={styles.cardItem}
                >
                  {props.columns?.map((column: any) => {
                    if (column.dataIndex === "action") return;
                    return (
                      <div className={styles.row} key={column.dataIndex}>
                        <span className={styles.name}>{column.title}：</span>
                        <span className={styles.data}>
                          {column.render
                            ? column?.render?.(item[column.dataIndex], item)
                            : item[column.dataIndex]}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              );
            })
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无数据"
              className={styles.empty}
            />
          )}
        </div>
      ) : (
        <Table
          rowKey={props.rowKey || "id"}
          ref={tableRef}
          dataSource={data}
          columns={props.columns || []}
          scroll={{ y: height - 100 }}
          pagination={pagination}
        />
      )}
      {props.type == "card" && (
        <div className={styles.footer}>
          <Pagination
            current={pageNum.current}
            onChange={onChange}
            total={total}
            pageSize={pageSize}
            showSizeChanger={false}
          />
        </div>
      )}
    </Fragment>
  );
};

export default forwardRef(BaseTable);
