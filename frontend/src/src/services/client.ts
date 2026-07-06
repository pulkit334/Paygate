  import axios, { type AxiosInstance } from "axios";

  // Session-based auth: no need to attach Authorization header
  // The session cookie (pg.sid) is sent automatically by the browser

  const attachInterceptors = (instance: AxiosInstance) => {
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const originalRequest = error.config;
        const url = originalRequest?.url || "";
        const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/session");

        if (status === 401 && !isAuthRoute) {
          window.location.replace("/login");
        }

        return Promise.reject(error);
      },
    );
  };

  export const MerchantApi = axios.create({
    baseURL: "http://localhost:6283/api/v1",
    withCredentials: true,
  });
  attachInterceptors(MerchantApi);

  export const PaymentApi = axios.create({
    baseURL: "http://localhost:6283/api/v2",
    withCredentials: true,
  });
  attachInterceptors(PaymentApi);

  export const api = PaymentApi;
  export default api;
