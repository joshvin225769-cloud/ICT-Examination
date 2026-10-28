import { createContext, useContext, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
const Context = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  return <Context.Provider value={message => setToast({ message })}>{children}{toast && <div className="toast" role="status"><CheckCircle2 size={20} /><span>{toast.message}</span><button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button></div>}</Context.Provider>;
}
export const useToast = () => useContext(Context);
