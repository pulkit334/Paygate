  import axios, { type AxiosInstance } from "axios";

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

        if (status === 403 && error.response?.data?.type === "SessionLimitExceededError") {
          error.message = error.response.data.error;
        }

        if (error.response?.data?.error) {
          error.message = error.response.data.error;
        }

        return Promise.reject(error);
      },
    );
  };

const BASE_URL1 = (import.meta as any).env?.VITE_BASE_URL1 || "/api/v1";
const BASE_URL2 = (import.meta as any).env?.VITE_BASE_URL2 || "/api/v2";

  export const MerchantApi = axios.create({
    baseURL: BASE_URL1,
    withCredentials: true,
  });
  attachInterceptors(MerchantApi);

  export const PaymentApi = axios.create({
    baseURL: BASE_URL2,
    withCredentials: true,
  });
  attachInterceptors(PaymentApi);

  export const api = PaymentApi;
  export default api;
