"use client"

import { cn } from "@/lib/utils"
import { Sparkles, Eye, Paintbrush } from "lucide-react"

const procedures = [
  { id: "makijaz", name: "Makijaż", icon: Paintbrush, duration: "60-90 min" },
  { id: "laminacja-brwi", name: "Laminacja Brwi", icon: Eye, duration: "45 min" },
  { id: "laminacja-rzes", name: "Laminacja Rzęs", icon: Sparkles, duration: "60 min" },
  { id: "henna-brwi", name: "Henna Brwi", icon: Eye, duration: "30 min" },
  { id: "henna-rzes", name: "Henna Rzęs", icon: Sparkles, duration: "20 min" },
  { id: "przedluzanie-rzes", name: "Przedłużanie Rzęs", icon: Sparkles, duration: "90-120 min" },
]

interface ProcedureSelectProps {
  onSelect: (procedure: string) => void
  selected?: string
}

export function ProcedureSelect({ onSelect, selected }: ProcedureSelectProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {procedures.map((proc) => {
        const Icon = proc.icon
        const isSelected = selected === proc.name
        return (
          <button
            key={proc.id}
            onClick={() => onSelect(proc.name)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
              isSelected 
                ? "border-primary bg-primary/10 text-foreground" 
                : "border-border bg-card/50 hover:border-primary/50 hover:bg-card text-foreground"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{proc.name}</p>
              <p className="text-xs text-muted-foreground">{proc.duration}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export { procedures }
