import { grpcPolicy } from "@paygate/resilience";

export async function callWithPolicy<T>(
  client: any,
  method: string,
  request: unknown
): Promise<T> {
  return grpcPolicy.execute(() => {
    return new Promise<T>((resolve, reject) => {
      client[method](request, (err: any, response: T) => {
        if (err) {
          return reject(err);
        }

        resolve(response);
      });
    });
  });
}