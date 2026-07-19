import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

export function ResponsiveDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  contentClassName = 'sm:max-w-[425px]',
}) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          className={contentClassName}
          {...(!description ? { 'aria-describedby': undefined } : {})}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        {...(!description ? { 'aria-describedby': undefined } : {})}
      >
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && (
            <DrawerDescription>{description}</DrawerDescription>
          )}
        </DrawerHeader>
        <div className="px-4 pb-8">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}