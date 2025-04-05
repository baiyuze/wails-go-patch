import request from "@/utils/request";

export const getList: any = (data: {
  pageSize: number;
  pageNum: number;
  url: string;
}) => {
  return request.get(data.url, { params: data });
};
