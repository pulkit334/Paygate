  import axios, { type AxiosInstance } from "axios";

  // const getToken = () => {
  //   const match = document.cookie.match(/token=([^;]+)/);
  //   return match ? match[1] : null;
  // };


const getToken = ()=>{
  const cookies = document.cookie.split("; ");
  for(const cookie of cookies){
    const [name,value] = cookie.split("=");
    if(name =="token") return value;
  }
  return null;
}


  const attachInterceptors = (instance: AxiosInstance) => {
    instance.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const originalRequest = error.config;
        const url = originalRequest?.url || "";
        const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

        if (status === 401 && !isAuthRoute) {
          const token = getToken();
          if (!token) {
            window.location.replace("/login");
          }
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
