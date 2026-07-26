/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../src/services/auth.service";

interface SessionCheckerProps {
  children: ReactNode;
}

export const SessionChecker = ({ children }: SessionCheckerProps): React.JSX.Element | null => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    (async (): Promise<void> => {
      try {
        const session = await getSession(); 
        if (!isMounted) return;

        if (!session?.userApps?.length) {
          window.location.replace("/login");
          return;
        }

        setAuthorized(true);
      } catch (err) {
        if (isMounted) window.location.replace("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (loading) return <div>Loading...</div>;
  if (!authorized) return null;

  return <>{children}</>;
}