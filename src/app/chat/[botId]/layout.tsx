export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-dvh bg-background">
      <div className="flex-1 overflow-hidden">{children}</div>
      <div className="text-center py-2 text-xs text-muted-foreground border-t bg-muted/30">
        Powered by <span className="font-semibold">SmartChat</span>
      </div>
    </div>
  );
}
