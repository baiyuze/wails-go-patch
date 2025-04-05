import { message } from "antd";
import { default as axios, AxiosRequestConfig } from "axios";
// 配置新建一个 axios 实例
const service = axios.create({
  baseURL: "/",
  timeout: 50000,
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Language": "zh-Hans",
  },
});

// 请求前
service.interceptors.request.use(
  async (config: any) => {
    const token = localStorage.getItem("token") || import.meta.env.VITE_TOKEN;
    // console.log('Token', token);
    if (token) config.headers["token"] = token;
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    // if (typeof config.data !== 'object') config.data = JSON.stringify(config.data)
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应后
service.interceptors.response.use(
  (response: any) => {
    const { data } = response;
    if (data.code == 401) {
      message.error("请登录");
      setTimeout(() => {
        location.hash = "login";
      }, 100);
      return;
    }
    if (data.code == 400) {
      message.error(data.msg);
      return Promise.reject(data.msg);
    }
    if (data.code == 404) {
      message.error(data.msg);
      return Promise.reject(data.msg);
    }
    if (data.code === 200) {
      return data.data;
    }

    return data;
  },
  (error: any) => {
    if (error.msg) {
      message.error(error.msg || error.message);
      return Promise.reject(error);
    }
  }
);

type Data = unknown;

type Request = {
  <D = Data>(url: string, config?: AxiosRequestConfig): Promise<D>;
  get<D = Data>(url: string, config?: AxiosRequestConfig): Promise<D>;
  delete<D = Data>(url: string, config?: AxiosRequestConfig): Promise<D>;
  post<D = Data>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<D>;
  put<D = Data>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<D>;
} & typeof service;

const request = service as Request;
export { request as default, request };
