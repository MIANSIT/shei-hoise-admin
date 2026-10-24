"use client"

import { useTheme } from "@/lib/context/ThemeContext"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "px-4 py-2 rounded-md shadow-lg", // base styles only
          description: "text-sm",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
