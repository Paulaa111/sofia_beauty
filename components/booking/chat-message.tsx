"use client"

import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: string
  isBot?: boolean
  children?: React.ReactNode
}

export function ChatMessage({ message, isBot = true, children }: ChatMessageProps) {
  return (
    <div className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", isBot ? "justify-start" : "justify-end")}>
      {isBot && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
          S
        </div>
      )}
      <div className={cn(
        "max-w-[85%] md:max-w-[70%]",
        isBot ? "" : "order-first"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isBot 
            ? "bg-card text-card-foreground rounded-tl-sm" 
            : "bg-primary text-primary-foreground rounded-tr-sm"
        )}>
          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
