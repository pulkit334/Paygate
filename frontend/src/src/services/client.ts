import axios, { type AxiosInstance } from "axios";
// Match the structur from the backend and then edit here
const attachInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const originalRequest = error.config;

      if (status === 429) {
        window.location.replace("/");
        return Promise.reject(error);
      }

      if (
        status === 401 &&
        code === "ACCESS_TOKEN_EXPIRED" &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          await instance.post("/auth/refresh");
          return instance(originalRequest);
        } catch {
          window.location.replace("/");
          return Promise.reject(error);
        }
      }

      if (status === 401) {
        window.location.replace("/");
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
};

export const MerchantApi = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
});
attachInterceptors(MerchantApi);

export const PaymentApi = axios.create({
  baseURL: " http://localhost:5000/api/v2",
  withCredentials: true,
});
attachInterceptors(PaymentApi);

export const api = PaymentApi;
export default api;
