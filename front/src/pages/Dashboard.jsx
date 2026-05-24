import SectionCards from "@/components/section-cards";

export default function Dashboard({ onLogout }) {
  return (
    <div className="relative min-h-screen">
      <SectionCards />

      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md text-sm font-medium shadow-sm transition-colors"
        >
          Wyloguj się
        </button>
      </div>
    </div>
  );
}
