import { BookingWizard } from "@/components/booking/booking-wizard"
import { Sparkles } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">BeautyFlow</span>
          </Link>
          <Link 
            href="/admin" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Panel właściciela
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col border-x border-border bg-card/20">
          <BookingWizard />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>BeautyFlow - Rezerwacje Online</p>
        </div>
      </footer>
    </div>
  )
}
