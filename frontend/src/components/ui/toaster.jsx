import { ToastProvider, ToastViewport } from "@radix-ui/react-toast"

export function Toaster() {
  return (
    <ToastProvider swipeDirection="right">
      <ToastViewport className="fixed bottom-0 right-0 flex flex-col gap-2 w-full max-w-[420px] p-4 z-[100]" />
    </ToastProvider>
  )
}
