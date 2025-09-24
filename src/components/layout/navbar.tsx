"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Bell,
  Car,
  HandCoins,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  User,
  UserCog,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-provider';
import { Button } from '@/components/ui/button';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useNotifications,
  type NotificationEntry,
  type NotificationType,
} from '@/contexts/notification-provider';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const notificationIcons: Record<NotificationType, { Icon: LucideIcon; className: string }> = {
  "new-request": { Icon: HandCoins, className: "text-primary" },
  "counter-offer": { Icon: ArrowLeftRight, className: "text-amber-500" },
  rejection: { Icon: XCircle, className: "text-destructive" },
};

export function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const latestNotifications = notifications.slice(0, 10);

  const handleNotificationsOpenChange = (open: boolean) => {
    setIsNotificationsOpen(open);
  };

  const buildNotificationUrl = (notification: NotificationEntry) => {
    const params = new URLSearchParams();
    params.set('notificacion', notification.id);
    if (notification.requestId) {
      params.set('solicitud', notification.requestId);
    }
    if (notification.rideId) {
      params.set('viaje', notification.rideId);
    }

    const queryString = params.toString();

    if (notification.source === 'driver') {
      return `/dashboard/conductor${queryString ? `?${queryString}` : ''}`;
    }

    if (notification.source === 'passenger') {
      return `/dashboard/pasajero${queryString ? `?${queryString}` : ''}`;
    }

    return '/';
  };

  const handleNotificationClick = (notification: NotificationEntry) => {
    markAsRead(notification.id);
    setIsNotificationsOpen(false);

    const targetUrl = buildNotificationUrl(notification);
    router.push(targetUrl);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
      toast({
        title: "No se pudo cerrar sesión",
        description: "Intentá nuevamente en unos instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const mainMenuItems: { label: string; href: string; icon: LucideIcon }[] = [
    {
      label: 'Panel del Conductor',
      href: '/dashboard/conductor',
      icon: LayoutDashboard,
    },
    {
      label: 'Panel del Pasajero',
      href: '/dashboard/pasajero',
      icon: User,
    },
    {
      label: 'Buscar Viajes',
      href: '/buscar-viajes',
      icon: Search,
    },
    {
      label: 'Crear Viaje',
      href: '/crear-viaje',
      icon: PlusCircle,
    },
  ];

  return (
    <nav className="bg-card shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:py-0">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Car className="h-8 w-8" />
            <span className="text-xl font-bold">Rueda Compartida</span>
          </Link>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  aria-label="Abrir menú de navegación"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full flex-col gap-6 p-6">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Car className="h-5 w-5" />
                    Navegación
                  </SheetTitle>
                </SheetHeader>
                {user ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'Usuario'} />
                      <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-tight">
                        {user.displayName || 'Usuario'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ) : null}
                <nav className="flex-1 space-y-1">
                  {mainMenuItems.map(({ href, label, icon: Icon }) => (
                    <SheetClose asChild key={href}>
                      <Link
                        href={href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-primary"
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                {!user ? (
                  <div className="space-y-2">
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login">
                          <LogIn className="mr-2 h-4 w-4" />
                          Iniciar Sesión
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link href="/register">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Registrate
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>
                ) : null}
              </SheetContent>
            </Sheet>
            {user ? (
              <>
                <DropdownMenu
                  open={isNotificationsOpen}
                  onOpenChange={handleNotificationsOpenChange}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-10 w-10 rounded-full"
                      aria-label={
                        unreadCount > 0
                          ? `Tenés ${unreadCount} notificaciones sin leer`
                          : "Notificaciones"
                      }
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-80 p-0"
                    align="end"
                    sideOffset={12}
                    forceMount
                  >
                    <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 font-semibold">
                      <span>Notificaciones</span>
                      {unreadCount > 0 ? (
                        <span className="text-xs text-destructive">
                          {unreadCount} nuevas
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Al día</span>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {latestNotifications.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No tenés notificaciones por ahora.
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto py-1">
                        {latestNotifications.map((notification) => {
                          const iconConfig = notificationIcons[notification.type];
                          const IconComponent = iconConfig.Icon;
                          const relativeTime = formatDistanceToNow(
                            notification.createdAt,
                            { addSuffix: true, locale: es },
                          );

                          return (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleNotificationClick(notification)}
                              className={cn(
                                "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors",
                                notification.read
                                  ? "hover:bg-muted/60"
                                  : "bg-muted/60 hover:bg-muted",
                              )}
                            >
                              <div className="mt-0.5">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full",
                                    notification.read
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-background",
                                  )}
                                >
                                  <IconComponent
                                    className={cn(
                                      "h-4 w-4",
                                      iconConfig.className,
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="font-medium leading-tight">
                                  {notification.title}
                                </p>
                                <p className="text-xs leading-snug text-muted-foreground">
                                  {notification.description}
                                </p>
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {relativeTime}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "Usuario"} />
                        <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.displayName || "Usuario"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/mi-perfil">
                        <UserCog className="mr-2 h-4 w-4" />
                        Mi perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/login" aria-label="Iniciar sesión">
                    <LogIn className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Iniciar Sesión</span>
                  </Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/register" aria-label="Registrate">
                    <UserPlus className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Registrate</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}